

## Reorganizacao do Editor de Cores + Novo Layout Capa/Foto

### O que muda

**1. Editor de cores reorganizado em 5 secoes claras:**

- **Fundo** -- cor de fundo da pagina + upload de imagem de fundo
- **Cards** -- cor dos cards (bio, contato, social, video)
- **Botoes (icones)** -- cor de fundo e cor dos icones de contato e redes sociais (hoje usam `bg_color`, passam a ter cor propria)
- **CTA** -- cor de fundo e texto dos botoes "Salvar Contato" e "Trocar Contato"
- **Textos** -- cor principal dos textos + cor de acento (destaques)

**2. Novo layout: Capa atras da foto de perfil**

Hoje a capa substitui a foto do perfil no hero. O novo layout:
- Capa aparece como banner menor no topo (aspect ratio ~16/7)
- Foto de perfil desce e se torna um card arredondado (estilo LinkedIn), sobrepondo parcialmente a capa
- Ambas coexistem -- capa de fundo + foto de perfil como card

### Detalhes tecnicos

**Banco de dados** -- Nova migracao adicionando 2 colunas em `profile_layouts`:
- `icon_bg_color` (text, default `'#f5f4f0'`) -- fundo dos icones de contato/social
- `icon_color` (text, default `'#1a1a1a'`) -- cor dos icones

**`src/lib/color-utils.ts`** -- Adicionar tokens `iconBg` e `iconColor` ao `buildTokens()`, com fallback para `bg` e `text1` respectivamente.

**`src/pages/DashboardAppearance.tsx`**:
- Reorganizar o Kit de Marca em 5 sub-cards colapsaveis (ou secoes visuais com titulo):
  - Fundo: bg_color + upload bg_image
  - Cards: card_color
  - Botoes (icones): icon_bg_color + icon_color
  - CTA: button_color + button_text_color
  - Textos: text_color + accent_color
- Mover uploads de capa e imagem de fundo para dentro das secoes relevantes
- Atualizar preview:
  - Capa como banner curto no topo
  - Foto de perfil como card circular/arredondado sobrepondo a capa
  - Icones usando novos tokens `iconBg`/`iconColor`

**`src/pages/PublicProfile.tsx`**:
- Hero muda: se tem `cover_url`, exibe como banner curto (aspect ~16/7)
- Foto de perfil aparece como card arredondado, posicionada parcialmente sobre a capa (margin-top negativo)
- Se nao tem capa, a foto de perfil continua no hero com aspecto atual (4/3.2) com gradiente
- Icones de contato e social usam `T.iconBg` e `T.iconColor` em vez de `T.bg` e `T.text1`

**Arquivos alterados:**
1. Nova migracao SQL (2 colunas)
2. `src/lib/color-utils.ts`
3. `src/pages/DashboardAppearance.tsx`
4. `src/pages/PublicProfile.tsx`

