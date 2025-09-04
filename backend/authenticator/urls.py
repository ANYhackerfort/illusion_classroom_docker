from django.http import JsonResponse
from django.urls import path

from .views import (
    google_login_view,
    create_meeting,
    get_user_meetings,
    get_meeting_segments,
    upload_meeting_video,
    refresh_meeting_segments,
    get_user_info,
    check_meeting_access,
    store_bot,
    return_bot_answers,
    get_all_bots,
    google_login_view_test,
)

urlpatterns = [
    path('google-login/', google_login_view),
    path('create_meeting/', create_meeting, name='create-meeting'),
    path('get_user_meetings/', get_user_meetings, name='get_user_meetings'),
    path('userinfo/', get_user_info, name="get_user_info"),
    path('google-login-test/', google_login_view_test),
    
    path('get_meeting_segments/<str:meeting_name>/', get_meeting_segments, name='get_meeting_segments'),
    path('upload_meeting_video/<str:meeting_name>/', upload_meeting_video, name='upload_meeting_video'),
    path('upload_meeting_segments/<str:meeting_name>/', refresh_meeting_segments, name='upload_meeting_segments'),
    path("check_access/<str:meeting_id>/", check_meeting_access, name="check_meeting_access"),
    path("store_bot/<str:meeting_name>/", store_bot, name="store_bot"),
    path("get_bot_answers/<str:meeting_name>/", return_bot_answers, name="return_bot_answers"),  # ✅ Add this
    path("get_all_bots/<str:meeting_name>/", get_all_bots, name="get_all_bots"),  # ✅ ADD THIS
    
    path("health/", lambda r: JsonResponse({"ok": True})),

]
