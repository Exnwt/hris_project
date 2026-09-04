from hris_app.models import ContractList, ContractHistory, Employee 
from rest_framework import serializers

# 1. Buat Serializer Ringkas untuk Employee
class EmployeeSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'nik_karyawan', 'nama_lengkap']

# 2. Update ContractListSerializer
class ContractListSerializers(serializers.ModelSerializer):
    # Menyediakan objek employee lengkap untuk response (Read Only)
    employee_detail = EmployeeSimpleSerializer(source='employee', read_only=True)

    class Meta:
        model = ContractList
        fields = '__all__'


class ContractHistorySerializers(serializers.ModelSerializer):

    class Meta:
        model = ContractHistory
        fields = '__all__'       