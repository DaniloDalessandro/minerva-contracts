from django.core.exceptions import ValidationError
import re

def validate_registry_field(value):
    """
    Validates the registry field (name) with Zod-like behavior:
    - Must have more than one letter
    - Can contain letters, numbers, spaces, and common punctuation
    - Cannot be empty or just whitespace
    """
    if not value or not value.strip():
        raise ValidationError({
            'field': 'name',
            'code': 'required',
            'message': 'O campo de registro é obrigatório.'
        })
    
    # Remove extra whitespace
    cleaned_value = value.strip()
    
    # Must have more than one character
    if len(cleaned_value) <= 1:
        raise ValidationError({
            'field': 'name',
            'code': 'min_length',
            'message': 'O registro deve ter mais de uma letra.'
        })
    
    # Must contain at least 2 letters
    letter_count = sum(1 for char in cleaned_value if char.isalpha())
    if letter_count <= 1:
        raise ValidationError({
            'field': 'name',
            'code': 'min_letters',
            'message': 'O registro deve conter mais de uma letra.'
        })
    
    # Verifica for valid characters (letters, numbers, spaces, hyphens, underscores)
    if not re.match(r'^[a-zA-Z0-9\s\-_]+$', cleaned_value):
        raise ValidationError({
            'field': 'name',
            'code': 'invalid_characters',
            'message': 'O registro pode conter apenas letras, números, espaços, hífens e underscores.'
        })
    
    return cleaned_value.upper()

def validate_name(value):
    """Legacy validator for backward compatibility"""
    return validate_registry_field(value)