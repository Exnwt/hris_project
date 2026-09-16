from django.urls import include, path
from hris_app.views import EmployeeListView, EmployeeDetailView, EmployeeCreateView, EmployeeUpdateView, EmployeeDeleteView, EmployeeEditStaggingListView, SubmitEmployeeEditView, ApproveEmployeeUpdateView, CompanyViewSet, DepartmentListView, DepartmentDetailView, DepartmentCreateView, DepartmentCreateView, DepartmentUpdateView, DepartmentDeleteView, SectionListView, SectionDetailView, SectionCreateView, SectionUpdateView, SectionDeleteView, PositionListView, PositionDetailView, PositionCreateView, PositionUpdateView, PositionDeleteView, ContractListReadView,ContractDetailReadView,ContractCreateView,ContractUpdateView,ContractDeleteView, ContractHistoryViewSet, AreaListView, AreaDetailView, AreaCreateView, AreaUpdateView, AreaDeleteView
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
    path('Department/', DepartmentListView.as_view(), name='department-list'),
    path('Department/create/', DepartmentCreateView.as_view(), name='department-create'),
    path('Department/<int:pk>/', DepartmentDetailView.as_view(), name='department-detail'),
    path('Department/<int:pk>/update/', DepartmentUpdateView.as_view(), name='department-update'),
    path('Department/<int:pk>/delete/', DepartmentDeleteView.as_view(), name='department-delete'),

    # ==========================================
    # SECTION ENDPOINTS
    # ==========================================
    path('Area/', AreaListView.as_view(), name='section-list'),
    path('Area/create/', AreaCreateView.as_view(), name='section-create'),
    path('Area/<int:pk>/', AreaDetailView.as_view(), name='section-detail'),
    path('Area/<int:pk>/update/', AreaUpdateView.as_view(), name='section-update'),
    path('Area/<int:pk>/delete/', AreaDeleteView.as_view(), name='section-delete'),

    # ==========================================
    # SECTION ENDPOINTS
    # ==========================================
    path('Section/', SectionListView.as_view(), name='section-list'),
    path('Section/create/', SectionCreateView.as_view(), name='section-create'),
    path('Section/<int:pk>/', SectionDetailView.as_view(), name='section-detail'),
    path('Section/<int:pk>/update/', SectionUpdateView.as_view(), name='section-update'),
    path('Section/<int:pk>/delete/', SectionDeleteView.as_view(), name='section-delete'),

    # ==========================================
    # POSITION ENDPOINTS
    # ==========================================
    path('Position/', PositionListView.as_view(), name='position-list'),
    path('Position/create/', PositionCreateView.as_view(), name='position-create'),
    path('Position/<int:pk>/', PositionDetailView.as_view(), name='position-detail'),
    path('Position/<int:pk>/update/', PositionUpdateView.as_view(), name='position-update'),
    path('Position/<int:pk>/delete/', PositionDeleteView.as_view(), name='position-delete'),

    # ==========================================
    # EMPLOYEE ENDPOINTS
    # ==========================================
    path('Employees/', EmployeeListView.as_view(), name='employee-list'),
    path('Employees/create/', EmployeeCreateView.as_view(), name='employee-create'),
    path('Employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
    path('Employees/<int:pk>/update/', EmployeeUpdateView.as_view(), name='employee-update'),
    # path('Employees/<int:pk>/delete/', EmployeeDeleteView.as_view(), name='employee-delete'),

    # ==========================================
    # EMPLOYEE EDIT STAGGING ENDPOINTS
    # ==========================================
    path('employee-stagging/', EmployeeEditStaggingListView.as_view(), name='employee-stagging-list'),

    # Endpoint untuk submit pengajuan edit data karyawan
    path('employee-stagging/submit/', SubmitEmployeeEditView.as_view(), name='employee-stagging-submit'),

    # Endpoint untuk melakukan approve/reject permohonan (menggunakan request_id di URL)
    path('employee-stagging/<int:request_id>/approve/', ApproveEmployeeUpdateView.as_view(), name='employee-stagging-approve'),

    # ==========================================
    # CONTRACT ENDPOINTS
    # ==========================================
    path('ContractList/', ContractListReadView.as_view(), name='ContractList'),
    path('ContractList/<int:pk>/', ContractDetailReadView.as_view(), name='contract-detail'),
    path('ContractList/create/', ContractCreateView.as_view(), name='contract-create'),
    path('ContractList/<int:pk>/update/', ContractUpdateView.as_view(), name='contract-update'),
    # path('ContractList/<int:pk>/delete/', ContractDeleteView.as_view(), name='contract-delete'),


]

# urlpatterns = router.urls