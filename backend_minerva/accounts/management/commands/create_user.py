from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from employee.models import Employee

User = get_user_model()

class Command(BaseCommand):
    help = 'Cria usuário com senha automática gerada'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='E-mail do usuário')
        parser.add_argument('--employee-id', type=int, help='ID do funcionário para vincular')
        parser.add_argument('--first-name', type=str, help='Nome do usuário')
        parser.add_argument('--last-name', type=str, help='Sobrenome do usuário')

    def handle(self, *args, **options):
        email = options['email']
        
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.ERROR(f'Usuário com email {email} já existe!')
            )
            return

        user_data = {'email': email}
        
        # Vincula funcionário se fornecido
        if options['employee_id']:
            try:
                employee = Employee.objects.get(id=options['employee_id'])
                user_data['employee'] = employee
                # Usa nome do funcionário se não fornecido
                if not options['first_name'] and employee.full_name:
                    names = employee.full_name.split()
                    user_data['first_name'] = names[0]
                    if len(names) > 1:
                        user_data['last_name'] = ' '.join(names[1:])
            except Employee.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Funcionário com ID {options["employee_id"]} não encontrado!')
                )
                return
        
        # Nome manual se fornecido
        if options['first_name']:
            user_data['first_name'] = options['first_name']
        if options['last_name']:
            user_data['last_name'] = options['last_name']

        # Cria usuário - senha será gerada automaticamente pelo signal
        user = User.objects.create_user(**user_data)
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Usuário criado com sucesso!\n'
                f'Email: {user.email}\n'
                f'Senha: Gerada automaticamente e enviada por email'
            )
        )