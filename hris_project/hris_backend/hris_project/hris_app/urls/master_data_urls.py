from django.urls import include, path
from hris_app.views.contract_view import ContractListReadView,ContractDetailReadView,ContractCreateView,ContractUpdateView,ContractDeleteView, ContractHistoryViewSet
from rest_framework.routers import DefaultRouter



app_name = 'master_data'
router = DefaultRouter()

# router.register(r'ContractList', ContractListReadView, basename='ContractList')
# router.register(r'ContractHistory', ContractHistoryViewSet, basename='ContractHistory')

urlpatterns = [
    path('ContractList/', ContractListReadView.as_view(), name='ContractList'),
    path('ContractList/<int:pk>/', ContractDetailReadView.as_view(), name='contract-detail'),
    path('ContractList/create/', ContractCreateView.as_view(), name='contract-create'),
    path('ContractList/<int:pk>/update/', ContractUpdateView.as_view(), name='contract-update'),
    path('ContractList/<int:pk>/delete/', ContractDeleteView.as_view(), name='contract-delete'),
]

# urlpatterns = router.urls