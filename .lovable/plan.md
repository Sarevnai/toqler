

# Corrigir alteracao de logo da empresa

## Problema
Quando o usuario faz upload de uma nova logo, o arquivo e salvo corretamente no storage (com `upsert: true`), mas a URL permanece identica (ex: `.../logo.png`). O navegador usa a versao em cache e nao exibe a nova imagem.

## Solucao
Adicionar um parametro de cache-busting (timestamp) na URL da logo apos o upload, forcando o navegador a baixar a nova versao.

## Detalhes tecnicos

### Arquivo: `src/pages/DashboardSettings.tsx`

Na funcao `handleSave`, apos o upload bem-sucedido, adicionar um timestamp na URL:

```typescript
// Linha ~102 - Adicionar cache-busting
logo_url = `${SUPABASE_URL}/storage/v1/object/public/assets/${path}?t=${Date.now()}`;
```

Tambem atualizar o estado `company` apos salvar para que o preview na mesma pagina reflita a mudanca sem precisar recarregar:

```typescript
// Apos o update bem-sucedido (depois da linha 109)
setCompany(prev => prev ? { ...prev, ...form, logo_url } : null);
```

### Resumo das alteracoes
- 1 arquivo modificado: `src/pages/DashboardSettings.tsx`
- 2 linhas alteradas: cache-busting na URL + atualizacao do estado local
