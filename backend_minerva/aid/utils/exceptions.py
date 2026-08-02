from rest_framework.exceptions import NotFound

class AidNotFound(NotFound):
    default_detail = "Auxílio não encontrado."
    default_code = 'aid_not_found'