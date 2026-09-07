from django.urls import include, path
from hris_app.views.contract_view import ContractListReadView,ContractDetailReadView,ContractCreateView,ContractUpdateView,ContractDeleteView, ContractHistoryViewSet
from hris_app.views.masterData_view import CompanyViewSet, DepartmentViewSet, SectionViewSet, PositionViewSet
from hris_app.views.onboarding import EmployeeViewSet
from rest_framework.routers import DefaultRouter



app_name = 'master_data'
router = DefaultRouter()

# router.register(r'ContractList', ContractListReadView, basename='ContractList')
# router.register(r'ContractHistory', ContractHistoryViewSet, basename='ContractHistory')

urlpatterns = [
    # ==========================================
    # COMPANY ENDPOINTS
    # ==========================================
    path('Company/', CompanyViewSet.as_view({'get': 'list'}), name='company-list'),
    path('Company/create/', CompanyViewSet.as_view({'post': 'create'}), name='company-create'),
    path('Company/<int:pk>/', CompanyViewSet.as_view({'get': 'retrieve'}), name='company-detail'),
    path('Company/<int:pk>/update/', CompanyViewSet.as_view({'put': 'update', 'patch': 'partial_update'}), name='company-update'),
    path('Company/<int:pk>/delete/', CompanyViewSet.as_view({'delete': 'destroy'}), name='company-delete'),

    # ==========================================
    # DEPARTMENT ENDPOINTS
    # ==========================================
    path('Department/', DepartmentViewSet.as_view({'get': 'list'}), name='department-list'),
    path('Department/create/', DepartmentViewSet.as_view({'post': 'create'}), name='department-create'),
    path('Department/<int:pk>/', DepartmentViewSet.as_view({'get': 'retrieve'}), name='department-detail'),
    path('Department/<int:pk>/update/', DepartmentViewSet.as_view({'put': 'update', 'patch': 'partial_update'}), name='department-update'),
    path('Department/<int:pk>/delete/', DepartmentViewSet.as_view({'delete': 'destroy'}), name='department-delete'),

    # ==========================================
    # SECTION ENDPOINTS
    # ==========================================
    path('Section/', SectionViewSet.as_view({'get': 'list'}), name='section-list'),
    path('Section/create/', SectionViewSet.as_view({'post': 'create'}), name='section-create'),
    path('Section/<int:pk>/', SectionViewSet.as_view({'get': 'retrieve'}), name='section-detail'),
    path('Section/<int:pk>/update/', SectionViewSet.as_view({'put': 'update', 'patch': 'partial_update'}), name='section-update'),
    path('Section/<int:pk>/delete/', SectionViewSet.as_view({'delete': 'destroy'}), name='section-delete'),

    # ==========================================
    # POSITION ENDPOINTS
    # ==========================================
    path('Position/', PositionViewSet.as_view({'get': 'list'}), name='position-list'),
    path('Position/create/', PositionViewSet.as_view({'post': 'create'}), name='position-create'),
    path('Position/<int:pk>/', PositionViewSet.as_view({'get': 'retrieve'}), name='position-detail'),
    path('Position/<int:pk>/update/', PositionViewSet.as_view({'put': 'update', 'patch': 'partial_update'}), name='position-update'),
    path('Position/<int:pk>/delete/', PositionViewSet.as_view({'delete': 'destroy'}), name='position-delete'),

    # ==========================================
    # EMPLOYEE ENDPOINTS
    # ==========================================
    path('Employees/', EmployeeViewSet.as_view({'get': 'list'}), name='employee-list'),
    path('Employees/create/', EmployeeViewSet.as_view({'post': 'create'}), name='employee-create'),
    path('Employees/<int:pk>/', EmployeeViewSet.as_view({'get': 'retrieve'}), name='employee-detail'),
    path('Employees/<int:pk>/update/', EmployeeViewSet.as_view({'put': 'update', 'patch': 'partial_update'}), name='employee-update'),
    path('Employees/<int:pk>/delete/', EmployeeViewSet.as_view({'delete': 'destroy'}), name='employee-delete'),

    # ==========================================
    # CONTRACT ENDPOINTS
    # ==========================================
    path('ContractList/', ContractListReadView.as_view(), name='ContractList'),
    path('ContractList/<int:pk>/', ContractDetailReadView.as_view(), name='contract-detail'),
    path('ContractList/create/', ContractCreateView.as_view(), name='contract-create'),
    path('ContractList/<int:pk>/update/', ContractUpdateView.as_view(), name='contract-update'),
    path('ContractList/<int:pk>/delete/', ContractDeleteView.as_view(), name='contract-delete'),


]

# urlpatterns = router.urls