

# Corrigir erro de envio de leads na pagina publica

## Problema

O formulario de contato na pagina publica retorna "Erro ao enviar" porque a policy de INSERT na tabela `leads` e do tipo RESTRICTIVE. No PostgreSQL, policies restritivas apenas filtram o que ja foi permitido por uma policy PERMISSIVE. Como nao ha nenhuma policy permissiva de INSERT, todos os inserts sao negados.

## Solucao

Recriar a policy de INSERT na tabela `leads` como PERMISSIVE em vez de RESTRICTIVE. A regra de negocio permanece a mesma: exigir `company_id IS NOT NULL` e `consent = true`.

## Detalhes tecnicos

Executar a seguinte migracao SQL:

```sql
-- Remove a policy restritiva atual
DROP POLICY IF EXISTS "Leads require consent and company reference" ON public.leads;

-- Recria como permissiva
CREATE POLICY "Leads require consent and company reference"
  ON public.leads
  FOR INSERT
  TO public
  WITH CHECK ((company_id IS NOT NULL) AND (consent = true));
```

Isso permite que visitantes anonimos (role `anon`) insiram leads desde que informem `company_id` e `consent = true`.

Nenhuma alteracao de codigo necessaria — apenas a correcao da policy no banco.

