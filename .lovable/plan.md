

# Links NFC Pre-programados com Slug Personalizado

## Conceito

Os cartoes NFC serao entregues ao cliente ja programados pela Greattings. O admin cadastra o cartao no sistema, define o slug (ex: `empresa/joao-silva`), e a equipe Greattings grava a URL na tag fisica antes de enviar. O cliente nao precisa (e nao consegue) alterar a URL gravada -- apenas gerencia o perfil vinculado pelo dashboard.

O link gravado na tag sera permanente:
```
https://greattings.lovable.app/c/empresa/joao-silva
```

O perfil vinculado pode ser trocado a qualquer momento sem regravar a tag.

## O que muda

### 1. Banco de dados
- Adicionar coluna `slug` (text, UNIQUE) na tabela `nfc_cards`
- Adicionar coluna `slug_locked` (boolean, default false) -- quando `true`, o slug nao pode ser editado (travado apos gravacao fisica)
- Indice unico no slug
- Politica RLS publica de SELECT para permitir resolucao do slug sem autenticacao

### 2. Nova pagina: `CardRedirect.tsx`
- Rota `/c/:slug` (aceita formato `empresa/colaborador` via rota `/c/*`)
- Busca o cartao pelo slug
- Valida se esta ativo e tem perfil vinculado
- Registra evento `nfc_tap` para analytics
- Redireciona automaticamente para `/p/{profileId}`
- Exibe mensagens amigaveis de erro (cartao inativo, sem perfil, etc.)

### 3. Atualizar `App.tsx`
- Adicionar rota `<Route path="/c/*" element={<CardRedirect />} />`

### 4. Atualizar `DashboardCards.tsx`
- Campo de slug no formulario de criacao com auto-sugestao baseada no label
- Validacao: apenas letras minusculas, numeros, hifens e barras
- Exibir o link completo na listagem com botao "Copiar link"
- Quando `slug_locked = true`, o campo slug fica read-only com indicador visual (cadeado)
- O admin ainda pode: trocar o perfil vinculado, ativar/desativar o cartao, excluir
- O admin NAO pode: alterar o slug depois de travado

### 5. Fluxo operacional

```text
1. Admin cria cartao no dashboard -> define slug "empresa/joao-silva"
2. Sistema gera link: greattings.lovable.app/c/empresa/joao-silva
3. Equipe Greattings grava link na tag NFC fisica
4. Admin (ou Greattings) clica "Travar slug" -> slug_locked = true
5. Cartao e enviado ao cliente
6. Visitante aproxima celular -> abre o link -> redirecionado ao perfil
```

## Detalhes Tecnicos

**Migracao SQL:**
```sql
ALTER TABLE nfc_cards ADD COLUMN slug text UNIQUE;
ALTER TABLE nfc_cards ADD COLUMN slug_locked boolean NOT NULL DEFAULT false;
CREATE UNIQUE INDEX idx_nfc_cards_slug ON nfc_cards(slug) WHERE slug IS NOT NULL;

-- Permitir busca publica por slug (necessario para redirecionamento)
CREATE POLICY "Public slug resolution" ON nfc_cards
  FOR SELECT USING (slug IS NOT NULL);
```

**Validacao do slug:**
- Regex: `^[a-z0-9]+(?:[-/][a-z0-9]+)*$`
- Minimo 3 caracteres, maximo 60
- Barra `/` permitida para formato empresa/colaborador
- Nao pode comecar ou terminar com hifen ou barra

**Arquivos criados:**
- `src/pages/CardRedirect.tsx`

**Arquivos editados:**
- `src/App.tsx` (nova rota)
- `src/pages/DashboardCards.tsx` (campo slug, link copiavel, travamento)
- Nova migracao SQL
