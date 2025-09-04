from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Meeting(models.Model):
    name = models.CharField(max_length=255)
    image_url = models.CharField(max_length=500)
    description = models.TextField()
    questions_count = models.IntegerField()
    video_length_sec = models.IntegerField()
    tags = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    shared_with = models.JSONField(default=list)

class QuestionCard(models.Model):
    question = models.TextField()
    answers = models.JSONField()
    
    # Must match TypeScript literals
    difficulty = models.CharField(
        max_length=10,
        choices=[("easy", "Easy"), ("medium", "Medium"), ("hard", "Hard")]
    )
    type = models.CharField(
        max_length=10,
        choices=[
            ("slider", "Slider"),
            ("short", "Short"),
            ("mc", "Multiple Choice"),
            ("match", "Match"),
            ("rank", "Rank"),
            ("ai", "AI"),
        ]
    )

    # Optional fields
    display_type = models.CharField(
        max_length=10,
        choices=[("face", "Face"), ("initial", "Initial"), ("anonymous", "Anonymous")],
        null=True,
        blank=True
    )
    show_winner = models.BooleanField(null=True, blank=True)
    live = models.BooleanField(null=True, blank=True)

class VideoSegment(models.Model):
    meeting = models.ForeignKey(Meeting, on_delete=models.CASCADE, related_name='segments')
    source_start = models.FloatField()  # changed from IntegerField
    source_end = models.FloatField() 
    question_card = models.ForeignKey(QuestionCard, on_delete=models.SET_NULL, null=True, blank=True)
    
class Bot(models.Model):
    meeting = models.ForeignKey(
        "Meeting", on_delete=models.CASCADE, related_name="bots"
    )  # one-to-many: one meeting, many bots

    identifier = models.CharField(max_length=100, unique=True)  # e.g., uuid or slug
    name = models.CharField(max_length=255)

    memory = models.TextField(null=True, blank=True)  # allows empty memory
    answers = models.JSONField(null=True, blank=True)  # allows null or missing list

    image = models.ImageField(
        upload_to="bot_images/",  # stored in MEDIA_ROOT/bot_images/
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Bot {self.name} ({self.identifier})"