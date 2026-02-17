

# Corrigir ordem dos icones sociais para incluir novas redes

## Problema
O registro salvo no banco de dados tem `cta_order` com apenas 4 redes (`whatsapp, instagram, linkedin, website`). As 5 novas redes (`youtube, tiktok, github, twitter, pinterest`) nao aparecem na lista de reordenacao porque nao estao no array salvo.

## Solucao
Ao carregar o layout do banco, fazer um merge inteligente: manter a ordem salva das redes existentes e adicionar ao final as redes que ainda nao estao no array.

## Detalhes tecnicos

### Arquivo: `src/pages/DashboardAppearance.tsx`

No `useEffect` onde o layout e carregado (ao processar `layoutRes.data`), adicionar logica de merge:

```typescript
// Depois de carregar layoutRes.data
const savedOrder = layoutRes.data.cta_order || [];
const allNetworks = defaultLayout.cta_order;
// Manter ordem salva + adicionar novas redes ao final
const mergedOrder = [
  ...savedOrder,
  ...allNetworks.filter(n => !savedOrder.includes(n))
];
setLayout({ ...defaultLayout, ...layoutRes.data, cta_order: mergedOrder });
```

Isso garante que:
- Redes ja ordenadas pelo usuario mantem sua posicao
- Novas redes sao adicionadas ao final da lista automaticamente
- Nenhuma rede e duplicada

Apenas 1 arquivo precisa ser alterado: `src/pages/DashboardAppearance.tsx`.
