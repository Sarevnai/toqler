

# Estrategia de Animacoes para a Landing Page

## Estado Atual

A landing page usa animacoes basicas do Framer Motion: fade-in simples no hero text e scale-in na imagem. As secoes Features, HowItWorks e CTA usam `whileInView` com fade+translate. Nao ha particulas, counters, parallax, ou micro-interacoes sofisticadas.

## Estrategia Proposta

### 1. Hero Section -- Animacoes de Entrada Escalonadas

**Texto palavra por palavra**: O titulo principal aparecera com cada palavra surgindo sequencialmente (stagger), criando um efeito cinematico.

**Counter animado nos stats**: Os valores "10x", "0%" e "100%" terao uma animacao de contagem (de 0 ate o valor final) quando entrarem na viewport.

**Badge flutuante**: O badge "Networking inteligente com NFC" tera uma animacao de float sutil e continua (hover up/down).

**Imagem hero com parallax leve**: A imagem se movera sutilmente conforme o scroll, criando profundidade.

**Glow pulsante**: Os blobs de blur no fundo da imagem terao uma animacao de pulse suave e continua.

### 2. Particulas / Efeitos de Fundo

**Particulas NFC**: Um componente de particulas leve usando Canvas 2D (sem dependencia extra) no hero, com pontos conectados por linhas que se movem lentamente -- remetendo a conexoes digitais e NFC.

- Apenas no hero section para nao impactar performance
- Cores alinhadas com o design system (`primary` com opacidade baixa)
- Desativado em mobile para preservar performance

### 3. Scroll Animations nas Secoes

**FeaturesSection**: Cards aparecerao com stagger escalonado (um apos o outro) e scale sutil. Ao hover, terao um efeito de lift (translateY + shadow aumentado).

**HowItWorksSection**: Os passos terao uma linha conectora animada que "desenha" conforme o scroll. Cada circulo numerico tera um efeito de pulse ao entrar na viewport.

**CTASection**: O titulo e subtitulo entrarao com blur-to-clear (comecam borrados e ficam nitidos). O botao tera um efeito de glow pulsante.

### 4. Micro-interacoes

**Botoes**: Efeito de shimmer/shine no botao "Comecar agora" (um brilho que passa horizontalmente de tempos em tempos).

**Cards de features**: Hover com tilt 3D sutil (rotateX/Y baseado na posicao do mouse), bordas com gradiente animado.

**Links da navbar**: Underline animado ao hover (ja existe no design system via `.story-link`).

**Scroll indicator**: Uma seta ou chevron animado na parte inferior do hero indicando para rolar.

### 5. Transicoes entre Secoes

Divisores visuais sutis entre secoes usando SVG wave ou gradient fade, com opacity controlada pelo scroll position.

---

## Plano Tecnico de Implementacao

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/landing/ParticleCanvas.tsx` | Canvas de particulas conectadas para o hero |
| `src/components/landing/AnimatedCounter.tsx` | Componente de contagem animada (0 ate valor) |
| `src/components/landing/ScrollIndicator.tsx` | Seta animada de scroll no hero |

### Arquivos a Modificar

| Arquivo | Mudancas |
|---------|---------|
| `src/components/landing/HeroSection.tsx` | Adicionar ParticleCanvas, AnimatedCounter, stagger no titulo, parallax na imagem, glow pulsante, ScrollIndicator, shimmer no botao |
| `src/components/landing/FeaturesSection.tsx` | Hover tilt 3D nos cards, stagger refinado |
| `src/components/landing/HowItWorksSection.tsx` | Linha conectora animada, pulse nos circulos |
| `src/components/landing/CTASection.tsx` | Blur-to-clear no texto, glow no botao |
| `src/components/landing/Navbar.tsx` | Adicionar underline animado nos links |
| `src/index.css` | Keyframes para shimmer, float e glow |
| `tailwind.config.ts` | Registrar novas animacoes customizadas |

### Dependencias

Nenhuma nova dependencia necessaria. Tudo sera implementado com:
- **Framer Motion** (ja instalado) para animacoes declarativas e scroll-linked
- **Canvas API** nativo para particulas
- **CSS keyframes** para shimmer, float e glow

### Consideracoes de Performance

- Particulas desativadas em mobile (`use-mobile` hook existente)
- `will-change` aplicado apenas durante animacoes ativas
- Canvas com `requestAnimationFrame` e cleanup no unmount
- Parallax via `useScroll` + `useTransform` do Framer Motion (GPU-accelerated)
- Todos os `whileInView` com `once: true` para evitar recalculos

### Ordem de Implementacao

1. CSS keyframes e Tailwind config (base para tudo)
2. ParticleCanvas (hero background)
3. AnimatedCounter (hero stats)
4. HeroSection (integrar tudo: stagger, parallax, shimmer, scroll indicator)
5. FeaturesSection (hover tilt, stagger refinado)
6. HowItWorksSection (linha conectora, pulse)
7. CTASection (blur-to-clear, glow)
8. Navbar (underline animado)

