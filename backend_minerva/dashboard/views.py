from django.db.models import Sum, Count, Q, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal

from sector.models import Direction, Management, Coordination
from budget.models import Budget
from contract.models import Contract


def _is_admin(user):
    if user.is_superuser:
        return True
    group = user.groups.values_list('name', flat=True).first()
    return group in ('PRESIDENTE', 'DIRETOR', 'GERENTE')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def orcamento_direcoes(request):
    """
    Lista todas as direções com resumo orçamentário.
    Acesso: admin/PRESIDENTE/DIRETOR/GERENTE
    """
    if not _is_admin(request.user):
        return Response({'detail': 'Acesso não autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    ano = request.query_params.get('ano')
    if not ano:
        from datetime import date
        ano = date.today().year
    try:
        ano = int(ano)
    except (TypeError, ValueError):
        return Response({'detail': 'Ano inválido.'}, status=status.HTTP_400_BAD_REQUEST)

    directions = Direction.objects.filter(is_active=True).order_by('name')
    result = []

    for direction in directions:
        budgets = Budget.objects.filter(
            management_center__hierarchy_associations__direction=direction,
            year=ano,
            status='ATIVO',
        ).distinct()

        budget_agg = budgets.aggregate(
            total=Coalesce(Sum('total_amount'), Decimal('0.00'), output_field=DecimalField()),
            disponivel=Coalesce(Sum('available_amount'), Decimal('0.00'), output_field=DecimalField()),
        )

        contracts = Contract.objects.filter(
            main_inspector__direction=direction,
        )
        contract_agg = contracts.aggregate(
            total=Count('id'),
            ativos=Count('id', filter=Q(status='ATIVO')),
        )

        result.append({
            'id': direction.id,
            'name': direction.name,
            'total_orcamento': float(budget_agg['total']),
            'disponivel_orcamento': float(budget_agg['disponivel']),
            'total_contratos': contract_agg['total'],
            'contratos_ativos': contract_agg['ativos'],
        })

    # Geral = soma de tudo
    total_budgets = Budget.objects.filter(year=ano, status='ATIVO')
    total_agg = total_budgets.aggregate(
        total=Coalesce(Sum('total_amount'), Decimal('0.00'), output_field=DecimalField()),
        disponivel=Coalesce(Sum('available_amount'), Decimal('0.00'), output_field=DecimalField()),
    )
    total_contracts = Contract.objects.aggregate(
        total=Count('id'),
        ativos=Count('id', filter=Q(status='ATIVO')),
    )

    return Response({
        'ano': ano,
        'geral': {
            'total_orcamento': float(total_agg['total']),
            'disponivel_orcamento': float(total_agg['disponivel']),
            'total_contratos': total_contracts['total'],
            'contratos_ativos': total_contracts['ativos'],
        },
        'direcoes': result,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def orcamento_resumo(request):
    """
    Resumo orçamentário por direção e ano.
    ?direcao_id=X&ano=YYYY  (direcao_id=0 = GERAL)
    """
    if not _is_admin(request.user):
        return Response({'detail': 'Acesso não autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    direcao_id = request.query_params.get('direcao_id', '0')
    ano = request.query_params.get('ano')

    if not ano:
        from datetime import date
        ano = date.today().year
    try:
        ano = int(ano)
        direcao_id = int(direcao_id)
    except (TypeError, ValueError):
        return Response({'detail': 'Parâmetros inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

    if direcao_id == 0:
        budgets = Budget.objects.filter(year=ano, status='ATIVO')
        contracts = Contract.objects.all()
        scope_name = 'GERAL'
    else:
        try:
            direction = Direction.objects.get(pk=direcao_id, is_active=True)
        except Direction.DoesNotExist:
            return Response({'detail': 'Direção não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        budgets = Budget.objects.filter(
            management_center__hierarchy_associations__direction=direction,
            year=ano,
            status='ATIVO',
        ).distinct()
        contracts = Contract.objects.filter(main_inspector__direction=direction)
        scope_name = direction.name

    # Por categoria
    por_categoria = list(
        budgets.values('category').annotate(
            total=Coalesce(Sum('total_amount'), Decimal('0.00'), output_field=DecimalField()),
            disponivel=Coalesce(Sum('available_amount'), Decimal('0.00'), output_field=DecimalField()),
            utilizado=Coalesce(Sum('cached_used_amount'), Decimal('0.00'), output_field=DecimalField()),
        ).order_by('category')
    )
    for item in por_categoria:
        item['total'] = float(item['total'])
        item['disponivel'] = float(item['disponivel'])
        item['utilizado'] = float(item['utilizado'])

    # Contratos por status
    contract_stats = contracts.aggregate(
        total=Count('id'),
        ativos=Count('id', filter=Q(status='ATIVO')),
        encerrados=Count('id', filter=Q(status='ENCERRADO')),
        valor_total=Coalesce(Sum('original_value'), Decimal('0.00'), output_field=DecimalField()),
        valor_ativos=Coalesce(Sum('original_value', filter=Q(status='ATIVO')), Decimal('0.00'), output_field=DecimalField()),
    )

    # Top 5 fiscais
    top_fiscais = list(
        contracts.values(
            'main_inspector__id',
            'main_inspector__full_name',
            'main_inspector__position',
        ).annotate(
            total_contratos=Count('id'),
            contratos_ativos=Count('id', filter=Q(status='ATIVO')),
            valor_total=Coalesce(Sum('original_value'), Decimal('0.00'), output_field=DecimalField()),
        ).order_by('-contratos_ativos', '-valor_total')[:5]
    )
    for f in top_fiscais:
        f['valor_total'] = float(f['valor_total'])

    # Top 10 contratos por valor
    top_contratos = list(
        contracts.order_by('-original_value').values(
            'id', 'protocol_number', 'description', 'status',
            'original_value', 'current_value',
            'main_inspector__full_name',
        )[:10]
    )
    for c in top_contratos:
        c['original_value'] = float(c['original_value'])
        c['current_value'] = float(c['current_value'])

    return Response({
        'scope_name': scope_name,
        'ano': ano,
        'por_categoria': por_categoria,
        'contratos': {
            'total': contract_stats['total'],
            'ativos': contract_stats['ativos'],
            'encerrados': contract_stats['encerrados'],
            'valor_total': float(contract_stats['valor_total']),
            'valor_ativos': float(contract_stats['valor_ativos']),
        },
        'top_fiscais': top_fiscais,
        'top_contratos': top_contratos,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def orcamento_graficos(request):
    """
    Dados para gráficos por hierarquia e ano.
    ?direcao_id=X&management_id=Y&coordination_id=Z&ano=YYYY
    Precedência: coordination_id > management_id > direcao_id (0 = GERAL)
    """
    if not _is_admin(request.user):
        return Response({'detail': 'Acesso não autorizado.'}, status=status.HTTP_403_FORBIDDEN)

    direcao_id = request.query_params.get('direcao_id', '0')
    management_id = request.query_params.get('management_id', '0')
    coordination_id = request.query_params.get('coordination_id', '0')
    ano = request.query_params.get('ano')

    if not ano:
        from datetime import date
        ano = date.today().year
    try:
        ano = int(ano)
        direcao_id = int(direcao_id)
        management_id = int(management_id)
        coordination_id = int(coordination_id)
    except (TypeError, ValueError):
        return Response({'detail': 'Parâmetros inválidos.'}, status=status.HTTP_400_BAD_REQUEST)

    if coordination_id > 0:
        try:
            coordination = Coordination.objects.get(pk=coordination_id, is_active=True)
        except Coordination.DoesNotExist:
            return Response({'detail': 'Coordenação não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        budgets = Budget.objects.filter(
            management_center__hierarchy_associations__coordination=coordination,
            year=ano,
            status='ATIVO',
        ).distinct()
        contracts = Contract.objects.filter(main_inspector__coordination=coordination)
    elif management_id > 0:
        try:
            management = Management.objects.get(pk=management_id, is_active=True)
        except Management.DoesNotExist:
            return Response({'detail': 'Gerência não encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        budgets = Budget.objects.filter(
            management_center__hierarchy_associations__management=management,
            year=ano,
            status='ATIVO',
        ).distinct()
        contracts = Contract.objects.filter(main_inspector__management=management)
    elif direcao_id == 0:
        budgets = Budget.objects.filter(year=ano, status='ATIVO')
        contracts = Contract.objects.all()
    else:
        try:
            direction = Direction.objects.get(pk=direcao_id, is_active=True)
        except Direction.DoesNotExist:
            return Response({'detail': 'Direção não encontrada.'}, status=status.HTTP_404_NOT_FOUND)

        budgets = Budget.objects.filter(
            management_center__hierarchy_associations__direction=direction,
            year=ano,
            status='ATIVO',
        ).distinct()
        contracts = Contract.objects.filter(main_inspector__direction=direction)

    # Doughnut: orçamento por categoria
    por_categoria = list(
        budgets.values('category').annotate(
            value=Coalesce(Sum('total_amount'), Decimal('0.00'), output_field=DecimalField()),
        ).order_by('category')
    )
    for item in por_categoria:
        item['name'] = item.pop('category')
        item['value'] = float(item['value'])

    # Pie: contratos por status
    por_status = []
    for s, label in [('ATIVO', 'Ativos'), ('ENCERRADO', 'Encerrados')]:
        agg = contracts.filter(status=s).aggregate(
            count=Count('id'),
            value=Coalesce(Sum('original_value'), Decimal('0.00'), output_field=DecimalField()),
        )
        por_status.append({
            'name': label,
            'status': s,
            'count': agg['count'],
            'value': float(agg['value']),
        })

    # Bar: distribuição financeira por categoria (total vs disponível)
    dist_financeira = list(
        budgets.values('category').annotate(
            total=Coalesce(Sum('total_amount'), Decimal('0.00'), output_field=DecimalField()),
            disponivel=Coalesce(Sum('available_amount'), Decimal('0.00'), output_field=DecimalField()),
            utilizado=Coalesce(Sum('cached_used_amount'), Decimal('0.00'), output_field=DecimalField()),
        ).order_by('category')
    )
    for item in dist_financeira:
        item['total'] = float(item['total'])
        item['disponivel'] = float(item['disponivel'])
        item['utilizado'] = float(item['utilizado'])

    # Bar: top 10 contratos
    top_contratos = list(
        contracts.order_by('-original_value').values(
            'protocol_number', 'description', 'original_value', 'status',
        )[:10]
    )
    for c in top_contratos:
        c['value'] = float(c.pop('original_value'))
        c['name'] = c['protocol_number']

    # Bar: ranking fiscais (top 10)
    ranking_fiscais = list(
        contracts.values(
            'main_inspector__full_name',
        ).annotate(
            contratos_ativos=Count('id', filter=Q(status='ATIVO')),
            total_contratos=Count('id'),
        ).order_by('-contratos_ativos', '-total_contratos')[:10]
    )
    for f in ranking_fiscais:
        f['name'] = f.pop('main_inspector__full_name') or 'N/A'

    return Response({
        'por_categoria': por_categoria,
        'por_status_contrato': por_status,
        'distribuicao_financeira': dist_financeira,
        'top_contratos': top_contratos,
        'ranking_fiscais': ranking_fiscais,
    })
