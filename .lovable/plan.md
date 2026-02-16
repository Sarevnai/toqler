

# Corrigir redirecionamento do cartao NFC

## Problema

Quando o usuario acessa `toqler.lovable.app/c/greattings/ian-veras`, o sistema resolve o slug corretamente mas redireciona para `/p/e706e428-...`, expondo o UUID na barra de endereco. A URL amigavel do slug e perdida.

## Solucao

Alterar o `CardRedirect.tsx` para **renderizar o perfil publico diretamente** na rota `/c/`, em vez de redirecionar para `/p/:profileId`.

## Detalhes tecnicos

### Passo 1 - Refatorar CardRedirect.tsx

Em vez de `navigate('/p/${card.profile_id}')`, armazenar o `profile_id` resolvido no state e renderizar o componente `PublicProfile` diretamente.

Para isso, o `PublicProfile` precisa aceitar um `profileId` via props (alem de via `useParams`).

### Passo 2 - Atualizar PublicProfile.tsx

Modificar o componente para aceitar uma prop opcional `profileId`, com fallback para `useParams().profileId`. Isso permite que seja usado tanto na rota `/p/:profileId` quanto embutido no `CardRedirect`.

```text
Antes:
  /c/greattings/ian-veras -> resolve slug -> navigate('/p/uuid') -> URL muda para UUID

Depois:
  /c/greattings/ian-veras -> resolve slug -> renderiza PublicProfile inline -> URL permanece /c/greattings/ian-veras
```

### Arquivos alterados

- `src/pages/CardRedirect.tsx` — renderizar PublicProfile diretamente em vez de redirecionar
- `src/pages/PublicProfile.tsx` — aceitar prop `profileId` opcional

