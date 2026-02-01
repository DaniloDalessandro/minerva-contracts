from django.core.management.base import BaseCommand
from employee.models import Employee
from sector.models import Direction, Management, Coordination
from accounts.models import User
import random
from datetime import datetime, timedelta
from django.utils import timezone


class Command(BaseCommand):
    help = 'Popula o banco de dados com 500 colaboradores fictícios'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=500,
            help='Número de colaboradores a serem criados (padrão: 500)'
        )

    def handle(self, *args, **options):
        count = options['count']

        self.stdout.write(self.style.WARNING(f'Iniciando criação de {count} colaboradores...'))

        # Buscar dados necessários
        directions = list(Direction.objects.filter(is_active=True))
        managements = list(Management.objects.filter(is_active=True))
        coordinations = list(Coordination.objects.filter(is_active=True))

        if not directions:
            self.stdout.write(self.style.ERROR('Nenhuma direção ativa encontrada. Crie direções primeiro.'))
            return

        # Buscar um usuário para usar como created_by
        user = User.objects.first()

        # Listas de dados brasileiros para gerar nomes realistas
        first_names = [
            'Ana', 'João', 'Maria', 'Carlos', 'Juliana', 'Pedro', 'Paula', 'Lucas',
            'Fernanda', 'Rafael', 'Mariana', 'Bruno', 'Camila', 'Rodrigo', 'Beatriz',
            'Felipe', 'Amanda', 'Gabriel', 'Larissa', 'Thiago', 'Isabela', 'Matheus',
            'Carolina', 'André', 'Letícia', 'Diego', 'Patrícia', 'Marcelo', 'Aline',
            'Ricardo', 'Vanessa', 'Gustavo', 'Priscila', 'Leonardo', 'Renata', 'Vinicius',
            'Cristina', 'Daniel', 'Natália', 'Fabio', 'Adriana', 'Henrique', 'Tatiana',
            'Alexandre', 'Claudia', 'Guilherme', 'Bruna', 'Mauricio', 'Luciana', 'Anderson'
        ]

        last_names = [
            'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
            'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
            'Rocha', 'Almeida', 'Nascimento', 'Araújo', 'Melo', 'Barbosa', 'Cardoso',
            'Correia', 'Dias', 'Pinto', 'Fernandes', 'Monteiro', 'Vieira', 'Barros',
            'Freitas', 'Moreira', 'Castro', 'Mendes', 'Campos', 'Ramos', 'Teixeira'
        ]

        positions = [
            'Analista', 'Coordenador', 'Gerente', 'Assistente', 'Técnico',
            'Supervisor', 'Consultor', 'Especialista', 'Diretor', 'Auxiliar',
            'Engenheiro', 'Arquiteto', 'Designer', 'Desenvolvedor', 'Auditor'
        ]

        departments = [
            'Administrativo', 'Financeiro', 'RH', 'TI', 'Operações',
            'Comercial', 'Marketing', 'Jurídico', 'Compras', 'Qualidade',
            'Logística', 'Planejamento', 'Projetos', 'Manutenção', 'Produção'
        ]

        cities = [
            'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Curitiba', 'Porto Alegre',
            'Salvador', 'Brasília', 'Fortaleza', 'Recife', 'Manaus', 'Belém',
            'Goiânia', 'Campinas', 'São Luís', 'Natal', 'Florianópolis', 'João Pessoa'
        ]

        states = ['SP', 'RJ', 'MG', 'PR', 'RS', 'BA', 'DF', 'CE', 'PE', 'AM', 'PA', 'GO', 'MA', 'RN', 'SC', 'PB']

        streets = [
            'Rua das Flores', 'Avenida Principal', 'Rua do Comércio', 'Alameda Santos',
            'Rua XV de Novembro', 'Avenida Paulista', 'Rua da Consolação', 'Avenida Brasil',
            'Rua Sete de Setembro', 'Avenida Atlântica', 'Rua Augusta', 'Avenida Copacabana'
        ]

        banks = [
            'Banco do Brasil', 'Caixa Econômica', 'Bradesco', 'Itaú', 'Santander',
            'Nubank', 'Inter', 'Sicoob', 'Sicredi', 'Banrisul'
        ]

        status_choices = ['ATIVO', 'ATIVO', 'ATIVO', 'ATIVO', 'INATIVO']  # 80% ativos

        created_count = 0
        errors_count = 0

        for i in range(count):
            try:
                # Gerar nome completo
                first_name = random.choice(first_names)
                middle_name = random.choice(first_names)
                last_name1 = random.choice(last_names)
                last_name2 = random.choice(last_names)
                full_name = f"{first_name} {middle_name} {last_name1} {last_name2}"

                # Gerar CPF fictício (formato válido mas não real)
                cpf = f"{random.randint(100, 999)}.{random.randint(100, 999)}.{random.randint(100, 999)}-{random.randint(10, 99)}"

                # Gerar email único
                email_name = f"{first_name.lower()}.{last_name1.lower()}{random.randint(1, 9999)}"
                email = f"{email_name}@empresa.com.br"

                # Gerar telefone
                phone = f"({random.randint(11, 99)}) {random.randint(90000, 99999)}-{random.randint(1000, 9999)}"

                # Gerar data de nascimento (entre 22 e 65 anos)
                birth_date = timezone.now().date() - timedelta(days=random.randint(22*365, 65*365))

                # Gerar matrícula
                employee_id = f"MAT{random.randint(10000, 99999)}"

                # Selecionar cargo e departamento
                position = random.choice(positions)
                department = random.choice(departments)

                # Data de admissão (entre 1 e 20 anos atrás)
                admission_date = timezone.now().date() - timedelta(days=random.randint(365, 20*365))

                # Endereço
                street = f"{random.choice(streets)}, {random.randint(1, 9999)}"
                city = random.choice(cities)
                state = random.choice(states)
                postal_code = f"{random.randint(10000, 99999)}-{random.randint(100, 999)}"

                # Estrutura organizacional
                direction = random.choice(directions) if directions else None
                management = random.choice(managements) if managements else None
                coordination = random.choice(coordinations) if coordinations else None

                # Dados bancários
                bank_name = random.choice(banks)
                bank_agency = f"{random.randint(1000, 9999)}"
                bank_account = f"{random.randint(10000, 99999)}-{random.randint(0, 9)}"

                # Status
                status = random.choice(status_choices)

                # Criar colaborador
                Employee.objects.create(
                    full_name=full_name,
                    email=email,
                    phone=phone,
                    cpf=cpf,
                    birth_date=birth_date,
                    employee_id=employee_id,
                    position=position,
                    department=department,
                    admission_date=admission_date,
                    street=street,
                    city=city,
                    state=state,
                    postal_code=postal_code,
                    direction=direction,
                    management=management,
                    coordination=coordination,
                    bank_name=bank_name,
                    bank_agency=bank_agency,
                    bank_account=bank_account,
                    status=status,
                    created_by=user,
                    updated_by=user
                )

                created_count += 1

                # Mostrar progresso a cada 50 registros
                if (i + 1) % 50 == 0:
                    self.stdout.write(self.style.SUCCESS(f'[OK] {i + 1} colaboradores criados...'))

            except Exception as e:
                errors_count += 1
                self.stdout.write(self.style.ERROR(f'Erro ao criar colaborador {i+1}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'\n[OK] Processo concluido!'))
        self.stdout.write(self.style.SUCCESS(f'[OK] Total criados: {created_count}'))
        if errors_count > 0:
            self.stdout.write(self.style.WARNING(f'[AVISO] Erros: {errors_count}'))
