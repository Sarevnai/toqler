
# Alteracoes visuais: email, logo maior e tagline editavel

## Resumo

Tres alteracoes visuais que afetam tanto o perfil publico quanto o preview na pagina de aparencia:

1. **Email no perfil** -- adicionar campo `email` na tabela `profiles`, exibir na secao Contato do perfil publico e no preview da aparencia
2. **Logo maior** -- aumentar o tamanho da logo da empresa no perfil publico (de `h-7` para `h-10`) e no preview (de `h-4` para `h-6`)
3. **Tagline editavel** -- adicionar coluna `tagline` na tabela `companies`, substituir o texto hardcoded "We connect. For real." pelo valor do banco, e adicionar campo de edicao na pagina de aparencia

## Detalhes tecnicos

### 1. Migracao SQL

```sql
-- Adicionar email ao perfil
ALTER TABLE public.profiles ADD COLUMN email text;

-- Adicionar tagline a empresa
ALTER TABLE public.companies ADD COLUMN tagline text DEFAULT 'We connect. For real.';
```

### 2. `src/pages/DashboardProfiles.tsx`

- Adicionar `email` ao `emptyForm`
- Adicionar campo de input para email no formulario de criacao/edicao de perfil
- Incluir `email` no payload de insert/update

### 3. `src/pages/PublicProfile.tsx`

- Adicionar email aos `contactItems` (com icone `Mail` e link `mailto:`)
- Aumentar logo de `h-7` para `h-10`
- Substituir tagline hardcoded por `company.tagline`

### 4. `src/pages/DashboardAppearance.tsx`

- Adicionar input editavel para tagline (salvo na tabela `companies`)
- Aumentar logo no preview de `h-4` para `h-6`
- Adicionar email no preview da secao Contato (mostrar `p.email` se existir)
- Substituir tagline hardcoded no preview por `company.tagline`

### 5. `src/types/entities.ts`

- Adicionar `email?: string` ao tipo `Profile` (se existir la)

### Arquivos alterados

1. Nova migracao SQL (email em profiles + tagline em companies)
2. `src/pages/DashboardProfiles.tsx` -- campo email no formulario
3. `src/pages/PublicProfile.tsx` -- email no contato, logo maior, tagline dinamica
4. `src/pages/DashboardAppearance.tsx` -- input tagline, logo maior, email no preview, tagline dinamica
5. `src/types/entities.ts` -- tipo atualizado
