
# Corrigir logo e tagline no perfil publico

## Problema

A tabela `companies` nao tem uma politica RLS publica de leitura. Quando um visitante (nao autenticado) acessa o perfil publico, a query `supabase.from("companies").select("*").eq("id", p.company_id)` retorna `null` porque o RLS bloqueia o acesso. Por isso, o logo da empresa e a tagline nao aparecem no perfil publico, mesmo estando configurados.

## Solucao

Adicionar uma politica RLS na tabela `companies` que permita leitura publica quando a empresa tem pelo menos um perfil publicado. Isso garante que visitantes vejam o logo e tagline no perfil publico, sem expor empresas que nao tem perfis publicados.

## Detalhes tecnicos

### Migracao SQL

```sql
CREATE POLICY "Public can view companies with published profiles"
  ON public.companies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.company_id = companies.id
        AND profiles.published = true
    )
  );
```

### Arquivos alterados

1. **Nova migracao SQL** — adicionar politica RLS publica na tabela `companies`

Nenhuma alteracao de codigo e necessaria. O `PublicProfile.tsx` ja faz a query corretamente (linha 115) e ja renderiza o logo e tagline (linhas 221-226). O problema e exclusivamente de permissao no banco de dados.
