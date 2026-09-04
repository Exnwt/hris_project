from django.contrib.auth.models import User, Group
from rest_framework import serializers

from rest_framework import serializers
from django.contrib.auth.models import Group, User

class UserSerializer(serializers.ModelSerializer):
    # Menggunakan PrimaryKeyRelatedField tanpa many=True untuk 1 Role/Group
    group = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        source='groups', # Menghubungkan ke M2M bawaan Django tapi sebagai Single Item
        required=False,
        allow_null=True
    )
    group_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'group', 'group_name', 'password']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False, 'allow_blank': True}
        }

    def get_group_name(self, obj):
        first_group = obj.groups.first()
        return first_group.name if first_group else "-"

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        first_group = instance.groups.first()
        representation['group'] = first_group.id if first_group else None
        return representation

    def create(self, validated_data):
        group_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
        
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
            
        if group_data:
            user.groups.set([group_data]) # Set 1 group
        return user

    def update(self, instance, validated_data):
        group_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
            
        instance.save()

        # Update Single Group jika dikirim
        if group_data is not None:
            instance.groups.set([group_data])
        elif 'groups' in self.initial_data and self.initial_data['groups'] is None:
            instance.groups.clear()

        return instance