"""
Ontologia de negócio do Sistema Minerva.
Define termos de negócio, condições SQL correspondentes e regras de reasoning.
"""


BUSINESS_ONTOLOGY = {
    "contrato crítico": {
        "description": "Contrato de alto valor, vencendo nos próximos 30 dias, sem fiscal designado",
        "sql_hints": "current_value > 100000 AND end_date <= CURRENT_DATE + INTERVAL '30 days' AND (fiscal_id IS NULL OR fiscal_employee_id IS NULL)",
        "tables": ["contract_contract"],
    },
    "contrato vencendo": {
        "description": "Contrato com data de término nos próximos 30 dias",
        "sql_hints": "end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'",
        "tables": ["contract_contract"],
    },
    "contrato vencido": {
        "description": "Contrato com data de término já passou",
        "sql_hints": "end_date < CURRENT_DATE AND status != 'ENCERRADO'",
        "tables": ["contract_contract"],
    },
    "orçamento esgotado": {
        "description": "Orçamento com menos de 10% do valor disponível",
        "sql_hints": "available_amount < (total_amount * 0.10)",
        "tables": ["budget_budget"],
    },
    "orçamento crítico": {
        "description": "Orçamento com menos de 20% do valor disponível",
        "sql_hints": "available_amount < (total_amount * 0.20)",
        "tables": ["budget_budget"],
    },
    "funcionário ativo": {
        "description": "Funcionário com status ativo no sistema",
        "sql_hints": "status = 'ATIVO' OR status = 'ACTIVE'",
        "tables": ["employee_employee"],
    },
    "funcionário fiscal": {
        "description": "Funcionário designado como fiscal de contrato",
        "sql_hints": "EXISTS (SELECT 1 FROM contract_contract c WHERE c.fiscal_employee_id = employee_employee.id)",
        "tables": ["employee_employee", "contract_contract"],
    },
    "maior valor": {
        "description": "Ordenar por valor decrescente",
        "sql_hints": "ORDER BY current_value DESC",
        "tables": [],
    },
    "este ano": {
        "description": "Filtrar pelo ano corrente",
        "sql_hints": "EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)",
        "tables": [],
    },
    "este mês": {
        "description": "Filtrar pelo mês corrente",
        "sql_hints": "EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)",
        "tables": [],
    },
}


CLARIFICATION_RULES = {
    "list_contracts": [
        "De qual período? (este ano, mês específico, ou todos)",
        "Filtrar por status? (ativos, encerrados, ou todos)",
        "Filtrar por setor ou centro gestor?",
    ],
    "list_employees": [
        "Filtrar por status? (ativos, inativos, ou todos)",
        "Filtrar por departamento ou setor?",
        "Incluir fiscais de contrato apenas?",
    ],
    "list_budgets": [
        "De qual ano?",
        "Filtrar por categoria? (CAPEX, OPEX, ou todos)",
        "Filtrar por status? (ativos, ou todos)",
    ],
    "aggregate_query": [
        "Qual o período de referência?",
        "Agrupar por alguma categoria?",
    ],
    "generic": [
        "Pode me dar mais detalhes sobre o que procura?",
        "Quer filtrar por algum período específico?",
        "Quer incluir registros inativos também?",
    ],
}

CHAIN_OF_THOUGHT_INSTRUCTION = """
PROCESSO DE RACIOCÍNIO OBRIGATÓRIO:
Antes de gerar o SQL, raciocine passo a passo:

Passo 1 - ENTIDADES: Quais tabelas e entidades estão envolvidas?
Passo 2 - REGRAS DE NEGÓCIO: Algum termo de negócio específico se aplica?
  - "contrato crítico" = alto valor + vencendo + sem fiscal
  - "orçamento esgotado" = disponível < 10% do total
  - "vencendo" = end_date nos próximos 30 dias
  - "este ano/mês" = filtro por data atual
Passo 3 - RELACIONAMENTOS: Quais JOINs são necessários?
Passo 4 - AGREGAÇÕES: Precisa de GROUP BY, COUNT, SUM, AVG?
Passo 5 - ORDENAÇÃO E LIMITE: Como ordenar e limitar os resultados?
Passo 6 - SQL FINAL: Gere o SQL completo e válido.

Inclua o raciocínio no campo "explanation" da resposta JSON.
"""


def get_relevant_business_rules(question: str) -> str:
    """
    Detecta termos de negócio na pergunta e retorna dicas SQL relevantes.
    """
    question_lower = question.lower()
    hints = []
    for term, rule in BUSINESS_ONTOLOGY.items():
        if term in question_lower:
            hints.append(
                f"REGRA DE NEGÓCIO - '{term}': {rule['description']}\n"
                f"  Condição SQL sugerida: {rule['sql_hints']}"
            )
    if not hints:
        return ""
    return "\nREGRAS DE NEGÓCIO DETECTADAS:\n" + "\n".join(hints) + "\n"


def get_clarification_questions(intent: str) -> list:
    """
    Retorna perguntas de clarificação para uma intenção.
    """

    for key in CLARIFICATION_RULES:
        if key in (intent or "").lower():
            return CLARIFICATION_RULES[key]
    return CLARIFICATION_RULES["generic"]
