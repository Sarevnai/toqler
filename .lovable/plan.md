

## Webhook do Stripe para sincronizar assinaturas

### O que sera feito

Criar uma Edge Function `stripe-webhook` que recebe eventos do Stripe e atualiza automaticamente o banco de dados local quando ocorrem mudancas nas assinaturas (upgrades, downgrades, cancelamentos, falhas de pagamento).

### Eventos tratados

De acordo com a documentacao do Customer Portal, os eventos essenciais sao:

- `customer.subscription.updated` - upgrades, downgrades, reativacoes, mudanca de status para `past_due`
- `customer.subscription.deleted` - cancelamento definitivo
- `invoice.paid` - pagamento confirmado (gerar registro na tabela invoices)
- `invoice.payment_failed` - falha de pagamento

### Passos de implementacao

1. **Criar a Edge Function `stripe-webhook`** (`supabase/functions/stripe-webhook/index.ts`)
   - Receber o payload bruto do Stripe
   - Verificar a assinatura do webhook usando `STRIPE_WEBHOOK_SECRET`
   - Tratar cada tipo de evento:
     - `customer.subscription.updated`: localizar a empresa pelo `stripe_customer_id` na tabela `subscriptions`, atualizar `status`, `plan_id`, `billing_cycle`, `current_period_start`, `current_period_end`, `canceled_at`, `cancel_at_period_end`
     - `customer.subscription.deleted`: marcar status como `canceled`, registrar `canceled_at`
     - `invoice.paid`: criar/atualizar registro na tabela `invoices` com PDF e dados do pagamento
     - `invoice.payment_failed`: atualizar status da assinatura para `past_due`

2. **Configurar `supabase/config.toml`**
   - Adicionar `[functions.stripe-webhook]` com `verify_jwt = false` (o Stripe nao envia JWT; a autenticacao e feita pela assinatura do webhook)

3. **Solicitar o secret `STRIPE_WEBHOOK_SECRET`**
   - O usuario precisara criar um webhook endpoint no Dashboard do Stripe apontando para a URL da funcao e copiar o signing secret

### Detalhes tecnicos

```text
Stripe --> POST /stripe-webhook --> Edge Function
              |
              v
     Verificar assinatura (stripe.webhooks.constructEvent)
              |
              v
     Switch por event.type
              |
     +--------+--------+--------+
     |        |        |        |
  sub.updated sub.deleted inv.paid inv.failed
     |        |        |        |
     v        v        v        v
  UPDATE    UPDATE   INSERT   UPDATE
  subscriptions      invoices  subscriptions
  (plan, status,     (amount,  (status=past_due)
   period, etc.)      pdf, etc.)
```

A funcao usara o mapeamento existente em `PRICE_TO_PLAN` (mesmo do `check-subscription`) para traduzir price IDs em slugs de plano ao processar `customer.subscription.updated`.

### Configuracao no Stripe Dashboard

Apos a implementacao, o usuario precisara:
1. Ir em Stripe Dashboard > Developers > Webhooks
2. Adicionar endpoint com a URL da funcao
3. Selecionar os eventos: `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
4. Copiar o Signing Secret e fornecer ao Lovable

