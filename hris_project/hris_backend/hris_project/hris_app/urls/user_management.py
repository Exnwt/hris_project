from django.urls import path
from hris_app.views.user_view.py import UserViewSet
from hris_app.views.group_view.py import GroupViewSet

router.register(r'users', UserViewSet, basename='user')
router.register(r'groups', GroupViewSet, basename='group')
