

## Correção: Loop Infinito no Onboarding (Empresas Duplicadas)

### Problema Identificado

O RPC `create_company_with_membership` funciona corretamente (status 200), mas o usuario fica preso em um loop:

1. Empresa e criada com sucesso
2. Redireciona para `/dashboard`
3. `useAuth` busca membership com `.maybeSingle()` -- que retorna `null` quando ha **mais de uma** linha
4. `DashboardLayout` ve `companyId = null` e redireciona de volta para `/onboarding`
5. Usuario clica novamente, criando mais uma empresa duplicada

O usuario ja tem **5 empresas duplicadas** no banco de dados.

### Solucao (3 partes)

#### 1. Limpeza dos dados duplicados

Executar SQL para remover as 4 empresas duplicadas, mantendo apenas a primeira ("Empresa Teste LTDA" ou a primeira "Smolka Imoveis", conforme preferencia do usuario).

#### 2. Corrigir `useAuth` -- trocar `.maybeSingle()` por busca do primeiro resultado

No arquivo `src/hooks/useAuth.tsx`, alterar a query de membership para usar `.limit(1).maybeSingle()` ou `.select().limit(1)` para sempre retornar apenas uma linha, mesmo que existam multiplas memberships.

```typescript
// De:
const { data } = await supabase
  .from("company_memberships")
  .select("company_id, role")
  .eq("user_id", user.id)
  .maybeSingle();

// Para:
const { data } = await supabase
  .from("company_memberships")
  .select("company_id, role")
  .eq("user_id", user.id)
  .order("created_at", { ascending: true })
  .limit(1)
  .maybeSingle();
```

#### 3. Prevenir duplicatas no RPC

Atualizar a funcao `create_company_with_membership` no banco de dados para verificar se o usuario ja possui uma empresa antes de criar outra. Se ja tiver, retorna o ID da empresa existente.

```sql
CREATE OR REPLACE FUNCTION public.create_company_with_membership(_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id uuid;
  _existing_company_id uuid;
BEGIN
  -- Check if user already has a company
  SELECT company_id INTO _existing_company_id
    FROM company_memberships
    WHERE user_id = auth.uid()
    LIMIT 1;

  IF _existing_company_id IS NOT NULL THEN
    RETURN _existing_company_id;
  END IF;

  INSERT INTO companies (name) VALUES (_name) RETURNING id INTO _company_id;
  INSERT INTO company_memberships (company_id, user_id, role)
    VALUES (_company_id, auth.uid(), 'admin');
  RETURN _company_id;
END;
$$;
```

### Arquivos Modificados

- **Migracao SQL**: Limpeza de dados duplicados + atualizacao da funcao RPC
- **`src/hooks/useAuth.tsx`**: Adicionar `.order()` e `.limit(1)` na query de membership

### Resultado Esperado

- Usuarios com multiplas empresas nao ficam mais presos no onboarding
- Cliques duplos no botao "Criar empresa" nao geram duplicatas
- O fluxo onboarding -> dashboard funciona de forma confiavel

