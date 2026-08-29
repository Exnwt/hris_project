from django.urls import path
from hris_app.views.auth import current_user


urlpatterns = [
    path("me/", current_user, name="current-user"),
]