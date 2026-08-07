from django.core.management.base import BaseCommand

from campus_crm.models import Lead

SAMPLE_LEADS = [
    dict(name="Mashrur Rahman", email="mashrur@g.bracu.ac.bd", phone="01712345678", university="BRACU", department="Biotechnology & GE", year="3rd Year", source="On Campus Seminar", status="hot"),
    dict(name="Tanjina Islam", email="tanjina@northsouth.edu", phone="01812344321", university="NSU", department="Pharmacy", year="2nd Year", source="Campus Co-ordinators", status="warm"),
    dict(name="Rahat Hasan", email="rahat@nstu.edu.bd", phone="01912341234", university="NSTU", department="Microbiology", year="4th Year", source="Research Talk", status="cold"),
    dict(name="Farhan Khan", email="farhan.khan@du.ac.bd", phone="01612349876", university="DU", department="Biochemistry", year="3rd Year", source="Workshop", status="warm"),
    dict(name="Sadia Begum", email="sadia.bgctub@gmail.com", phone="01512348765", university="BGCTUB", department="Pharmacy", year="1st Year", source="Training Program", status="cold"),
    dict(name="Nujhat Nawar Naba", email="nujhatnaba149@gmail.com", phone="01312347654", university="BRACU", department="Biotechnology & GE", year="4th Year", source="Campus Co-ordinators", status="warm"),
    dict(name="Rifat Mahmud", email="rifat.mahmud@cuet.ac.bd", phone="01212346543", university="CUET", department="Biomedical Engg", year="2nd Year", source="Research Talk", status="hot"),
    dict(name="Lamia Sultana", email="lamia@ru.ac.bd", phone="01912345432", university="RU", department="Pharmacy", year="3rd Year", source="On Campus Seminar", status="cold"),
    dict(name="Arif Hossain", email="arif.hossain@iub.edu.bd", phone="01812344321", university="IUB", department="Microbiology", year="2nd Year", source="Workshop", status="warm"),
    dict(name="Nadia Akter", email="nadia.akter@aiub.edu", phone="01712343210", university="AIUB", department="Pharmacy", year="1st Year", source="Training Program", status="cold"),
    dict(name="Sabbir Ahmed", email="sabbir@sust.edu", phone="01612342109", university="SUST", department="Biochemistry", year="3rd Year", source="On Campus Seminar", status="hot"),
    dict(name="Mitu Roy", email="mitu.roy@brac.net", phone="01512341098", university="BRACU", department="Genetic Engg", year="2nd Year", source="Campus Co-ordinators", status="warm"),
]


class Command(BaseCommand):
    help = "Seed Campus CRM with the mockup's original sample leads (for local demo/testing)."

    def handle(self, *args, **options):
        created = 0
        for data in SAMPLE_LEADS:
            _, was_created = Lead.objects.get_or_create(email=data["email"], defaults=data)
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Seeded {created} sample lead(s)."))
