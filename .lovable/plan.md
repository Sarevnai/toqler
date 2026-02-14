

# Slugs Automáticos: empresa/usuario

## Resumo

Tornar o slug dos cartões NFC totalmente automático, no formato `empresa/usuario`. O slug será gerado a partir do nome da empresa e do perfil vinculado, sem edição manual.

## Mudanças

### 1. Adicionar campo `slug` na tabela `companies`

Criar uma migration para adicionar uma coluna `slug` (text, unique) na tabela `companies`. Isso permite que cada empresa tenha um identificador URL fixo e consistente.

Preencher automaticamente o slug da empresa existente ("Greattings" -> "greattings").

Criar um trigger para gerar o slug automaticamente ao criar novas empresas.

### 2. Reformular a criação de cartões (`DashboardCards.tsx`)

- **Vincular perfil passa a ser obrigatório** (sem perfil, não há como gerar o slug)
- **Remover o campo de slug manual** do formulário
- **Auto-gerar o slug** quando o perfil for selecionado: `{company_slug}/{slugify(profile_name)}`
- Exibir o link final como preview (somente leitura)
- Se houver colisão de slug (dois perfis com mesmo nome), adicionar sufixo numérico

### 3. Fluxo do usuário

```text
1. Usuário clica "Novo cartão"
2. Digita o nome do cartão (label)
3. Seleciona o perfil (obrigatório)
4. Sistema gera automaticamente: greattings/joao-silva
5. Preview do link: toqler.lovable.app/c/greattings/joao-silva
6. Usuário confirma a criação
```

## Detalhes Técnicos

### Migration SQL

- `ALTER TABLE companies ADD COLUMN slug text UNIQUE`
- `UPDATE companies SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g'))` para dados existentes
- Trigger `on INSERT` para auto-gerar slug de novas empresas
- Atualizar o tipo `companies` no schema

### Lógica de geração do slug no frontend

```text
slug = `${company.slug}/${slugify(profile.name)}`
```

Onde `slugify` normaliza acentos, remove caracteres especiais e converte para lowercase com hífens.

### Tratamento de colisão

Ao salvar, se o slug já existir (erro 23505), o sistema tentará adicionar sufixo `-2`, `-3`, etc.

### Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| Migration SQL | Adicionar coluna `slug` em `companies` |
| `src/pages/DashboardCards.tsx` | Remover campo slug manual, auto-gerar a partir de empresa+perfil, perfil obrigatório |
| `src/types/entities.ts` | Atualizar tipo Company se necessário |
| `src/hooks/useAuth.tsx` | Buscar `company.slug` junto com o membership (ou fetch separado) |

