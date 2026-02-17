
## Sistema de Enquadramento de Foto do Perfil

### Problema
Hoje a foto do perfil usa `object-cover` com posicao fixa `object-[center_20%]`. Se o usuario sobe uma foto onde o rosto esta em outra posicao, o resultado fica ruim e nao ha como ajustar.

### Solucao
Adicionar um controle de enquadramento (pan/drag) no editor de perfil que permite ao usuario reposicionar a foto dentro do frame. Simples, visual e intuitivo.

### Como vai funcionar

1. **No editor de perfil (DashboardProfiles)**: Ao selecionar uma foto, o usuario ve um preview do frame (aspect ratio 4/3.2) e pode arrastar a imagem para posicionar o rosto onde quiser
2. **Dica educativa**: Um texto sutil orienta o usuario sobre o melhor tipo de foto (vertical, boa iluminacao, rosto visivel)
3. **Posicao salva no banco**: Dois campos novos `photo_offset_x` e `photo_offset_y` (0-100, representando a porcentagem do `object-position`)
4. **Perfil publico e preview**: Usam os valores salvos em vez do fixo `center 20%`

### Detalhes tecnicos

**1. Migracao no banco de dados**

Adicionar duas colunas na tabela `profiles`:
- `photo_offset_x` (integer, default 50) -- posicao horizontal em %
- `photo_offset_y` (integer, default 30) -- posicao vertical em % (30% como padrao pois rostos costumam estar no terco superior)

**2. Componente PhotoFrameEditor (novo)**

Arquivo: `src/components/dashboard/PhotoFrameEditor.tsx`

- Exibe a foto dentro de um container com aspect ratio 4/3.2 (mesmo do perfil publico)
- Permite arrastar (mousedown/mousemove/touchstart/touchmove) para reposicionar
- Mostra um indicador visual de "arraste para ajustar"
- Retorna os valores `offsetX` e `offsetY` via callback

**3. Alteracoes em DashboardProfiles.tsx**

- Substituir o preview circular simples pelo `PhotoFrameEditor` quando ha foto selecionada
- Adicionar `photo_offset_x` e `photo_offset_y` ao form state
- Salvar os offsets junto com os outros dados do perfil
- Adicionar dica educativa: "Use uma foto vertical com boa iluminacao e rosto visivel para melhor resultado"

**4. Alteracoes em PublicProfile.tsx**

- Ler `photo_offset_x` e `photo_offset_y` do perfil
- Aplicar como `object-position: {x}% {y}%` na tag img (substituindo o fixo `center_20%`)

**5. Alteracoes em DashboardAppearance.tsx**

- Mesma logica: usar os offsets salvos no preview da aparencia

### Experiencia do usuario

1. Usuario clica "Adicionar foto" no editor de perfil
2. Seleciona a imagem
3. Ve um preview realista do frame com a dica "Arraste para ajustar o enquadramento"
4. Arrasta a foto ate o rosto ficar bem posicionado
5. Salva o perfil -- posicao fica guardada
6. Perfil publico exibe a foto na posicao escolhida
