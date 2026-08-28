from django.urls import include, path

app_name = 'hris_app_api'

urlpatterns = [
    path('onboarding/', include('hris_app.urls.api_urls.onboarding')),
    # path('payroll/', include('hris_app.urls.api_urls.payroll')), # contoh route API lain
]