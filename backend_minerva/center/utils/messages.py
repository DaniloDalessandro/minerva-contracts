CENTRO_GESTOR_MSGS = {
    'success_created': 'Centro de custo gestor criado com sucesso.',
    'success_updated': 'Centro de custo gestor atualizado com sucesso.',
    'success_deleted': 'Centro de custo gestor deletado com sucesso.',
    'unique_error': 'Já existe um centro de custo gestor com esse nome.',
    'validation_errors': {
        'required': 'O campo de registro é obrigatório.',
        'min_length': 'O registro deve ter mais de uma letra.',
        'min_letters': 'O registro deve conter mais de uma letra.',
        'invalid_characters': 'O registro pode conter apenas letras, números, espaços, hífens e underscores.',
        'duplicate': 'Já existe um centro gestor com este registro.',
    }
}

CENTRO_SOLICITANTE_MSGS = {
    'success_created': 'Centro de custo solicitante criado com sucesso.',
    'success_updated': 'Centro de custo solicitante atualizado com sucesso.',
    'success_deleted': 'Centro de custo solicitante deletado com sucesso.',
    'unique_error': 'Já existe um solicitante com esse nome para esse centro gestor.',
    'validation_errors': {
        'required': 'O campo de registro é obrigatório.',
        'min_length': 'O registro deve ter mais de uma letra.',
        'min_letters': 'O registro deve conter mais de uma letra.',
        'invalid_characters': 'O registro pode conter apenas letras, números, espaços, hífens e underscores.',
        'duplicate': 'Já existe um centro solicitante com este registro no centro gestor selecionado.',
        'management_center_required': 'O centro gestor é obrigatório.',
        'management_center_not_found': 'Centro gestor não encontrado.',
    }
}

# Zod-like validation error structure for consistent frontend handling
VALIDATION_ERROR_STRUCTURE = {
    'field': None,  # Field name that failed validation
    'code': None,   # Error code for programmatic handling
    'message': None,  # Human-readable error message
}
