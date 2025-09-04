import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from django.contrib.auth import get_user_model, login
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

import requests
from .models import Meeting, VideoSegment, QuestionCard, Bot
from django.utils.timezone import now
from django.core.serializers.json import DjangoJSONEncoder
from django.core.cache import cache

import os
from django.conf import settings
import datetime
import random

@csrf_exempt
def google_login_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        access_token = data.get('token')

        # Call Google userinfo endpoint
        user_info = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        ).json()

        email = user_info.get("email")
        name = user_info.get("name")

        if not email:
            return JsonResponse({'error': 'Email not found'}, status=400)

        User = get_user_model()
        user, _ = User.objects.get_or_create(
            email=email,
            defaults={'username': email, 'first_name': name or ''}
        )
        login(request, user)

        return JsonResponse({'message': 'Logged in', 'email': user.email})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def google_login_view_test(request):
    print("✅ HIT GOOGLE LOGIN VIEW")
    return JsonResponse({'ok': True})

@login_required
def get_user_info(request):
    print("🔍 GET USER INFO:", request.user.email)
    return JsonResponse({
        "email": request.user.email,
    })
    
@csrf_exempt
@login_required
def check_login_status(request):
    user = request.user
    return JsonResponse({
        'logged_in': True,
        'email': user.email,
        'username': user.username,
    })
    
@csrf_exempt
@login_required
def create_meeting(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)

        # Extract fields
        image_url = data["imageUrl"]
        description = data["description"]
        questions_count = data["questionsCount"]
        video_length_sec = data["videoLengthSec"]
        tags = data["tags"]  # Expecting list
        shared_with = data.get("sharedWith", [])
        video_segments = data.get("VideoSegments", [])
        name = data.get("name", "") 

        user = request.user

        # Save meeting
        meeting = Meeting.objects.create(
            name=name,
            image_url=image_url,
            description=description,
            questions_count=questions_count,
            video_length_sec=video_length_sec,
            tags=tags,
            created_at=now(),
            owner=user,
            shared_with=shared_with,
        )

        # Save video segments (optional model depending on schema)
        for seg in video_segments:
            q_data = seg.get("questionCardData")
            question_card = None
            if seg.get("isQuestionCard") and q_data:
                question_card = QuestionCard.objects.create(
                    question=q_data["question"],
                    answers=q_data["answers"],
                    difficulty=q_data["difficulty"],
                    type=q_data["type"]
                )
            VideoSegment.objects.create(
                meeting=meeting,
                source_start=seg["source"][0],
                source_end=seg["source"][1],
                question_card=question_card
            )
            
        cache.delete(f"user_meetings:{user.id}")

        return JsonResponse({'message': 'Meeting created successfully'})

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)
    
@login_required
def get_user_meetings(request):
    try:
        user = request.user
        cache_key = f"user_meetings:{user.id}"
        print("🔑 Cache key:", cache_key)

        cached_data = cache.get(cache_key)
        if cached_data:
            print("📦 Using cached data")
            return JsonResponse(cached_data)

        meetings = Meeting.objects.filter(owner=user)
        print("🔍 DB Query:", meetings)

        meeting_data = []
        for m in meetings:
            meeting_data.append({
                "name": m.name,
                "imageUrl": m.image_url,
                "description": m.description,
                "questionsCount": m.questions_count,
                "videoLengthSec": m.video_length_sec,
                "tags": m.tags,
                "createdAt": m.created_at.isoformat(),
                "ownerEmail": m.owner.email,
                "sharedWith": m.shared_with,
            })

        response_obj = {"meetings": meeting_data}
        cache.set(cache_key, response_obj, timeout=60 * 5)  # ✅ Save as dict, not JSON string
        return JsonResponse(response_obj)

    except Exception as e:
        print("🔥 GET USER MEETINGS ERROR:", e)
        return JsonResponse({'error': str(e)}, status=400)
    
@csrf_exempt
@login_required
def get_meeting_segments(request, meeting_name):
    try:
        user = request.user
        meeting = Meeting.objects.get(name=meeting_name, owner=user)
        segments = meeting.segments.all()

        segment_data = []
        for seg in segments:
            segment_info = {
                "sourceStart": seg.source_start,
                "sourceEnd": seg.source_end,
                "isQuestionCard": seg.question_card is not None,
            }

            if seg.question_card:
                qc = seg.question_card
                segment_info["questionCard"] = {
                    "id": str(qc.id),
                    "question": qc.question,
                    "answers": qc.answers,
                    "difficulty": qc.difficulty,
                    "type": qc.type,
                    "displayType": qc.display_type,
                    "showWinner": qc.show_winner,
                    "live": qc.live
                }

            segment_data.append(segment_info)

        return JsonResponse({
            "meetingName": meeting.name,
            "meetingLink": f"/media/videos/{meeting.name}.mp4",
            "segments": segment_data
        }, encoder=DjangoJSONEncoder)

    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found or not owned by user'}, status=404)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@login_required
