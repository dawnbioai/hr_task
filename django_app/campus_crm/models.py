from django.db import models


class Department(models.Model):
    name = models.CharField(max_length=150, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Lead(models.Model):
    class Year(models.TextChoices):
        FIRST = "1st Year", "1st Year"
        SECOND = "2nd Year", "2nd Year"
        THIRD = "3rd Year", "3rd Year"
        FOURTH = "4th Year", "4th Year"
        MASTERS = "Masters", "Masters"
        PHD = "PhD", "PhD"

    class Source(models.TextChoices):
        SEMINAR = "On Campus Seminar", "On Campus Seminar"
        COORDINATORS = "Campus Co-ordinators", "Campus Co-ordinators"
        WORKSHOP = "Workshop", "Workshop"
        RESEARCH_TALK = "Research Talk", "Research Talk"
        TRAINING = "Training Program", "Training Program"

    class Status(models.TextChoices):
        HOT = "hot", "Hot"
        WARM = "warm", "Warm"
        COLD = "cold", "Cold"

    name = models.CharField(max_length=150)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    university = models.CharField(max_length=150, blank=True)
    department = models.CharField(max_length=150, blank=True)
    year = models.CharField(max_length=20, choices=Year.choices, blank=True)
    source = models.CharField(max_length=30, choices=Source.choices, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.COLD)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def as_dict(self):
        return {
            "id": self.pk,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "university": self.university,
            "department": self.department,
            "year": self.year,
            "source": self.source,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
