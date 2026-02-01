"""
Módulo para geração de relatórios em PDF de orçamentos
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
from decimal import Decimal
import locale

# Configurar locale para formatação de números em português brasileiro
try:
    locale.setlocale(locale.LC_ALL, 'pt_BR.UTF-8')
except locale.Error:
    try:
        locale.setlocale(locale.LC_ALL, 'Portuguese_Brazil.1252')
    except locale.Error:
        pass  # Usar configuração padrão se não conseguir definir


def format_currency(value):
    """Formatar valor como moeda brasileira"""
    try:
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except:
        return f"R$ {float(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def generate_budget_pdf(budget):
    """
    Gera um relatório PDF completo para um orçamento específico
    
    Args:
        budget: Instância do modelo Budget
        
    Returns:
        BytesIO: Buffer contendo o PDF gerado
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2E5984')
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#2E5984')
    )
    
    normal_style = styles['Normal']
    
    # Conteúdo do PDF
    story = []
    
    # Cabeçalho do relatório
    story.append(Paragraph("RELATÓRIO DE ORÇAMENTO", title_style))
    story.append(Paragraph(f"Sistema Minerva - {datetime.now().strftime('%d/%m/%Y às %H:%M')}", 
                          ParagraphStyle('DateStyle', parent=normal_style, alignment=TA_CENTER, fontSize=10)))
    story.append(Spacer(1, 20))
    
    # Informações básicas do orçamento
    story.append(Paragraph("DADOS BÁSICOS DO ORÇAMENTO", heading_style))
    
    basic_data = [
        ['Ano:', str(budget.year)],
        ['Categoria:', budget.get_category_display()],
        ['Centro Gestor:', str(budget.management_center.name)],
        ['Valor Total:', format_currency(budget.total_amount)],
        ['Valor Disponível:', format_currency(budget.available_amount)],
        ['Status:', budget.get_status_display()],
        ['Criado em:', budget.created_at.strftime('%d/%m/%Y às %H:%M')],
        ['Criado por:', str(budget.created_by) if budget.created_by else 'N/A'],
        ['Última atualização:', budget.updated_at.strftime('%d/%m/%Y às %H:%M')],
        ['Atualizado por:', str(budget.updated_by) if budget.updated_by else 'N/A'],
    ]
    
    basic_table = Table(basic_data, colWidths=[2*inch, 4*inch])
    basic_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(basic_table)
    story.append(Spacer(1, 20))
    
    # Linhas orçamentárias
    budget_lines = budget.budget_lines.all()
    if budget_lines.exists():
        story.append(Paragraph("LINHAS ORÇAMENTÁRIAS", heading_style))
        
        lines_data = [['#', 'Descrição', 'Tipo Despesa', 'Valor Orçado', 'Status Processo', 'Status Contrato']]
        
        for idx, line in enumerate(budget_lines, 1):
            lines_data.append([
                str(idx),
                str(line.summary_description or 'N/A')[:50] + ('...' if len(str(line.summary_description or '')) > 50 else ''),
                str(line.expense_type),
                format_currency(line.budgeted_amount),
                str(line.process_status or 'N/A'),
                str(line.contract_status or 'N/A')
            ])
        
        lines_table = Table(lines_data, colWidths=[0.5*inch, 2.5*inch, 1.5*inch, 1*inch, 1.2*inch, 1.3*inch])
        lines_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E5984')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F8F8')])
        ]))
        
        story.append(lines_table)
        story.append(Spacer(1, 20))
        
        # Resumo das linhas orçamentárias
        total_budgeted = sum(line.budgeted_amount for line in budget_lines)
        summary_data = [
            ['Total de Linhas:', str(budget_lines.count())],
            ['Valor Total Orçado nas Linhas:', format_currency(total_budgeted)],
        ]
        
        summary_table = Table(summary_data, colWidths=[2.5*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ]))
        
        story.append(summary_table)
    else:
        story.append(Paragraph("LINHAS ORÇAMENTÁRIAS", heading_style))
        story.append(Paragraph("Nenhuma linha orçamentária encontrada para este orçamento.", normal_style))
    
    story.append(Spacer(1, 20))
    
    # Histórico de movimentações
    outgoing_movements = budget.outgoing_movements.all()
    incoming_movements = budget.incoming_movements.all()
    
    if outgoing_movements.exists() or incoming_movements.exists():
        story.append(Paragraph("HISTÓRICO DE MOVIMENTAÇÕES", heading_style))
        
        if outgoing_movements.exists():
            story.append(Paragraph("Movimentações de Saída:", 
                                 ParagraphStyle('SubHeading', parent=normal_style, fontSize=12, fontName='Helvetica-Bold')))
            
            out_data = [['Data', 'Destino', 'Valor', 'Observações']]
            for movement in outgoing_movements:
                out_data.append([
                    movement.movement_date.strftime('%d/%m/%Y'),
                    str(movement.destination),
                    format_currency(movement.amount),
                    str(movement.notes or 'N/A')[:50] + ('...' if len(str(movement.notes or '')) > 50 else '')
                ])
            
            out_table = Table(out_data, colWidths=[1*inch, 2.5*inch, 1*inch, 2.5*inch])
            out_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#D32F2F')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(out_table)
            story.append(Spacer(1, 10))
        
        if incoming_movements.exists():
            story.append(Paragraph("Movimentações de Entrada:", 
                                 ParagraphStyle('SubHeading', parent=normal_style, fontSize=12, fontName='Helvetica-Bold')))
            
            in_data = [['Data', 'Origem', 'Valor', 'Observações']]
            for movement in incoming_movements:
                in_data.append([
                    movement.movement_date.strftime('%d/%m/%Y'),
                    str(movement.source),
                    format_currency(movement.amount),
                    str(movement.notes or 'N/A')[:50] + ('...' if len(str(movement.notes or '')) > 50 else '')
                ])
            
            in_table = Table(in_data, colWidths=[1*inch, 2.5*inch, 1*inch, 2.5*inch])
            in_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#388E3C')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ]))
            
            story.append(in_table)
    else:
        story.append(Paragraph("HISTÓRICO DE MOVIMENTAÇÕES", heading_style))
        story.append(Paragraph("Nenhuma movimentação encontrada para este orçamento.", normal_style))
    
    story.append(Spacer(1, 30))
    
    # Rodapé com informações do sistema
    footer_style = ParagraphStyle(
        'Footer',
        parent=normal_style,
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    story.append(Paragraph("___" * 30, footer_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Relatório gerado pelo Sistema Minerva", footer_style))
    story.append(Paragraph(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}", footer_style))
    
    # Construir o PDF
    doc.build(story)
    
    # Retornar o buffer
    buffer.seek(0)
    return buffer


def generate_budget_summary_pdf(budgets_queryset):
    """
    Gera um relatório PDF com resumo de múltiplos orçamentos
    
    Args:
        budgets_queryset: QuerySet de orçamentos
        
    Returns:
        BytesIO: Buffer contendo o PDF gerado
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch,
        leftMargin=0.5*inch,
        rightMargin=0.5*inch
    )
    
    # Estilos
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#2E5984')
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceBefore=20,
        spaceAfter=10,
        textColor=colors.HexColor('#2E5984')
    )
    
    # Conteúdo do PDF
    story = []
    
    # Cabeçalho do relatório
    story.append(Paragraph("RELATÓRIO RESUMIDO DE ORÇAMENTOS", title_style))
    story.append(Paragraph(f"Sistema Minerva - {datetime.now().strftime('%d/%m/%Y às %H:%M')}", 
                          ParagraphStyle('DateStyle', parent=styles['Normal'], alignment=TA_CENTER, fontSize=10)))
    story.append(Spacer(1, 20))
    
    # Tabela resumo
    story.append(Paragraph("RESUMO DOS ORÇAMENTOS", heading_style))
    
    summary_data = [['Ano', 'Categoria', 'Centro Gestor', 'Valor Total', 'Valor Disponível', 'Status']]
    
    for budget in budgets_queryset:
        summary_data.append([
            str(budget.year),
            budget.get_category_display(),
            str(budget.management_center.name)[:30] + ('...' if len(str(budget.management_center.name)) > 30 else ''),
            format_currency(budget.total_amount),
            format_currency(budget.available_amount),
            budget.get_status_display()
        ])
    
    summary_table = Table(summary_data, colWidths=[0.8*inch, 1*inch, 2*inch, 1.2*inch, 1.2*inch, 0.8*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E5984')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F8F8')])
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 20))
    
    # Estatísticas gerais
    total_budgets = budgets_queryset.count()
    total_amount = sum(budget.total_amount for budget in budgets_queryset)
    total_available = sum(budget.available_amount for budget in budgets_queryset)
    
    stats_data = [
        ['Total de Orçamentos:', str(total_budgets)],
        ['Valor Total Geral:', format_currency(total_amount)],
        ['Valor Disponível Geral:', format_currency(total_available)],
        ['Valor Utilizado Geral:', format_currency(total_amount - total_available)]
    ]
    
    stats_table = Table(stats_data, colWidths=[2.5*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(stats_table)
    story.append(Spacer(1, 30))
    
    # Rodapé
    footer_style = ParagraphStyle(
        'Footer',
        parent=styles['Normal'],
        fontSize=8,
        alignment=TA_CENTER,
        textColor=colors.grey
    )
    
    story.append(Paragraph("___" * 30, footer_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Relatório gerado pelo Sistema Minerva", footer_style))
    story.append(Paragraph(f"Data/Hora: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}", footer_style))
    
    # Construir o PDF
    doc.build(story)
    
    # Retornar o buffer
    buffer.seek(0)
    return buffer