from django.core.exceptions import ValidationError
import re


def validate_cpf(cpf):
    """
    Valida se o CPF está no formato correto e é válido
    """
    if not cpf:
        return


    cpf_digits = re.sub(r'[^\d]', '', cpf)


    if len(cpf_digits) != 11:
        raise ValidationError("CPF deve conter exatamente 11 dígitos.")


    if len(set(cpf_digits)) == 1:
        raise ValidationError("CPF inválido - todos os dígitos são iguais.")


    sum1 = sum(int(cpf_digits[i]) * (10 - i) for i in range(9))
    digit1 = 11 - (sum1 % 11)
    if digit1 >= 10:
        digit1 = 0

    if int(cpf_digits[9]) != digit1:
        raise ValidationError("CPF inválido - primeiro dígito verificador incorreto.")


    sum2 = sum(int(cpf_digits[i]) * (11 - i) for i in range(10))
    digit2 = 11 - (sum2 % 11)
    if digit2 >= 10:
        digit2 = 0

    if int(cpf_digits[10]) != digit2:
        raise ValidationError("CPF inválido - segundo dígito verificador incorreto.")


def validate_phone(phone):
    """
    Valida se o telefone está no formato correto
    """
    if not phone:
        return


    pattern = r'^\(\d{2}\) \d{4,5}-\d{4}$'

    if not re.match(pattern, phone):
        raise ValidationError("Telefone deve estar no formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.")


def validate_postal_code(postal_code):
    """
    Valida se o CEP está no formato correto
    """
    if not postal_code:
        return


    pattern = r'^\d{5}-\d{3}$'

    if not re.match(pattern, postal_code):
        raise ValidationError("CEP deve estar no formato XXXXX-XXX.")


def validate_employee_id(employee_id):
    """
    Valida se a matrícula está no formato correto
    """
    if not employee_id:
        return


    employee_id = employee_id.strip()


    if not employee_id:
        raise ValidationError("Matrícula não pode estar vazia.")


    if len(employee_id) < 3:
        raise ValidationError("Matrícula deve ter pelo menos 3 caracteres.")


    if not re.match(r'^[a-zA-Z0-9]+$', employee_id):
        raise ValidationError("Matrícula deve conter apenas letras e números.")


def validate_positive_decimal(value, field_name="Valor"):
    """
    Valida se um valor decimal é positivo
    """
    if value is not None and value < 0:
        raise ValidationError(f"{field_name} deve ser maior ou igual a zero.")


def validate_positive_amount(value, field_name="Valor"):
    """
    Valida se um valor é positivo e maior que zero
    """
    if value is not None and value <= 0:
        raise ValidationError(f"{field_name} deve ser maior que zero.")


def validate_date_range(start_date, end_date, start_field_name="Data de início", end_field_name="Data de término"):
    """
    Valida se o range de datas está correto
    """
    if start_date and end_date and start_date > end_date:
        raise ValidationError(f"{start_field_name} não pode ser posterior à {end_field_name.lower()}.")


def validate_bank_account(bank_account):
    """
    Valida se a conta bancária está no formato correto
    """
    if not bank_account:
        return


    account = re.sub(r'[^\w]', '', bank_account)


    if len(account) < 4:
        raise ValidationError("Conta bancária deve ter pelo menos 4 caracteres.")


    if not re.match(r'^[a-zA-Z0-9]+$', account):
        raise ValidationError("Conta bancária deve conter apenas letras e números.")


def validate_bank_agency(bank_agency):
    """
    Valida se a agência bancária está no formato correto
    """
    if not bank_agency:
        return


    agency = re.sub(r'[^\w]', '', bank_agency)


    if len(agency) < 3 or len(agency) > 6:
        raise ValidationError("Agência bancária deve ter entre 3 e 6 caracteres.")


    if not re.match(r'^[a-zA-Z0-9]+$', agency):
        raise ValidationError("Agência bancária deve conter apenas letras e números.")