

# Kit de Marca Personalizado por Empresa

## Resumo
Cada empresa podera personalizar as cores do seu cartao publico e a fonte usada nos perfis. As cores serao inseridas via campos de texto (hex ou RGB) com um color picker nativo como apoio visual.

## O que muda para o usuario
- Na pagina **Aparencia** do dashboard, uma nova secao **"Kit de Marca"** com:
  - 4 campos de cor com input de texto (hex como `#D4E84B` ou RGB como `rgb(212, 232, 75)`) + color picker nativo ao lado para escolha visual
  - 1 seletor de fonte
- O **preview ao vivo** reflete as cores e fonte escolhidas instantaneamente
- A **pagina publica** do perfil usa as cores da empresa em vez das cores fixas

## Cores editaveis

| Cor | Label | Default | Onde aplica |
|-----|-------|---------|-------------|
| Cor de acento | accent_color | #D4E84B | Botao "Trocar Contato", destaques |
| Cor de fundo | bg_color | #f5f4f0 | Background geral da pagina |
| Cor dos cards | card_color | #ffffff | Cards de bio, contato, social |
| Cor do texto | text_color | #1a1a1a | Textos principais, titulos |

## Fontes disponiveis
- Inter (padrao)
- DM Sans
- Playfair Display
- JetBrains Mono

## Detalhes tecnicos

### 1. Migracao do banco de dados
Adicionar 5 colunas na tabela `profile_layouts`:

```sql
ALTER TABLE profile_layouts
  ADD COLUMN accent_color text NOT NULL DEFAULT '#D4E84B',
  ADD COLUMN bg_color text NOT NULL DEFAULT '#f5f4f0',
  ADD COLUMN card_color text NOT NULL DEFAULT '#ffffff',
  ADD COLUMN text_color text NOT NULL DEFAULT '#1a1a1a',
  ADD COLUMN font_family text NOT NULL DEFAULT 'Inter';
```

### 2. Arquivo: `src/pages/DashboardAppearance.tsx`
- Adicionar secao "Kit de Marca" com 4 linhas de cor, cada uma contendo:
  - Um `<input type="color">` (color picker nativo) para selecao visual rapida
  - Um `<input type="text">` ao lado para digitar o valor em hex (`#RRGGBB`) ou RGB (`rgb(r,g,b)`)
  - Validacao em tempo real: aceitar formatos hex (3 ou 6 digitos) e `rgb(r,g,b)`
- Seletor de fonte com `<Select>` (Inter, DM Sans, Playfair Display, JetBrains Mono)
- Substituir o objeto `T` fixo por valores derivados do estado `layout` para que o preview reflita as cores em tempo real
- Incluir `accent_color`, `bg_color`, `card_color`, `text_color`, `font_family` no payload de salvamento
- Funcao auxiliar `parseColor(input)` que converte RGB para hex (para o color picker) e valida o formato

### 3. Arquivo: `src/pages/PublicProfile.tsx`
- Substituir o objeto `T` hardcoded por uma funcao `buildTokens(layout)`:
```
buildTokens(layout) => {
  bg: layout?.bg_color || '#f5f4f0',
  card: layout?.card_color || '#ffffff',
  accent: layout?.accent_color || '#D4E84B',
  text1: layout?.text_color || '#1a1a1a',
  text2 e text3: derivados automaticamente do text1 (mais claros)
  border: derivado do bg (mais escuro)
}
```
- Aplicar `fontFamily` dinamicamente no container principal via style
- Cores derivadas (text2, text3, border) serao calculadas automaticamente a partir das cores base para manter harmonia visual

### 4. Componente de input de cor
Cada campo de cor tera este layout:

```text
[Color Picker] [#D4E84B____________]
 (quadrado)     (campo de texto editavel)
```

- Ao alterar o color picker, o campo de texto atualiza
- Ao digitar no campo de texto (hex ou rgb), o color picker atualiza
- Validacao visual: borda vermelha se o formato for invalido

### Sequencia de implementacao
1. Executar migracao SQL (5 novas colunas)
2. Atualizar `DashboardAppearance.tsx` com secao Kit de Marca + preview dinamico
3. Atualizar `PublicProfile.tsx` para consumir tokens do banco
4. Testar fluxo completo

