from django.utils import timezone

def generate_protocol_number():
    from contract.models import Contract  
    year_suffix = timezone.now().year % 100  
    last_protocol = Contract.objects.filter(protocol_number__endswith=f"/{year_suffix}").order_by('id').last()
    
    if last_protocol:
        # Incrementa a sequência do último número de protocolo gerado
        last_sequence = int(last_protocol.protocol_number.split('/')[0])
        new_sequence = f"{last_sequence + 1:04}"
    else:
        # Se não houver nenhum protocolo para o ano atual, inicia a sequência em "0001"
        new_sequence = "0001"

    return f"{new_sequence}/{year_suffix}"