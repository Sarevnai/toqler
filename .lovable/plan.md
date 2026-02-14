

# Aplicar Design System Pluma -- Toda a Aplicacao

## Resumo

Migrar a identidade visual de azul para o design system Pluma (verde floresta + areia + off-white), atualizando cores, tipografia (adicionando Inter e JetBrains Mono sem remover DM Sans, Libre Caslon e Cousine), sombras, border-radius e componentes em toda a aplicacao.

## 1. Fontes -- Adicionar Inter e JetBrains Mono

**Arquivo:** `index.html`
- Adicionar imports do Google Fonts para **Inter** (400, 500, 600, 700, 800) e **JetBrains Mono** (400, 500)
- **Manter** os imports existentes de DM Sans, Libre Caslon Text e Cousine

**Arquivo:** `tailwind.config.ts`
- Atualizar `fontFamily.sans` para: `['Inter', 'DM Sans', 'ui-sans-serif', 'system-ui', 'sans-serif']`
- Atualizar `fontFamily.mono` para: `['JetBrains Mono', 'Cousine', 'ui-monospace', 'monospace']`
- Manter `fontFamily.serif` com Libre Caslon Text

## 2. Variaveis CSS -- Nova Paleta Pluma

**Arquivo:** `src/index.css`

Reescrever todos os tokens de cor no `:root` e `.dark`:

### Light (`:root`)

| Token | Valor HSL | Hex aprox. |
|-------|-----------|------------|
| background | 50 20% 98% | #FAFAF8 |
| foreground | 50 10% 10% | #1A1A17 |
| primary | 163 37% 18% | #1C3F3A |
| primary-foreground | 0 0% 100% | #FFFFFF |
| secondary | 43 30% 88% | #EBE8D8 |
| secondary-foreground | 50 10% 10% | #1A1A17 |
| muted | 50 10% 95% | #F4F4F2 |
| muted-foreground | 50 4% 42% | #6B6B63 |
| accent | 43 52% 55% | #D4A843 |
| accent-foreground | 50 10% 10% | #1A1A17 |
| border | 50 7% 89% | #E5E5E0 |
| input | 50 7% 89% | #E5E5E0 |
| ring | 163 37% 18% | #1C3F3A |
| destructive | 4 74% 59% | #E5544B |
| card | 0 0% 100% | #FFFFFF |
| card-foreground | 50 10% 10% | #1A1A17 |
| popover | 0 0% 100% | #FFFFFF |
| popover-foreground | 50 10% 10% | #1A1A17 |

### Dark (`.dark`)

| Token | Valor HSL | Hex aprox. |
|-------|-----------|------------|
| background | 50 15% 4% | #0D0D0B |
| foreground | 50 20% 98% | #FAFAF8 |
| primary | 163 32% 25% | #2A5A52 |
| primary-foreground | 50 20% 98% | #FAFAF8 |
| secondary | 50 5% 17% | #2D2D28 |
| card | 50 8% 10% | #1A1A17 |
| border | 50 5% 17% | #2D2D28 |
| muted | 50 5% 12% | #1F1F1C |
| muted-foreground | 50 4% 55% | #8A8A82 |

### Sombras

Substituir sombras com tom laranja por sombras neutras:
- `--shadow-sm`: `0 1px 2px rgba(0,0,0,0.04)`
- `--shadow-md`: `0 2px 8px rgba(0,0,0,0.06)`
- `--shadow-lg`: `0 4px 16px rgba(0,0,0,0.08)`

### Sidebar

Atualizar tokens `--sidebar-*` para usar a paleta forest green (primary, accent, border).

### Radius

`--radius`: `1rem` (era `1.25rem`)

### Fontes CSS vars

- `--font-sans`: `Inter, DM Sans, ui-sans-serif, sans-serif, system-ui`
- `--font-mono`: `JetBrains Mono, Cousine, ui-monospace, monospace`
- `--font-serif`: manter `Libre Caslon Text, ui-serif, serif`

### Charts

Atualizar `--chart-1` a `--chart-5` para tons de verde floresta em vez de azul.

