from django.core.exceptions import ValidationError
import datetime

def validate_year(value):
    current_year = datetime.datetime.now().year
    # Permite criar orçamentos para o ano atual e o ano anterior
    if value < current_year - 1:
        raise ValidationError(f'O ano não pode ser mais de um ano anterior ao ano atual ({current_year}).')
