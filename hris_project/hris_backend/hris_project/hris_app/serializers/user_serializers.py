from django.contrib.auth.models import User, Group
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(
        many=True,
        slug_field='name',
        queryset=Group.objects.all()
    )
    
    password = serializers.CharField(write_only=True,required=False)

    class Meta:
        model = User
        field = '__all__'
        
    def create(self, validated_data):
        print("Creating user with validated data:", validated_data)
        groups = validated_data.pop('groups', [])
        password = validated_data.pop('password', None)

        user = User(**validated_data)

        if password:
            user.set_password(password)

        user.save()

        user.groups.set(groups)

        return user

    def update(self, instance, validated_data):
        print("Updating user with validated data:", validated_data)
        groups = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        return instance

        
        