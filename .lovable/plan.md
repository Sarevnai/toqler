

# Substituir icones do LinkedIn e Instagram pelos logos oficiais

## Resumo

Criar componentes SVG para LinkedIn e Instagram (assim como foi feito para o WhatsApp) e substituir os icones Lucide genéricos em todos os locais: `PublicProfile.tsx` e `DashboardAppearance.tsx`.

## Detalhes tecnicos

### 1. Criar `src/components/icons/LinkedInIcon.tsx`
Componente SVG inline com o logo oficial do LinkedIn (letra "in" no retangulo arredondado). Aceita `className` e `style` como props, igual ao `WhatsAppIcon`.

### 2. Criar `src/components/icons/InstagramIcon.tsx`
Componente SVG inline com o logo oficial do Instagram (camera estilizada com gradiente). Como SVG inline nao suporta gradientes de forma simples com `currentColor`, o componente usara o path monocromatico do logo oficial (contorno da camera + circulo + ponto) preenchido com `currentColor`, mantendo compatibilidade com o sistema de cores existente.

### 3. Atualizar `src/pages/PublicProfile.tsx`
- Importar `LinkedInIcon` e `InstagramIcon`
- Substituir `Linkedin` e `Instagram` (lucide) no array `SOCIAL_ITEMS`
- Remover imports nao utilizados de lucide

### 4. Atualizar `src/pages/DashboardAppearance.tsx`
- Importar `LinkedInIcon` e `InstagramIcon`
- Substituir no mapa `CTA_ICONS`
- Remover imports nao utilizados de lucide

### Arquivos alterados
1. `src/components/icons/LinkedInIcon.tsx` — novo
2. `src/components/icons/InstagramIcon.tsx` — novo
3. `src/pages/PublicProfile.tsx` — trocar icones
4. `src/pages/DashboardAppearance.tsx` — trocar icones

