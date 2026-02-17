

# Substituir icone do WhatsApp pelo logo oficial

## Resumo

Substituir o icone generico `MessageCircle` (lucide-react) usado para o WhatsApp pelo logo oficial do WhatsApp em todos os locais onde aparece: pagina de Aparencia (editor + preview) e perfil publico.

## Implementacao

### 1. Copiar o icone para o projeto
Copiar `user-uploads://whatsapp.png` para `src/assets/whatsapp.png`.

### 2. Criar componente WhatsAppIcon
Criar um componente SVG inline reutilizavel (`src/components/icons/WhatsAppIcon.tsx`) com o logo oficial do WhatsApp em SVG puro (ao inves de usar a imagem PNG, para manter consistencia com os outros icones lucide que sao SVGs). O componente aceitara `className` e `style` como props para manter compatibilidade com a API dos icones lucide.

### 3. Atualizar DashboardAppearance.tsx
- Importar `WhatsAppIcon`
- Substituir `MessageCircle` por `WhatsAppIcon` no mapa `CTA_ICONS`
- Remover `MessageCircle` do import de lucide-react (se nao usado em outro lugar)

### 4. Atualizar PublicProfile.tsx
- Importar `WhatsAppIcon`
- Substituir `MessageCircle` por `WhatsAppIcon` no array `SOCIAL_META`

### Arquivos alterados
1. `src/components/icons/WhatsAppIcon.tsx` — novo componente SVG
2. `src/pages/DashboardAppearance.tsx` — trocar icone no mapa
3. `src/pages/PublicProfile.tsx` — trocar icone no array social

