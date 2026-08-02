# Relatório Técnico — Fase 1: Fundação do módulo RBAC + Hierarquia + Access Grants

Branch: `feature/rbac-hierarchy-access-grants` (a partir de `develop`).

## 1. Diagnóstico da estrutura anterior

Levantamento completo feito no início desta sessão, revisando modelagem de usuários, cargos, estrutura
organizacional, permissões, middleware de autenticação/autorização, APIs e frontend.

### Backend

- **Não existia modelo de Role/Cargo.** Autorização era 100% via `django.contrib.auth.Group`, com **três
  esquemas de nomenclatura de grupo incompatíveis coexistindo**:
  - `accounts/user_admin_views.py::_assign_group()` cria `PRESIDENTE/DIRETOR/GERENTE/COORDENADOR/FUNCIONARIO`
    (maiúsculo) — é o fluxo realmente usado hoje ao convidar/criar usuários.
  - `center/management/commands/setup_hierarchy.py` cria `Presidente/Diretor/Gerente/Coordenador` (title-case).
  - `accounts/permissions.py::create_default_groups()` cria um terceiro conjunto (`Diretor Financeiro`,
    `Diretor Administrativo`, grupos por coordenação).
  - `accounts/permissions.py::_has_role` e `employee/utils/access_control.py::get_employee_queryset` fazem
    match exato (case-sensitive) contra o vocabulário maiúsculo — usuários colocados em grupos dos outros dois
    esquemas são **silenciosamente tratados como sem papel algum** (queryset vazio, escrita negada). Bug real,
    não hipotético.
- **Escopo de dados inconsistente**: só `Employee`/`Contract` (via `get_employee_queryset`) e a listagem de
  `Budget` (via `accounts/mixins.py::HierarchicalFilterMixin`) filtram por unidade organizacional.
  `Direction`, `Management`, `Coordination`, `ManagementCenter`, `RequestingCenter`, `BudgetLine`
  (+movimentações+versões), `Assistance`/Auxílios, e os detalhes/movimentações de `Budget` não tinham
  **nenhum** filtro — qualquer usuário autenticado via qualquer um via tudo.
- **Vínculo organizacional único por usuário**: `User.employee` (OneToOne) →
  `Employee.direction/management/coordination` (FKs simples). O mesmo registro de RH determinava o escopo de
  acesso — sem separação entre os dois conceitos, sem suporte a múltiplos vínculos simultâneos.
- `Contract.get_objects_by_direction/management/coordination`, `Budget.get_objects_by_*` e
  `BudgetLine.get_objects_by_*` (via `HierarchicalQuerysetMixin`) dependem de um `related_query_name` que
  **não existe** em `CenterHierarchy` (o reverso correto seria `hierarchy_associations`) — muito provavelmente
  código morto/quebrado hoje, não foi usado como referência.
- **Nenhum mecanismo de auditoria/histórico** existia (`django-simple-history` não instalado, nada equivalente).
- **"Processo" não existe como modelo** em lugar nenhum — só como um campo de status texto dentro de
  `BudgetLine.process_status`.

### Frontend

- `usePermissions` (`hooks/usePermissions.ts`) expõe 7 booleans fixos (`canManageX`) derivados de um "ladder"
  de role única, sem qualquer escopo organizacional ou conceito de recurso.
- `AuthGuard` só verifica **autenticação**, nunca autorização — uma role `FUNCIONARIO` navega livremente por
  URL para qualquer tela.
- ~8 telas fazem seu próprio check ad hoc (`readOnly={!canManageX}` / `user?.is_superuser`); as páginas de
  detalhe (`[id]/page.tsx`) nem isso têm — botão "Editar" incondicional.
- Atribuição de papel (`UserForm.tsx`, só 1 grupo, sem unidade organizacional) e atribuição de unidade
  (`UserProfileForm.tsx`, autosserviço, sem aprovação de admin) são dois fluxos completamente desconectados.

## 2. O que foi implementado nesta fase

Novo app Django `access_control`, **puramente aditivo** — nada do sistema atual foi removido ou alterado:

- **Modelos**: `OrganizationalUnit` (árvore N-níveis, materialized path hand-rolled, sem nova dependência tipo
  django-mptt), `Action` (catálogo de ações), `Role` (Cargo → M2M de Actions), `Membership` (vínculo
  usuário↔unidade↔cargo, nunca hard-deletado, é o próprio histórico), `AccessGrant` (compartilhamento via
  `GenericForeignKey`, alvo único entre usuário/cargo/unidade, vigência obrigatória + motivo), `AuditLog`
  (append-only, `GenericForeignKey`, before/after em JSON).
- **`PermissionService`** (`access_control/services/permission_service.py`) — ponto único de autorização:
  `is_president`, `accessible_unit_ids`, `has_access_to` (fluxo: presidente/superuser → hierarquia →
  compartilhamento por unidade/cargo/usuário → negar), `can` (acesso + ação do cargo), `filter_queryset`
  (scoping de listagens). Tudo com `select_related`/`prefetch_related`, sem N+1.
