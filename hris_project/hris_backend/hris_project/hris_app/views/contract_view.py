from hris_app.models import ContractList, ContractHistory
from rest_framework import generics
from rest_framework import viewsets, permissions
from hris_app.serializers.contract_serializers import ContractListSerializers, ContractHistorySerializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication  # Django Token 
from rest_framework_simplejwt.authentication import JWTAuthentication
from hris_app.permissions import HasAPIAccessPermission


# 1. Khusus READ ALL (List)
class ContractListReadView(generics.ListAPIView):
    api_codename = 'ContractList'
    queryset = ContractList.objects.all()
    serializer_class = ContractListSerializers
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasAPIAccessPermission]

# 2. Khusus READ DETAIL
class ContractDetailReadView(generics.RetrieveAPIView):
    api_codename = 'ContractDetail'
    queryset = ContractList.objects.all()
    serializer_class = ContractListSerializers
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasAPIAccessPermission]

# 3. Khusus CREATE
class ContractCreateView(generics.CreateAPIView):
    api_codename = 'ContractCreate'
    queryset = ContractList.objects.all()
    serializer_class = ContractListSerializers
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasAPIAccessPermission]

# 4. Khusus UPDATE
class ContractUpdateView(generics.UpdateAPIView):
    api_codename = 'ContractUpdate'
    queryset = ContractList.objects.all()
    serializer_class = ContractListSerializers
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasAPIAccessPermission]

# 5. Khusus DELETE
class ContractDeleteView(generics.DestroyAPIView):
    api_codename = 'ContractDelete'
    queryset = ContractList.objects.all()
    serializer_class = ContractListSerializers
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasAPIAccessPermission]

class ContractHistoryViewSet(viewsets.ModelViewSet):
    api_codename = 'ContractHistory'
    queryset = ContractHistory.objects.all()
    serializer_class = ContractHistorySerializers
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated, HasAPIAccessPermission]