## 3. Componentes UI Base

### `src/components/ui/button.tsx`
- Remover variantes `hero` e `hero-outline`
- O estilo `default` ja usa `bg-primary` que agora sera forest green
- Atualizar border-radius para `rounded-xl` (12px) em todas as variantes
- Adicionar hover lift sutil (`hover:-translate-y-px hover:shadow-md`)

### `src/components/ui/card.tsx`
- Manter estrutura, mas o `rounded-lg` herdara o novo `--radius` (16px)
- Sombra via CSS vars (automatico)

### `src/components/ui/input.tsx`
- Atualizar para `rounded-xl` (12px)
- O `border-input` agora usara a cor gray200 via CSS var

## 4. Landing Page

### `src/pages/Index.tsx`
- Remover wrapper `<div className="dark">` -- a landing sera light por padrao
- O fundo off-white vem automaticamente das novas CSS vars

### `src/components/landing/Navbar.tsx`
- `bg-background/60` ja funcionara como branco semi-transparente
- Trocar `variant="hero"` por `variant="default"` nos botoes
- Trocar `variant="hero-outline"` por `variant="outline"`
- Logo "Toqler" agora aparecera em forest green (`text-primary` no modo light)

### `src/components/landing/HeroSection.tsx`
- Trocar `variant="hero"` por `variant="default"` e `variant="hero-outline"` por `variant="outline"`
- Badge: `border-primary/20 bg-primary/5` funcionara com o novo verde
- Cores de texto e fundo herdam das CSS vars automaticamente

### `src/components/landing/FeaturesSection.tsx`
- Cards ja usam `bg-card` e `border-border/50` -- herdam a nova paleta
- Sem mudancas de codigo necessarias alem das cores via CSS

### `src/components/landing/HowItWorksSection.tsx`
- Adicionar fundo forest green (`bg-primary`) com texto branco (`text-primary-foreground`)
- Cards de passos com glassmorphism: `bg-white/5 border-white/10 backdrop-blur`
- Numeros dos passos mantem `bg-primary` que agora e verde

### `src/components/landing/CTASection.tsx`
- Adicionar fundo forest green (`bg-primary`) com texto branco
- Botao principal: `bg-white text-primary` (invertido para contraste)
- Trocar `variant="hero"` por estilo customizado branco

### `src/components/landing/Footer.tsx`
- Fundo near-black: `bg-[#0D0D0B]` com texto branco
- Copyright e links em `text-white/60`

### `src/components/landing/ParticleCanvas.tsx`
- Sem mudancas de codigo -- ja le `--primary` via CSS, que agora sera verde floresta

## 5. Paginas Operacionais

### `src/pages/Auth.tsx`
- Trocar `variant="hero"` por `variant="default"` (se existir)
- O restante herda das CSS vars automaticamente

### `src/components/dashboard/DashboardSidebar.tsx`
- Sem mudancas de codigo -- herda tokens `--sidebar-*` via CSS

### Dashboard pages (Overview, Analytics, etc.)
- Sem mudancas de codigo -- herdam cores via CSS vars

## Resumo de Arquivos

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `index.html` | Adicionar fonts Inter + JetBrains Mono |
| `src/index.css` | Reescrever tokens de cores, sombras, radius, fontes |
| `tailwind.config.ts` | Atualizar fontFamily |
| `src/components/ui/button.tsx` | Remover hero/hero-outline, ajustar radius |
| `src/components/ui/input.tsx` | Ajustar radius |
| `src/pages/Index.tsx` | Remover wrapper dark |
| `src/components/landing/Navbar.tsx` | Trocar variantes de botao |
| `src/components/landing/HeroSection.tsx` | Trocar variantes de botao |
| `src/components/landing/HowItWorksSection.tsx` | Fundo forest green + glassmorphism |
| `src/components/landing/CTASection.tsx` | Fundo forest green + botao branco |
| `src/components/landing/Footer.tsx` | Fundo near-black |

Nenhuma dependencia nova. Todas as mudancas propagam via CSS vars para o dashboard e demais paginas.

