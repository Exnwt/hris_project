from django.urls import include, path
from hris_app.views.api_view import APIEndpointViewSet, UserAccessAssignmentViewSet, GroupAccessAssignmentViewSet
from rest_framework.routers import DefaultRouter


app_name = 'api_access_assigment'
router = DefaultRouter()

router.register(r'APIEndpoints', APIEndpointViewSet, basename='APIEndpoint')
router.register(r'User-AA', UserAccessAssignmentViewSet, basename='userAA')
router.register(r'Group-AA', GroupAccessAssignmentViewSet, basename='groupAA')


urlpatterns = [
    path('', include(router.urls)),
]

urlpatterns = router.urls