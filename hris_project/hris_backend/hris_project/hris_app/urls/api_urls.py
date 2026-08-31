from django.urls import include, path
from hris_app.views.api_view import APIAccessTemplateViewSet, UserAccessAssignmentViewSet, GroupAccessAssignmentViewSet
from rest_framework.routers import DefaultRouter


app_name = 'api_access_assigment'
router = DefaultRouter()

router.register(r'APItemplates', APIAccessTemplateViewSet, basename='APItemplate')
router.register(r'User-AA', UserAccessAssignmentViewSet, basename='userAA')
router.register(r'Group-AA', GroupAccessAssignmentViewSet, basename='groupAA')


urlpatterns = [
    path('', include(router.urls)),
]

urlpatterns = router.urls