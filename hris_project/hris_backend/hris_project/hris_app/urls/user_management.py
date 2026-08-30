from django.urls import include, path
from hris_app.views.user_view import UserViewSet
from hris_app.views.group_view import GroupViewSet
from rest_framework.routers import DefaultRouter

app_name = 'user_management'
router = DefaultRouter()

router.register(r'users', UserViewSet, basename='user')
router.register(r'groups', GroupViewSet, basename='group')

urlpatterns = [
    path('', include(router.urls)),
]

