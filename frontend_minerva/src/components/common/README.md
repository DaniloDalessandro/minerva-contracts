# CrudTablePage - Componente Genérico para Tabelas CRUD

## Visão Geral

O `CrudTablePage` é um componente wrapper genérico que encapsula toda a lógica comum de páginas com tabelas CRUD (Create, Read, Update, Delete). Ele reduz drasticamente o código repetitivo, de ~300 linhas para ~60 linhas por página.

## Arquivos Criados

- `src/hooks/useCrudTable.ts` - Hook customizado que gerencia estado e lógica de CRUD
- `src/components/common/CrudTablePage.tsx` - Componente wrapper genérico
- `src/components/common/index.ts` - Exportações

## Exemplo de Uso

### Antes (326 linhas)
```tsx
// Código antigo com ~300 linhas de estado, handlers, effects, etc.
```

### Depois (64 linhas) ✨
```tsx
"use client";

import React from "react";
import { CrudTablePage } from "@/components/common/CrudTablePage";
import { colaboradorColumns, ColaboradorForm, type Colaborador } from "@/features/colaboradores";
import { ColaboradorService } from "@/services";

export default function ColaboradoresPage() {
  const handleViewDetails = (colaborador: Colaborador) => {
    window.open(`/colaboradores/${colaborador.id}`, "_blank");
  };

  const getDeleteDialogTitle = (colaborador: Colaborador) => {
    return colaborador.status === "ATIVO" ? "Inativar colaborador" : "Ativar colaborador";
  };

  const getDeleteDialogDescription = (colaborador: Colaborador) => {
    return (
      <>
        Tem certeza que deseja {colaborador.status === "ATIVO" ? "inativar" : "ativar"} o colaborador{" "}
        <strong>{colaborador.full_name}</strong>?
      </>
    );
  };

  const colaboradorServiceAdapter = {
    fetch: ColaboradorService.fetchColaboradores,
    create: ColaboradorService.createColaborador,
    update: ColaboradorService.updateColaborador,
    toggleStatus: ColaboradorService.toggleStatus,
  };

  return (
    <CrudTablePage<Colaborador>
      columns={colaboradorColumns}
      service={colaboradorServiceAdapter}
      entityName="colaborador"
      entityNamePlural="colaboradores"
      title="Colaboradores"
      FormComponent={ColaboradorForm}
      onViewDetails={handleViewDetails}
      deleteDialogTitle={getDeleteDialogTitle}
      deleteDialogDescription={getDeleteDialogDescription}
      deleteDialogConfirmText="Confirmar"
      refreshKey="colaboradores"
    />
  );
}
```

## Props do CrudTablePage

### Obrigatórias

- `columns` - Array de definições de colunas (TanStack Table)
- `service` - Objeto com métodos CRUD (fetch, create, update, toggleStatus)
- `entityName` - Nome da entidade no singular (ex: "colaborador")
- `entityNamePlural` - Nome da entidade no plural (ex: "colaboradores")
- `title` - Título da página
- `FormComponent` - Componente de formulário para criar/editar

### Opcionais

- `subtitle` - Subtítulo da página
- `initialPageSize` - Tamanho inicial da página (padrão: 10)
- `initialStatusFilter` - Filtro inicial de status (padrão: "active")
- `readOnly` - Modo somente leitura (remove botões de ação)
- `onAdd` - Handler customizado para adicionar
- `onEdit` - Handler customizado para editar
- `onDelete` - Handler customizado para deletar
- `onViewDetails` - Handler para visualizar detalhes
- `onSubmit` - Handler customizado de submit do formulário
- `onConfirmDelete` - Handler customizado de confirmação de delete
- `formProps` - Props adicionais para o formulário
- `deleteDialogTitle` - Título customizado do dialog de delete (string ou função)
- `deleteDialogDescription` - Descrição customizada do dialog (string, JSX ou função)
- `deleteDialogConfirmText` - Texto do botão de confirmar (padrão: "Confirmar")
- `refreshKey` - Chave para integração com sidebar refresh

## Interface CrudService

O service adapter deve implementar esta interface:

```typescript
interface CrudService<T> {
  fetch: (page?: number, pageSize?: number, search?: string, ordering?: string, statusFilter?: string) => Promise<{ results: T[]; count: number }>;
  create?: (data: any) => Promise<{ data?: T } | T>;
  update?: (data: any) => Promise<{ data?: T } | T>;
  delete?: (id: number) => Promise<void>;
  toggleStatus?: (id: number) => Promise<void | T>;
}
```

## Benefícios

- ✅ **Redução de código**: ~80% menos código por página (326 → 64 linhas)
- ✅ **Manutenibilidade**: Mudanças em um lugar afetam todas as tabelas
- ✅ **Consistência**: Todas as tabelas seguem o mesmo padrão
- ✅ **Tipagem TypeScript**: Totalmente tipado e genérico
- ✅ **Flexibilidade**: Permite customização através de props e handlers
- ✅ **Funcionalidades inclusas**:
  - Paginação server-side
  - Ordenação de colunas
  - Filtros dinâmicos
  - CRUD completo com confirmação
  - Gerenciamento de estado automático
  - Integração com refresh da sidebar

## Páginas Pendentes de Refatoração

As seguintes páginas ainda precisam ser refatoradas para usar `CrudTablePage`:

1. **Auxílios** (`auxilios/page.tsx`) - 275 linhas
2. **Centros** (`centro/page.tsx`) - 390 linhas
3. **Contratos** (`contratos/page.tsx`) - 311 linhas
4. **Linhas Orçamentárias** (`linhas-orcamentarias/page.tsx`) - 333 linhas
5. **Orçamentos** (`orcamento/page.tsx`) - 266 linhas
6. **Setores** (`setor/page.tsx`) - 528 linhas

**Total potencial de redução**: ~1.800 linhas de código!

## Próximos Passos

Para refatorar as páginas restantes, siga o padrão da página de Colaboradores:

1. Identifique o service da entidade
2. Crie um adapter se necessário
3. Identifique handlers customizados (view details, delete messages)
4. Substitua o código pela chamada ao `CrudTablePage`
5. Teste a funcionalidade

## Casos Especiais

Para páginas com lógica muito específica (como optimistic updates), você pode:

1. Usar o hook `useCrudTable` diretamente
2. Passar handlers customizados via props `onSubmit` e `onConfirmDelete`
3. Estender o `CrudTablePage` conforme necessário
