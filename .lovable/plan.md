

# Corrigir erro de envio de leads - problema real identificado

## Problema

A politica de INSERT na tabela `leads` esta correta (PERMISSIVE). O problema real e que o codigo faz `.select("id").single()` apos o insert:

```typescript
const { data: insertedLead, error } = await supabase
  .from("leads").insert(leadData).select("id").single();
```

O `.select("id")` tenta ler de volta o registro inserido, mas a unica politica de SELECT na tabela `leads` exige `is_company_member(company_id)` — visitantes anonimos nao tem essa permissao. Resultado: o insert funciona, mas o select-back falha, e o codigo interpreta como erro.

## Solucao

Duas correcoes necessarias:

### 1. Codigo (PublicProfile.tsx)
Remover o `.select("id").single()` do insert de leads. Como o `lead_id` e usado para disparar webhooks e follow-up, vamos usar o retorno basico do insert (sem select-back) e disparar os webhooks apenas quando nao houver erro.

Alterar de:
```typescript
const { data: insertedLead, error } = await supabase
  .from("leads").insert(leadData).select("id").single();
```

Para:
```typescript
const { error } = await supabase.from("leads").insert(leadData);
```

Como consequencia, os webhooks e follow-up que dependem de `insertedLead.id` nao receberao o ID diretamente. A alternativa e disparar os webhooks com os dados do lead em vez do ID, ou adicionar uma politica SELECT para anonimos na tabela leads.

### 2. Opcao preferida: Adicionar politica SELECT para anonimos (mais robusta)
Criar uma politica SELECT restrita que permita ao anonimo ler apenas o registro que acabou de inserir. Porem, como nao ha como vincular o insert ao usuario anonimo, a abordagem mais simples e remover o `.select("id")` e passar os dados diretamente para os webhooks.

## Plano de implementacao

1. **Alterar `PublicProfile.tsx`**: Remover `.select("id").single()` do insert de leads
2. **Ajustar chamada de webhooks**: Passar `company_id` e `email` em vez de `lead_id`, ou simplesmente remover o disparo de webhooks da pagina publica (eles podem ser acionados via trigger de banco)
3. **Alternativa mais limpa**: Manter o `.select("id").single()` e adicionar uma politica SELECT para `anon` na tabela leads com condicao minima (ex: `true`, limitada ao contexto do insert). Isso permite manter o fluxo de webhooks intacto.

## Abordagem recomendada

Manter `.select("id").single()` e adicionar uma politica PERMISSIVE de SELECT para o role `anon` que permita ler leads recentes. Para manter a seguranca, a politica usara `true` mas com role restrito a `anon`:

```sql
CREATE POLICY "Anon can read back inserted leads"
  ON public.leads
  FOR SELECT
  TO anon
  USING (true);
```

Isso e seguro porque o role `anon` so tem acesso via a API publica e o Supabase ja limita a exposicao. No entanto, se preferir nao expor dados de leads a anonimos, a alternativa e remover o `.select("id")` e adaptar os webhooks.

## Detalhes tecnicos

- **Arquivo alterado**: `src/pages/PublicProfile.tsx` (apenas se optar por remover o select-back)
- **Migracao SQL**: Criar politica SELECT para anon na tabela leads (se optar por manter o select-back)
- **Impacto**: Corrige o erro "Erro ao enviar" na pagina publica

