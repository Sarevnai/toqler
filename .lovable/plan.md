

# Redesign do Cartao Digital Publico (PublicProfile)

## Resumo

Reescrever completamente a pagina `PublicProfile.tsx` seguindo o design premium do template fornecido: hero photo full-width, card body sobreposto com tipografia serif, secoes modulares em cards separados, e formulario de lead como bottom-sheet (Drawer).

## O que muda visualmente

1. **Hero Section**: Foto full-width com aspect-ratio 4/3.2, overlay gradiente sutil, background fallback escuro
2. **Card Body**: Sobrepoe o hero com margin-top negativo (-24px), cantos arredondados no topo, contendo:
   - Nome em fonte serif grande (Playfair Display)
   - Cargo em uppercase com letter-spacing largo
   - Linha com logo da empresa + tagline, separada por borda inferior
   - Dois botoes CTA em grid 2 colunas: "Salvar Contato" (outline) e "Trocar Contato" (accent verde-limao #D4E84B)
3. **Secoes modulares** (fundo off-white, cards brancos):
   - Bio
   - Contato (icones em caixas 40x40 com label + valor)
   - Social (grid 4 colunas com icones)
   - Video (se existir)
4. **Bottom Sheet**: Formulario de lead abre como Drawer (vaul), estilo bottom-sheet com handle bar
5. **Footer**: "POWERED BY TOQLER" discreto
6. **Animacoes**: framer-motion para fadeIn na foto, slideUp no card, fadeInUp escalonado nas secoes

## Detalhes tecnicos

### Fonte Playfair Display
Adicionar Playfair Display ao Google Fonts em `index.html` e registrar como `font-display` no `tailwind.config.ts`.

**`index.html`**: Adicionar `Playfair+Display:wght@400;500;600;700` ao link do Google Fonts.

**`tailwind.config.ts`**: Adicionar `display: ['Playfair Display', 'serif']` em `fontFamily`.

### Componente PublicProfile.tsx — Reescrita completa

O componente sera reescrito mantendo toda a logica existente (fetch de dados, tracking, lead submit, vCard, webhooks) mas com JSX e estilos totalmente novos.

**Estrutura do JSX:**

```text
Container (max-w-[430px], bg #f5f4f0, centralizado)
  |-- Hero Section (aspect-[4/3.2], overflow-hidden)
  |     |-- img (object-cover)
  |     |-- overlay gradient
  |
  |-- Card Body (bg-white, rounded-t-2xl, -mt-6, relative z-10)
  |     |-- Nome (font-display, text-4xl)
  |     |-- Cargo (uppercase, tracking-widest)
  |     |-- Brand Row (logo + tagline, border-b)
  |     |-- CTA Row (grid-cols-2)
  |           |-- Salvar Contato (outline)
  |           |-- Trocar Contato (accent #D4E84B)
  |
  |-- Sections (px-6, space-y-3)
  |     |-- Bio card
  |     |-- Contact card (phone, email, website, location)
  |     |-- Social card (grid 4 cols: LinkedIn, Instagram, X, WhatsApp)
  |     |-- Video card (iframe YouTube/Vimeo)
  |
  |-- Footer ("POWERED BY TOQLER")
  |
  |-- Drawer (vaul) — formulario de lead
        |-- Handle bar
        |-- Titulo "Trocar Contato" (serif)
        |-- Descricao
        |-- Campos: Nome, Email, Telefone
        |-- Checkbox LGPD
        |-- Botao "Enviar Contato" (accent)
        |-- Feedback de sucesso com auto-close
```

### Mapeamento de dados do banco

| Elemento | Campo |
|---|---|
| Hero photo | `profile.photo_url` |
| Nome | `profile.name` |
| Cargo | `profile.role_title` + `company.name` |
| Logo | `company.logo_url` |
| Bio | `profile.bio` |
| Telefone | `profile.whatsapp` |
| Website | `profile.website` |
| LinkedIn | `profile.linkedin` |
| Instagram | `profile.instagram` |
| Video | `profile.video_url` |

### Cores do novo design

- Fundo pagina: `#f5f4f0` (via inline style na pagina publica, nao altera o tema global)
- Card branco: `#ffffff`
- Accent CTA: `#D4E84B` (verde-limao Toqler, via inline style)
- Texto primario: `#1a1a1a`
- Texto secundario: `#6b6b6b`
- Bordas: `#e8e8e5`

Estas cores sao aplicadas localmente apenas na pagina publica para manter a identidade do cartao independente do design system do dashboard.

### Animacoes (framer-motion)

- Hero photo: opacity 0->1 + scale 1.05->1, duracao 0.8s, delay 0.2s
- Card body: translateY 20->0 + opacity, 0.6s, delay 0.3s
- CTA row: translateY + opacity, delay 0.5s
- Secoes: fadeInUp escalonado (delays 0.6s, 0.7s, 0.8s, 0.9s)

### Drawer (vaul) para formulario de lead

Substituir o formulario inline pelo componente Drawer ja instalado. O botao "Trocar Contato" abre o drawer como bottom-sheet. Conteudo:
- Handle bar
- Titulo serif
- Campos com labels uppercase
- Checkbox LGPD
- Botao submit accent
- Ao submeter com sucesso: mostrar icone de check + "Contato enviado!" e fechar apos 2.5s

### Funcionalidades preservadas

- Tracking de views e cliques (eventos)
- Download de vCard
- Envio de leads com webhooks
- Respeito as configuracoes de layout (show_save_contact, show_lead_form, etc.)
- Branding condicional (hide_branding)
- Video embed seguro (YouTube/Vimeo)

### Arquivos alterados

1. `index.html` — adicionar Playfair Display ao Google Fonts
2. `tailwind.config.ts` — adicionar fontFamily `display`
3. `src/pages/PublicProfile.tsx` — reescrita completa do JSX com novo design

Nenhuma alteracao no banco de dados necessaria.