def upload_meeting_video(request, meeting_name):
    print("🔵 [upload_meeting_video] View called.")
    print(f"🧑 Authenticated user: {request.user.username}")
    print(f"📺 Meeting name: {meeting_name}")
    print(f"🔁 Request method: {request.method}")

    if request.method != "POST":
        print("❌ Not a POST request.")
        return JsonResponse({"error": "POST request required"}, status=405)

    video_file = request.FILES.get("video_file")
    if not video_file:
        print("❌ video_file not found in request.FILES.")
        return JsonResponse({"error": "Missing video_file"}, status=400)

    print(f"📦 Received file: {video_file.name}")
    print(f"📦 File size: {video_file.size} bytes")

    username = request.user.username
    user_folder = os.path.join(settings.MEDIA_ROOT, "videos", username, meeting_name)
    print(f"📁 Target folder: {user_folder}")

    try:
        os.makedirs(user_folder, exist_ok=True)
        print(f"✅ Created folder (if needed): {user_folder}")
    except Exception as e:
        print(f"❌ Failed to create folder: {e}")
        return JsonResponse({"error": "Failed to create folder"}, status=500)

    full_path = os.path.join(user_folder, "current_playing.webm")
    print(f"💾 Saving to: {full_path}")

    try:
        with open(full_path, "wb") as f:
            for chunk in video_file.chunks():
                f.write(chunk)
        print("✅ File written successfully.")
    except Exception as e:
        print(f"❌ Failed to write file: {e}")
        return JsonResponse({"error": "Failed to save video"}, status=500)

    return JsonResponse({"message": "Full video uploaded successfully"})

@csrf_exempt
@login_required
def refresh_meeting_segments(request, meeting_name):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=405)

    try:
        data = json.loads(request.body)
        video_segments = data.get("VideoSegments", [])
        user = request.user

        meeting = Meeting.objects.get(name=meeting_name, owner=user)

        # Clear old segments
        VideoSegment.objects.filter(meeting=meeting).delete()

        new_segments = []

        for seg in video_segments:
            q_data = seg.get("questionCardData")
            question_card = None
            q_card_dict = None

            if seg.get("isQuestionCard") and q_data:
                question_card = QuestionCard.objects.create(
                    question=q_data["question"],
                    answers=q_data["answers"],
                    difficulty=q_data["difficulty"],
                    type=q_data["type"],
                    display_type=q_data.get("displayType"),
                    show_winner=q_data.get("showWinner"),
                    live=q_data.get("live")
                )
                q_card_dict = {
                    "id": str(question_card.id),
                    "question": question_card.question,
                    "answers": question_card.answers,
                    "difficulty": question_card.difficulty,
                    "type": question_card.type,
                    "displayType": question_card.display_type,
                    "showWinner": question_card.show_winner,
                    "live": question_card.live,
                }

            VideoSegment.objects.create(
                meeting=meeting,
                source_start=seg["source"][0],
                source_end=seg["source"][1],
                question_card=question_card
            )

            new_segments.append({
                "source": [seg["source"][0], seg["source"][1]],
                "isQuestionCard": seg.get("isQuestionCard", False),
                "questionCardData": q_card_dict
            })

        cache.set(f"video_segments:{meeting.id}", new_segments, timeout=60 * 5)

        return JsonResponse({'message': 'Video segments updated and cached successfully'})

    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found or not owned by user'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
@login_required
def check_meeting_access(request, meeting_id):
    user_email = request.user.email
    cache_key = f"meeting_access:{meeting_id}:{user_email}"

    # Try cache first
    access_result = cache.get(cache_key)
    if access_result is not None:
        return JsonResponse({"access": access_result})

    try:
        meeting = Meeting.objects.get(name=meeting_id)
    except Meeting.DoesNotExist:
        return JsonResponse({"access": False})

    # Check access
    has_access = (request.user == meeting.owner) or (user_email in meeting.shared_with)

    # Cache the result (for 5 minutes = 300 seconds)
    cache.set(cache_key, has_access, timeout=300)

    return JsonResponse({"access": has_access})

