

# Permitir edicao de leads

## Resumo

Adicionar a possibilidade de editar leads diretamente na tabela do dashboard. Ao clicar em uma linha, um dialog sera aberto com os campos editaveis (nome, email, telefone). Tambem sera necessario criar uma politica de UPDATE no banco de dados, pois atualmente nao existe nenhuma.

## O que muda

1. **Banco de dados**: Criar uma politica RLS de UPDATE na tabela `leads` permitindo que membros da empresa atualizem seus leads.

2. **Interface**: Adicionar um dialog de edicao em `DashboardLeads.tsx` com:
   - Botao de editar (icone de lapis) em cada linha da tabela
   - Dialog com campos: Nome, Email, Telefone
   - Botoes de Cancelar e Salvar
   - Feedback via toast de sucesso/erro

## Detalhes tecnicos

### Migracao SQL

```sql
CREATE POLICY "Members can update leads"
  ON public.leads
  FOR UPDATE
  TO authenticated
  USING (is_company_member(company_id))
  WITH CHECK (is_company_member(company_id));
```

### Alteracoes no codigo

**`src/pages/DashboardLeads.tsx`**:
- Adicionar estado para o lead sendo editado (`editingLead`)
- Adicionar coluna "Acoes" na tabela com botao de editar
- Criar um Dialog com formulario de edicao (nome, email, telefone)
- Funcao `handleSave` que faz `supabase.from("leads").update(...)` e recarrega a lista
- Usar componentes existentes: `Dialog`, `Input`, `Button`, `Label`

