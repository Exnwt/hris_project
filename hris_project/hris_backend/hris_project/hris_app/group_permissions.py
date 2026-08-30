from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from hris_app.models import Company, Employee, Department, Section, Position

def create_groups():
    administrator_group, created = Group.objects.get_or_create(name='ADMINISTRATOR')
    hrd_manager_group, created = Group.objects.get_or_create(name='HRD_MANAGER')
    hr_adin_group, created = Group.objects.get_or_create(name='HR_ADMIN')
    
    print("Groups created or already exist.")


GROUP_PERMISSIONS = {
    "Administrator": {
        Company: ["view", "add", "change", "delete"],
        Employee: ["view", "add", "change", "delete"],
        Department: ["view", "add", "change", "delete"],
    },

    "HRD Manager": {
        Company: ["view"],
        Employee: ["view", "add", "change"],
        Department: ["view", "add", "change"],
    },

    "HR Admin": {
        Employee: ["view", "add", "change"],
        Department: ["view"],
    },
}

def setup_groups():
    for group_name, models in GROUP_PERMISSIONS.items():
        print(f"Setting up permissions for group: {group_name, models}")
        group, _ = Group.objects.get_or_create(
            name=group_name
        )

        for model, actions in models.items():

            content_type = ContentType.objects.get_for_model(model)

            for action in actions:
                codename = f"{action}_{model._meta.model_name}"

                permission = Permission.objects.get(
                    content_type=content_type,
                    codename=codename
                )

                group.permissions.add(permission)