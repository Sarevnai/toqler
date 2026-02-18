

## Cores de botao independentes + Foto de capa + Fundo com imagem

### Status: ✅ Implementado

### Resumo das alteracoes

1. **Migracao SQL** -- 4 novas colunas em `profile_layouts`: `button_color`, `button_text_color`, `cover_url`, `bg_image_url`
2. **`src/lib/color-utils.ts`** -- Novos tokens `button`, `buttonHover` e `buttonText` em `buildTokens()`
3. **`src/pages/DashboardAppearance.tsx`** -- 2 novos ColorInputs (cor botao/texto), upload de foto de capa e imagem de fundo, preview atualizado com botoes usando tokens independentes e overlay de bg image
4. **`src/pages/PublicProfile.tsx`** -- Botoes CTA usam `T.button`/`T.buttonText`, cover_url no hero, bg_image_url como backdrop com overlay 85%
