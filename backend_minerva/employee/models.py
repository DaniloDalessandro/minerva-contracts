# employee/models.py
from django.db import models
from sector.models import Direction, Management, Coordination
from accounts.models import User

class Employee(models.Model):
    full_name = models.CharField("Nome completo", max_length=255)
    email = models.EmailField("Email", unique=True)
    phone = models.CharField("Telefone", max_length=20, null=True, blank=True)
    cpf = models.CharField("CPF", max_length=15)
    birth_date = models.DateField("Data de Nascimento", null=True, blank=True)
    employee_id = models.CharField("Matrícula", max_length=50, null=True, blank=True)
    position = models.CharField("Cargo", max_length=200, null=True, blank=True)
    department = models.CharField("Departamento", max_length=200, null=True, blank=True)
    admission_date = models.DateField("Data de Admissão", null=True, blank=True)
    
    # Endereço
    street = models.CharField("Logradouro", max_length=255, null=True, blank=True)
    city = models.CharField("Cidade", max_length=100, null=True, blank=True)
    state = models.CharField("Estado", max_length=2, null=True, blank=True)
    postal_code = models.CharField("CEP", max_length=10, null=True, blank=True)
    
    # Estrutura organizacional
    direction = models.ForeignKey(Direction, on_delete=models.CASCADE, null=True, verbose_name="Direção")
    management = models.ForeignKey(Management, on_delete=models.SET_NULL, null=True, verbose_name="Gerência")
    coordination = models.ForeignKey(Coordination, on_delete=models.SET_NULL, null=True, verbose_name="Coordenação")
    
    # Dados bancários
    bank_name = models.CharField("Nome do Banco", max_length=100, null=True, blank=True)
    bank_agency = models.CharField("Agência", max_length=20, null=True, blank=True)
    bank_account = models.CharField("Conta", max_length=30, null=True, blank=True)
    STATUS = [
        ('ATIVO', 'Ativo'),
        ('INATIVO', 'Inativo'),
    ]
    status = models.CharField(max_length=10, choices=STATUS, default='ATIVO')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='employees_created', verbose_name='Criado por', null=True, blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='employees_updated', verbose_name='Atualizado por', null=True, blank=True)

    def __str__(self):
        return self.full_name + " - " + self.cpf

    class Meta:
        verbose_name = "Funcionário"
        verbose_name_plural = "Funcionários"
        indexes = [
            models.Index(fields=['email'], name='employee_email_idx'),
            models.Index(fields=['cpf'], name='employee_cpf_idx'),
            models.Index(fields=['status'], name='employee_status_idx'),
            models.Index(fields=['direction'], name='employee_direction_idx'),
            models.Index(fields=['management'], name='employee_management_idx'),
            models.Index(fields=['coordination'], name='employee_coordination_idx'),
        ]
