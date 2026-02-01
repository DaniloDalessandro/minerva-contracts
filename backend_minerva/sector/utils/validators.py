from django.core.exceptions import ValidationError
from django.utils.text import slugify

def validate_sector_name(value):
    """
    Valida nomes de setores (direções, gerências, coordenações)
    """
    if not value or not value.strip():
        raise ValidationError('O nome não pode estar vazio.')
    
    if len(value.strip()) < 3:
        raise ValidationError('O nome deve ter pelo menos 3 caracteres.')
    
    if len(value.strip()) > 100:
        raise ValidationError('O nome deve ter no máximo 100 caracteres.')
    
    # Verificar se contém apenas caracteres válidos
    allowed_chars = set('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789áéíóúâêîôûàèìòùãõçÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÃÕÇ -_()&')
    if not all(char in allowed_chars for char in value):
        raise ValidationError('O nome contém caracteres inválidos. Use apenas letras, números, espaços, hífens, underscores, parênteses e o símbolo &.')

def validate_direction_name(value):
    """
    Validação específica para nomes de direção
    """
    validate_sector_name(value)

def validate_management_name(value):
    """
    Validação específica para nomes de gerência
    """
    validate_sector_name(value)

def validate_coordination_name(value):
    """
    Validação específica para nomes de coordenação
    """
    validate_sector_name(value)