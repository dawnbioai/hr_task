import csv
import io
import json

from django.contrib.auth.decorators import login_required
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import get_object_or_404, render
from django.views.decorators.http import require_POST

from .models import Department, Lead

REQUIRED_CSV_COLUMNS = ["name", "email", "phone", "university", "department", "year", "source"]


@login_required
def leads_page(request):
    return render(request, "crm/leads.html")


@login_required
def analytics_page(request):
    return render(request, "crm/analytics.html")


@login_required
def api_department_list_create(request):
    if request.method == "GET":
        return JsonResponse({"departments": list(Department.objects.values_list("name", flat=True))})

    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except (ValueError, TypeError):
            return HttpResponseBadRequest("Invalid JSON body")

        name = (data.get("name") or "").strip()
        if not name:
            return JsonResponse({"error": "Department name is required."}, status=400)

        dept, created = Department.objects.get_or_create(name=name)
        if not created:
            return JsonResponse({"error": f'"{name}" already exists.'}, status=400)
        return JsonResponse({"department": dept.name}, status=201)

    return HttpResponseBadRequest("Unsupported method")


@login_required
def api_lead_list_create(request):
    if request.method == "GET":
        leads = list(Lead.objects.all())
        return JsonResponse({"leads": [lead.as_dict() for lead in leads]})

    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except (ValueError, TypeError):
            return HttpResponseBadRequest("Invalid JSON body")

        name = (data.get("name") or "").strip()
        if not name:
            return JsonResponse({"error": "Name is required."}, status=400)

        status = data.get("status") or Lead.Status.COLD
        if status not in Lead.Status.values:
            status = Lead.Status.COLD

        lead = Lead.objects.create(
            name=name,
            email=(data.get("email") or "").strip(),
            phone=(data.get("phone") or "").strip(),
            university=(data.get("university") or "").strip(),
            department=(data.get("department") or "").strip(),
            year=data.get("year") or "",
            source=data.get("source") or "",
            status=status,
        )
        return JsonResponse({"lead": lead.as_dict()}, status=201)

    return HttpResponseBadRequest("Unsupported method")


@require_POST
@login_required
def api_lead_status_update(request, pk):
    lead = get_object_or_404(Lead, pk=pk)
    try:
        data = json.loads(request.body)
    except (ValueError, TypeError):
        return HttpResponseBadRequest("Invalid JSON body")

    status = data.get("status")
    if status not in Lead.Status.values:
        return JsonResponse({"error": "Invalid status."}, status=400)

    lead.status = status
    lead.save()
    return JsonResponse({"lead": lead.as_dict()})


@require_POST
@login_required
def api_lead_csv_upload(request):
    upload = request.FILES.get("file")
    if not upload:
        return JsonResponse({"error": "No file uploaded."}, status=400)

    try:
        decoded = upload.read().decode("utf-8-sig")
    except UnicodeDecodeError:
        return JsonResponse({"error": "Could not read file — please upload a UTF-8 CSV."}, status=400)

    reader = csv.reader(io.StringIO(decoded))
    rows = list(reader)
    if not rows:
        return JsonResponse({"error": "The CSV file is empty."}, status=400)

    header = [h.strip().lower() for h in rows[0]]
    missing = [col for col in REQUIRED_CSV_COLUMNS if col not in header]
    if missing:
        return JsonResponse({
            "error": f"Missing required column(s): {', '.join(missing)}. "
                     f"Expected: {', '.join(c.title() for c in REQUIRED_CSV_COLUMNS)}."
        }, status=400)

    col_index = {col: header.index(col) for col in REQUIRED_CSV_COLUMNS}
    status_index = header.index("status") if "status" in header else None

    created = 0
    skipped = 0
    duplicates = 0
    seen_email_source = set()
    new_leads = []
    for row in rows[1:]:
        if not row or not any(cell.strip() for cell in row):
            continue

        def cell(col):
            idx = col_index[col]
            return row[idx].strip() if idx < len(row) else ""

        name = cell("name")
        if not name:
            skipped += 1
            continue

        email = cell("email")
        source = cell("source")
        # De-dupe within this file: same Email + Source appearing more than
        # once almost always means an accidental double form submission —
        # keep the first occurrence, drop the rest. Only applied when email
        # is actually present, so blank-email rows never false-match.
        if email:
            dedup_key = (email.lower(), source.lower())
            if dedup_key in seen_email_source:
                duplicates += 1
                continue
            seen_email_source.add(dedup_key)

        status = Lead.Status.COLD
        if status_index is not None and status_index < len(row):
            candidate = row[status_index].strip().lower()
            if candidate in Lead.Status.values:
                status = candidate

        lead = Lead.objects.create(
            name=name,
            email=email,
            phone=cell("phone"),
            university=cell("university"),
            department=cell("department"),
            year=cell("year"),
            source=source,
            status=status,
        )
        new_leads.append(lead)
        created += 1

    return JsonResponse({
        "created": created,
        "skipped": skipped,
        "duplicates": duplicates,
        "leads": [lead.as_dict() for lead in new_leads],
    })
