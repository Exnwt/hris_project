from rest_framework import serializers
from hris_app.models import Employee, ContractList, EmployeeEditStagging
from django.utils import timezone



class EmployeeSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True)
    position_name = serializers.CharField(source='position.name', read_only=True)
    section_name = serializers.CharField(source='section.name', read_only=True)
    total_contracts = serializers.SerializerMethodField()
    latest_contract_days_remaining = serializers.SerializerMethodField()
    latest_contract_start_date = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'
        
    def to_internal_value(self, data):
        # Buat copy dari data request agar mutable
        data = data.copy()
        
        # Ubah semua string kosong "" menjadi None
        for key, value in data.items():
            if isinstance(value, str) and value.strip() == "":
                data[key] = None

        return super().to_internal_value(data)

    def get_latest_contract(self, obj):
        """Helper method untuk mengambil kontrak terbaru berdasarkan end_date/start_date"""
        if not hasattr(obj, '_latest_contract_cache'):
            obj._latest_contract_cache = ContractList.objects.filter(employee=obj).order_by('-end_date', '-id').first()
        return obj._latest_contract_cache

    def get_total_contracts(self, obj):
        """1. Menghitung total kontrak karyawan"""
        return ContractList.objects.filter(employee=obj).count()

    def get_latest_contract_days_remaining(self, obj):
        """2. Menghitung sisa hari dari hari ini sampai end_date kontrak terbaru"""
        latest_contract = self.get_latest_contract(obj)
        if latest_contract and latest_contract.end_date:
            today = timezone.now().date()
            remaining_days = (latest_contract.end_date - today).days
            return remaining_days
        return None  # Return None jika tidak ada kontrak / kontrak PKWTT tanpa end_date

    def get_latest_contract_start_date(self, obj):
        """3. Mengambil start_date dari kontrak terakhir/terbaru"""
        latest_contract = self.get_latest_contract(obj)
        if latest_contract:
            return latest_contract.start_date
        return None


class EmployeeEditStaggingSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.CharField(source='requested_by.username', read_only=True)

    class Meta:
        model = EmployeeEditStagging
        fields = '__all__'





