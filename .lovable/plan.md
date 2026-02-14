

# Redesign Completo da Landing Page - Estilo Revolut

## Resumo

Reestruturacao total da landing page inspirada no site da Revolut: tema escuro, layout hero grande e centralizado com tipografia impactante, imagem do dashboard como mockup do produto, animacoes suaves de entrada e scroll, e secoes limpas com bastante espaco em branco.

## O que muda visualmente

- **Tema escuro** em toda a landing page (fundo escuro, texto claro)
- **Hero full-screen** com titulo gigante centralizado, subtitulo, CTA e mockup do dashboard flutuando abaixo
- **Navbar transparente** com blur, integrando-se ao fundo escuro
- **Secao de features** com cards escuros e layout limpo
- **Secao "Como funciona"** com a imagem do dashboard ao lado dos passos
- **CTA final** com fundo gradiente sutil
- **Footer** minimalista no tema escuro
- **Animacoes estilo Revolut**: fade-in por scroll, scale suave, parallax leve no mockup

## Alteracoes por Arquivo

### 1. `src/pages/Index.tsx`
- Envolver tudo em `<div className="dark">` para ativar tema escuro apenas na landing
- Adicionar `bg-background` para garantir fundo escuro

### 2. `src/assets/dashboard-preview.png` (novo)
- Copiar a imagem enviada (`Revolut_Business_Web_29.png`) como asset do projeto

### 3. `src/components/landing/HeroSection.tsx` (reescrita major)
- Remover grid de 2 colunas, centralizar todo conteudo
- Titulo grande (text-5xl a text-7xl) com animacao staggered mantida
- Subtitulo centralizado abaixo
- Dois botoes CTA centralizados
- Mockup do dashboard abaixo dos CTAs com:
  - Borda arredondada e sombra
  - Leve perspectiva 3D (CSS perspective + rotateX)
  - Animacao de entrada scale + fade
  - Parallax sutil no scroll
- Stats/counters reposicionados abaixo do mockup
- Remover a hero image antiga (foto)
- Manter ParticleCanvas no fundo (ajustar opacidade para dark)
- Manter ScrollIndicator

### 4. `src/components/landing/Navbar.tsx`
- Background transparente com backdrop-blur mais forte
- Borda inferior mais sutil (`border-white/10`)
- Garantir que os links e botoes funcionem bem no dark

### 5. `src/components/landing/FeaturesSection.tsx`
- Remover `bg-muted/30` do fundo (usar background padrao dark)
- Cards com fundo `bg-card` (automaticamente escuro no dark mode)
- Manter tilt effect e animacoes existentes
- Adicionar borda sutil `border-border` nos cards

### 6. `src/components/landing/HowItWorksSection.tsx`
- Adicionar a imagem do dashboard como ilustracao
- Layout: imagem centralizada acima dos passos em mobile, ao lado em desktop
- Manter a AnimatedLine e as animacoes de entrada dos passos

### 7. `src/components/landing/CTASection.tsx`
- Trocar `bg-primary/5` por gradiente sutil ou fundo com opacidade
- Manter animacoes de blur-to-clear existentes

### 8. `src/components/landing/Footer.tsx`
- Ajustar para combinar com dark theme (ja usa variaveis CSS, deve funcionar automaticamente)

### 9. `src/components/landing/ParticleCanvas.tsx`
- Sem mudancas necessarias - ja usa variaveis CSS que se adaptam ao dark mode

## Detalhes Tecnicos

### Estrutura do Hero

```text
+------------------------------------------------------+
|              [Navbar transparente + blur]             |
+------------------------------------------------------+
|                                                      |
|          [Badge: Networking inteligente NFC]          |
|                                                      |
|        Seus cartoes de visita, agora                  |
|          digitais e mensuraveis                       |
|                                                      |
|    Transforme interacoes presenciais em dados...      |
|                                                      |
|      [Comecar agora]    [Ver como funciona]           |
|                                                      |
|    +--------------------------------------------+    |
|    |                                            |    |
|    |      Dashboard Preview (perspectiva 3D)    |    |
|    |                                            |    |
|    +--------------------------------------------+    |
|                                                      |
|   10x memoravel  |  0% desperdicio  |  100% mensur.  |
|                                                      |
+------------------------------------------------------+
```

### Animacoes Revolut-style

- **Entrada do titulo**: fade-in + translateY com stagger por palavra (ja implementado, manter)
- **Entrada do mockup**: scale de 0.9 para 1 + fade, com delay apos titulo
- **Parallax do mockup**: translateY baseado em scrollYProgress (ja existe, adaptar)
- **Secoes no scroll**: whileInView com fade-in + translateY (ja implementado)
- **Navbar**: sem animacao extra, apenas transparencia + blur

### Dependencias

Nenhuma nova dependencia. Usa Framer Motion, Tailwind e variaveis CSS dark mode ja existentes.

### Arquivos modificados

| Arquivo | Tipo de mudanca |
|---------|----------------|
| `src/pages/Index.tsx` | Wrapper dark |
| `src/assets/dashboard-preview.png` | Novo asset |
| `src/components/landing/HeroSection.tsx` | Reescrita - layout centralizado |
| `src/components/landing/Navbar.tsx` | Ajustes visuais dark |
| `src/components/landing/FeaturesSection.tsx` | Ajuste background |
| `src/components/landing/HowItWorksSection.tsx` | Adicionar imagem |
| `src/components/landing/CTASection.tsx` | Ajuste background |

