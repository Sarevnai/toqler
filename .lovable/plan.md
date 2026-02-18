

## Cores de botao independentes + Foto de capa + Fundo com imagem

### 1. Problema atual

- Os botoes usam `accent_color` (Trocar) e `card_color` (Salvar) como background, sem controle independente
- Nao existe opcao de foto de capa no layout
- O fundo e sempre uma cor solida, sem opcao de imagem

### 2. Solucao

Tres novas funcionalidades no editor de aparencia:

**A) Cor dos botoes separada**: Dois novos campos de cor (`button_color` e `button_text_color`) para controlar os botoes CTA independentemente do fundo e dos cards.

**B) Foto de capa**: Upload de uma imagem de capa que aparece no topo do perfil (area hero), podendo ser usada em vez da foto individual do perfil ou como complemento visual.

**C) Fundo com imagem**: Opcao de substituir a cor de fundo solida por uma imagem de fundo (com overlay para manter legibilidade).

### 3. Alteracoes no banco de dados

Nova migracao adicionando colunas na tabela `profile_layouts`:

- `button_color` (text, default `'#D4E84B'`) -- cor de fundo dos botoes
- `button_text_color` (text, default `'#1a1a1a'`) -- cor do texto dos botoes
- `cover_url` (text, nullable) -- URL da foto de capa
- `bg_image_url` (text, nullable) -- URL da imagem de fundo

### 4. Alteracoes em `color-utils.ts`

Adicionar `button` e `buttonText` ao objeto retornado por `buildTokens()`, usando os novos campos ou fallback para `accent_color`.

### 5. Alteracoes em `DashboardAppearance.tsx`

**Editor (lado esquerdo):**

- Adicionar dois novos `ColorInput` no Kit de Marca: "Cor dos botoes" e "Cor do texto dos botoes"
- Adicionar secao "Foto de capa" com upload de imagem (usando storage bucket `assets`)
- Adicionar secao "Imagem de fundo" com upload de imagem e toggle para ativar/desativar
- Salvar os novos campos no payload

**Preview (lado direito):**

- Botao "Salvar" usa `T.button` com borda e `T.buttonText` para o texto
- Botao "Trocar" usa `T.button` como background e `T.buttonText` para o texto
- Se `cover_url` existir, exibir no hero
- Se `bg_image_url` existir, usar como background da pagina com overlay semi-transparente

### 6. Alteracoes em `PublicProfile.tsx`

- Botoes CTA usam `T.button` e `T.buttonText` em vez de `T.accent`/`T.text1`
- Se layout tiver `cover_url`, exibir como hero (ou sobrepor ao hero existente)
- Se layout tiver `bg_image_url`, aplicar como `background-image` no container com overlay

### 7. Arquivos alterados

1. **Migracao SQL** -- 4 novas colunas em `profile_layouts`
2. **`src/lib/color-utils.ts`** -- Novos tokens `button` e `buttonText` em `buildTokens()`
3. **`src/pages/DashboardAppearance.tsx`** -- Novos controles no editor + preview atualizado
4. **`src/pages/PublicProfile.tsx`** -- Botoes e fundo usando novos tokens/imagens
5. **`src/integrations/supabase/types.ts`** -- Atualizado automaticamente apos migracao

### 8. Detalhes de UX

- Foto de capa: o usuario faz upload de uma imagem que aparece como banner no topo do perfil. Se nao tiver foto de capa, o comportamento atual (foto do perfil como hero) se mantem.
- Imagem de fundo: o usuario faz upload de uma textura/pattern/foto. Ela e exibida com um overlay da `bg_color` com opacidade (~85%) para manter legibilidade.
- Cores dos botoes: preview atualiza em tempo real conforme o usuario muda as cores.

