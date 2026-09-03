from hris_app.models import ContractList, ContractHistory
from rest_framework import serializers

class ContractListSerializers(serializers.ModelSerializer):

    class Meta:
        model = ContractList
        fields = '__all__'        


class ContractHistorySerializers(serializers.ModelSerializer):

    class Meta:
        model = ContractHistory
        fields = '__all__'       