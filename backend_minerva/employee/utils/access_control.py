def get_employee_queryset(user, queryset):
    if user.is_superuser:
        return queryset

    employee = getattr(user, 'employee', None)

    if employee is None:
        return queryset.none()

    if user.groups.filter(name='PRESIDENTE').exists():
        return queryset

    if user.groups.filter(name='DIRETOR').exists():
        return queryset.filter(direction=employee.direction)

    if user.groups.filter(name='GERENTE').exists():
        return queryset.filter(management=employee.management)

    if user.groups.filter(name='COORDENADOR').exists():
        return queryset.filter(coordination=employee.coordination)

    return queryset.none()