- **Expiração automática** (`access_control/tasks.py::expire_access_grants`) — tarefa Celery Beat horária
  (`CELERY_BEAT_SCHEDULE['expire-access-grants-hourly']`) que marca grants vencidos como inativos e grava
  `AuditLog(GRANT_EXPIRED)`. A negação de acesso em si já independe da tarefa rodar, porque
  `PermissionService` sempre filtra por `end_date` em tempo de consulta.
- **Migração de dados** (`0002_sync_legacy_org_data.py`, lógica em `access_control/services/legacy_sync.py`
  para ser testável fora do grafo de migrations): espelha `Direction→Management→Coordination` em
  `OrganizationalUnit` (guardando `legacy_*_id` para rastreio), normaliza os três esquemas de grupo em um
  catálogo único de `Role`, e cria uma `Membership` por `Employee` vinculado a um `User`. Idempotente
  (`get_or_create` em toda parte) e 100% reversível (`sync_reverse` limpa só o que foi criado).

## 3. Por que a migração é aditiva e reversível

`Direction`, `Management`, `Coordination`, `Employee`, os grupos Django e todas as `DRF permission classes`
existentes continuam funcionando exatamente como antes — nenhum FK foi repontado, nenhuma tabela foi alterada.
O novo `PermissionService` está disponível para código novo chamar, mas nada existente foi migrado para usá-lo
ainda. `python manage.py migrate access_control zero` desfaz tudo sem tocar em nenhuma tabela legada.

## 4. Impacto nos módulos existentes

**Zero.** Nenhuma tela, view, serializer ou middleware existente foi alterado. A suíte de testes do backend
já existente deve passar de forma idêntica a antes desta mudança.

## 5. Interpretação arquitetural: "Processo"/"Contrato" na árvore

O enunciado descreve a árvore como `Diretoria → Gerência → Coordenação → Contrato → Processo`. Interpretamos
que `Contrato` e `Processo` **não** viram nós de `OrganizationalUnit` (que representa equipes/setores, não
registros de negócio) — em vez disso permanecem como os modelos de negócio (`Contract` já existe; `Processo`
ainda não existe como entidade e será criado na Fase 2/3 quando as APIs/telas de Compartilhamento forem
implementadas), e o `AccessGrant` os referencia via `GenericForeignKey`. Isso bate com os próprios exemplos do
enunciado ("Compartilhar Processo → Usuário João") — compartilhamento de um **recurso**, não de uma unidade da
árvore. Fica registrado aqui para confirmação explícita, por ser uma decisão de design, não uma leitura literal.

## 6. Cobertura de testes

Suíte nova em `access_control/tests/`: integridade da árvore (`test_models.py`), todo o fluxo do
`PermissionService` — hierarquia, as 3 formas de compartilhamento, expiração, negação por padrão, usuário não
autenticado (`test_permission_service.py`) —, e a migração de dados contra um dataset legado semeado, incluindo
idempotência (`test_legacy_sync.py`). Meta de ≥90% de cobertura é sobre este app novo especificamente, não
sobre o backend inteiro (fora de escopo desta fase).

## 7. Recomendações e próximas fases

- **Fase 2 — APIs REST**: endpoints CRUD para `OrganizationalUnit`/`Role`/`Membership`/`AccessGrant`, endpoint
  de "acessos efetivos" de um recurso (para a futura aba "Acessos"), endpoint de auditoria/histórico. Usar
  `PermissionService` como `permission_classes`/`get_queryset` — nunca lógica própria na view.
- **Fase 3 — Frontend**: telas de Estrutura Organizacional (árvore com drag-and-drop), Equipes,
  Compartilhamentos (+ modal "Compartilhar Acesso" nas telas de Processo/Contrato/Coordenação/Gerência/
  Diretoria), aba "Acessos" na tela de Processo, indicadores no Dashboard. Reaproveitar o design system atual
  (`CrudTablePage`/`DataTable`/shadcn), sem componentes novos fora do padrão.
- **Fase 4 — Corte definitivo**: repontar `Employee.direction/management/coordination`,
  `Contract`/`Budget`/`BudgetLine` (via `CenterHierarchy`) para `OrganizationalUnit`; aposentar
  `Direction`/`Management`/`Coordination`/`Group`-based permissions; remover os campos `legacy_*_id`; consertar
  ou remover os `get_objects_by_*` quebrados de `HierarchicalQuerysetMixin`; substituir os ~8 checks ad hoc do
  frontend por um gate central; cobertura de 90% do sistema completo (não só do app novo).
- **Achado a resolver antes da Fase 4**: `UserForm.tsx`/backend hoje só suportam **um** grupo por usuário —
  precisa virar N `Membership`s. `UserProfileForm.tsx` deixa o próprio usuário setar sua unidade organizacional
  sem aprovação — esse fluxo deve ser substituído por atribuição de `Membership` feita por um admin/Diretor.
