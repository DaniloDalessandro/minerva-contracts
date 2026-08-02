from rest_framework.pagination import PageNumberPagination


class CustomPageNumberPagination(PageNumberPagination):
    """
    Paginação customizada que permite ao cliente especificar o page_size
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