@csrf_exempt
@login_required
def store_bot(request, meeting_name):
    if request.method != "POST":
        return JsonResponse({"error": "POST request required"}, status=405)
    try:
        user = request.user

        # TODO: Verify the user has ownership of the meeting_room before storing the bot
        meeting = Meeting.objects.get(name=meeting_name)
        if meeting.owner != user:
            return JsonResponse({"error": "User does not own this meeting"}, status=403)

        unique_id = request.POST.get("unique_id")
        name = request.POST.get("name")
        memory = request.POST.get("memory")
        answers = request.POST.get("answers")
        image_file = request.FILES.get("img")

        if not all([unique_id, name]):
            return JsonResponse({"error": "Missing required fields"}, status=400)

        # Parse answers JSON string → list
        if isinstance(answers, str):
            try:
                answers = json.loads(answers)
            except json.JSONDecodeError:
                return JsonResponse({"error": "Invalid JSON for answers"}, status=400)

        # Save to DB
        bot = Bot.objects.create(
            meeting=meeting,
            identifier=unique_id,
            name=name,
            memory=memory,
            answers=answers,
            image=image_file
        )

        # ✅ Save to Redis using unique_id as key
        redis_key = f"bot:{unique_id}"
        redis_value = {
            "name": name,
            "memory": memory,
            "answers": answers,
        }
        cache.set(redis_key, redis_value, timeout=60 * 10)  # 10 minutes or adjust as needed

        return JsonResponse({"message": "Bot stored and cached", "bot_id": bot.id})

    except Meeting.DoesNotExist:
        return JsonResponse({"error": "Meeting not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
    
@csrf_exempt
@login_required
def return_bot_answers(request, meeting_name):
    try:
        print("== Incoming GET Params ==")
        print("Raw meeting_name:", meeting_name)
        print("Decoded meeting_name:", meeting_name.encode().decode('utf-8', 'ignore'))
        print("GET:", request.GET)

        user = request.user
        current_question = int(request.GET.get("currentQuestion", -1))
        start_time = float(request.GET.get("startTime", -1))
        end_time = float(request.GET.get("endTime", -1))
        answers_raw = request.GET.get("answers", "")
        frontend_answers = answers_raw.split(",") if answers_raw else []


        print("Parsed current_question:", current_question)
        print("Parsed start_time:", start_time)
        print("Parsed end_time:", end_time)
        print("Frontend-provided answers:", frontend_answers)

        if (
            current_question < 0 or start_time < 0 or end_time < 0 or
            start_time >= end_time or not frontend_answers
        ):
            return JsonResponse({"error": "Invalid parameters"}, status=400)

        meeting = Meeting.objects.get(name=meeting_name)
        print("Meeting found:", meeting.name)

        bots = meeting.bots.all()
        print(f"Found {bots.count()} bots")

        results = []

        for bot in bots:
            cache_key = f"bot:{bot.identifier}"
            print("Looking up cache key:", cache_key)
            bot_data = cache.get(cache_key)

            if bot_data is None:
                print("Bot not in cache, using DB fallback")
                bot_data = {
                    "name": bot.name,
                    "answers": bot.answers,
                }

            bot_answers = bot_data.get("answers", [])
            selected_answer = ""

            # ✅ If bot has its own answer for current_question → use it
            if (
                isinstance(bot_answers, list) and
                0 <= current_question < len(bot_answers) and
                bot_answers[current_question]
            ):
                selected_answer = bot_answers[current_question]
            else:
                # ❌ Otherwise → randomly pick from the frontend-provided list
                selected_answer = random.choice(frontend_answers)

            random_timestamp = round(random.uniform(start_time, end_time), 2)

            results.append({
                "name": bot_data.get("name"),
                "answer": selected_answer,
                "timestamp": random_timestamp
            })

        return JsonResponse({"botAnswers": results})

    except Meeting.DoesNotExist:
        print("Meeting not found!")
        return JsonResponse({"error": "Meeting not found"}, status=404)
    except Exception as e:
        print("Exception occurred:", str(e))
        return JsonResponse({"error": str(e)}, status=400)
    
@csrf_exempt
@login_required
def get_all_bots(request, meeting_name):
    try:
        meeting = Meeting.objects.get(name=meeting_name)
        bots = Bot.objects.filter(meeting=meeting)

        bot_list = []
        for bot in bots:
            bot_list.append({
                "identifier": bot.identifier,
                "name": bot.name,
                "memory": bot.memory,
                "answers": bot.answers,
                "image": request.build_absolute_uri(bot.image.url) if bot.image else None,
            })

        return JsonResponse({"bots": bot_list})
    except Meeting.DoesNotExist:
        return JsonResponse({"error": "Meeting not found"}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)
