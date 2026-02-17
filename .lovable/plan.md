

# Reestruturar a pagina de Aparencia para o novo design do cartao

## Problema atual

A pagina `DashboardAppearance.tsx` tem um preview e controles baseados no design antigo:
- Selects de Layout, Botoes, Fonte e Fundo que nao se aplicam mais (o novo design tem estilo fixo premium)
- Preview mostra um layout completamente diferente do cartao publico real
- Ordem dos CTAs mostra WhatsApp/Instagram/LinkedIn/Website como botoes empilhados, mas no novo design eles aparecem como grid de icones na secao Social

## O que muda

### 1. Remover controles obsoletos
Os selects de "Layout", "Botoes", "Fonte" e "Fundo" serao removidos, pois o novo design tem estilo fixo (Playfair Display + DM Sans, fundo off-white, cards brancos, accent verde-limao).

### 2. Atualizar secoes visiveis
Substituir os toggles atuais por toggles que correspondem as secoes reais do novo cartao:
- Cabecalho da empresa (logo + tagline)
- Botao Salvar Contato
- Formulario de lead (Trocar Contato)
- Secao Bio
- Secao Contato
- Secao Social
- Secao Video

Isso requer adicionar novas colunas na tabela `profile_layouts`: `show_bio`, `show_contact`, `show_social`, `show_video`.

### 3. Reescrever o preview
O preview lateral sera recriado como uma versao miniatura fiel do novo design do cartao:
- Hero photo (aspect 4/3.2) com overlay
- Card body sobreposto com nome em serif, cargo uppercase
- Brand row (logo + tagline)
- CTAs em grid 2 colunas (Salvar Contato / Trocar Contato)
- Secoes: Bio, Contato, Social (grid 4 cols), Video
- Footer "Powered by Toqler"

### 4. Atualizar PublicProfile para respeitar os novos toggles
O `PublicProfile.tsx` sera atualizado para ler os novos flags (`show_bio`, `show_contact`, `show_social`, `show_video`) e esconder/mostrar as secoes correspondentes.

## Detalhes tecnicos

### Migracao SQL

```sql
ALTER TABLE public.profile_layouts
  ADD COLUMN IF NOT EXISTS show_bio boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_contact boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_social boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_video boolean NOT NULL DEFAULT true;
```

### Arquivos alterados

1. **Migracao SQL** — adicionar 4 colunas novas
2. **`src/pages/DashboardAppearance.tsx`** — reescrita completa:
   - Remover card "Estilo" (Layout/Botoes/Fonte/Fundo)
   - Atualizar card "Secoes visiveis" com os 7 toggles
   - Manter card "Ordem dos CTAs" (ordem dos icones sociais)
   - Reescrever preview para espelhar o novo design premium
   - Atualizar payload de save com as novas colunas
3. **`src/pages/PublicProfile.tsx`** — adicionar leitura dos novos flags para mostrar/esconder Bio, Contato, Social e Video

### Preview — estrutura visual (miniatura)

```text
+----------------------------+
|  [Hero Photo 4/3.2]       |
|  + overlay gradiente       |
+----------------------------+
|  Card Body (rounded-t)     |
|  Nome (serif)              |
|  CARGO UPPERCASE           |
|  Logo ---- tagline         |
|  ─────────────────────     |
|  [Salvar] [Trocar]         |
+----------------------------+
|  Bio card                  |
+----------------------------+
|  Contato card              |
+----------------------------+
|  Social grid (4 cols)      |
+----------------------------+
|  Video                     |
+----------------------------+
|  Powered by Toqler         |
+----------------------------+
```

Cada secao no preview respeita o toggle correspondente — ao desligar uma secao no editor, ela desaparece do preview em tempo real.

### Funcionalidades preservadas
- Salvar/atualizar layout no banco
- Selecionar perfil para preview
- Ordem dos CTAs sociais
- Compatibilidade com colunas existentes (show_company_header, show_save_contact, show_lead_form)

