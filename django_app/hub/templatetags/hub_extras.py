from django import template
from django.utils.safestring import mark_safe

register = template.Library()

AVATAR_TINTS = ["#E3FBF8", "#FDF1DF", "#EFEBFB", "#EEF1F5"]
AVATAR_TEXT = ["#046B62", "#946318", "#5B4FA8", "#42506B"]

STATUS_LABEL = {"todo": "To-Do", "progress": "In Progress", "done": "Done"}
STATUS_DOT = {"todo": "#5B6B82", "progress": "#F0A93A", "done": "#00C4B4"}
STATUS_TEXT = {"todo": "#5B6B82", "progress": "#946318", "done": "#046B62"}


def _tint_index(name):
    return sum(ord(c) for c in (name or "")) % 4


@register.filter
def avatar_bg(name):
    return AVATAR_TINTS[_tint_index(name)]


@register.filter
def avatar_fg(name):
    return AVATAR_TEXT[_tint_index(name)]


@register.filter
def initials(name):
    parts = (name or "").split()
    return "".join(p[0] for p in parts[:2]).upper()


@register.simple_tag
def status_chip(status):
    label = STATUS_LABEL.get(status, status)
    dot = STATUS_DOT.get(status, "#5B6B82")
    text = STATUS_TEXT.get(status, "#5B6B82")
    return mark_safe(
        f'<span class="inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2.5 py-1 '
        f'rounded-full border border-[#E7ECF1] bg-white whitespace-nowrap" style="color:{text}">'
        f'<span class="w-1.5 h-1.5 rounded-full inline-block shrink-0" style="background:{dot}"></span>'
        f'{label}</span>'
    )


@register.simple_tag
def seg_bar(*segments):
    """segments: alternating value, color pairs, e.g. seg_bar todo "#5B6B82" progress "#F0A93A" """
    pairs = [(segments[i], segments[i + 1]) for i in range(0, len(segments) - 1, 2)]
    total = sum(v for v, _ in pairs) or 1
    parts = "".join(
        f'<div style="width:{v / total * 100}%;background:{c}" class="h-full"></div>'
        for v, c in pairs if v
    )
    return mark_safe(
        f'<div class="flex h-2 rounded-full overflow-hidden bg-[#EEF1F5] mb-2">{parts}</div>'
    )


@register.simple_tag
def due_note(due, today, status=None):
    if not due or status == "done":
        return ""
    diff = (due - today).days
    if diff < 0:
        n = abs(diff)
        return mark_safe(
            f'<div class="text-[11.5px] mt-2 font-semibold" style="color:#B23934">'
            f'Overdue by {n} day{"s" if n != 1 else ""}</div>'
        )
    if diff <= 3:
        return mark_safe(
            f'<div class="text-[11.5px] mt-2" style="color:#946318">'
            f'Due in {diff} day{"s" if diff != 1 else ""}</div>'
        )
    return mark_safe(
        f'<div class="text-[11.5px] mt-2 text-[#5B6B82]">Due {due.strftime("%d %b %Y")}</div>'
    )


@register.filter
def days_between(a, b):
    if not a or not b:
        return None
    return (a - b).days
