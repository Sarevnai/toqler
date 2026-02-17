
# Remover legendas dos ícones sociais no preview de Aparência

## Problema
O preview na pagina de Aparencia ainda mostra legendas (WhatsApp, Instagram, LinkedIn, Website) abaixo dos icones sociais, enquanto o perfil publico ja foi atualizado para mostrar apenas os icones.

## Solucao
Remover a linha `<span>` com `CTA_LABELS[key]` do grid de icones sociais no preview do `DashboardAppearance.tsx` (linha 276).

## Detalhes tecnicos

### Arquivo: `src/pages/DashboardAppearance.tsx`
Remover a linha 276:
```tsx
<span className="text-[6px] uppercase tracking-wider" style={{ color: T.text2 }}>{CTA_LABELS[key]}</span>
```

Nenhuma outra alteracao necessaria.
