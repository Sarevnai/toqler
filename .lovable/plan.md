
# Auditoria Completa -- Greattings

## 1. Resumo Executivo

A aplicacao Greattings esta em estagio funcional solido: autenticacao, multi-tenancy com RLS, gestao de perfis, cartoes NFC com slugs personalizados, analytics, leads com realtime, webhooks e personalizacao de aparencia estao implementados. A arquitetura e limpa e segue padroes consistentes. Existem problemas de impacto medio/baixo que, corrigidos, elevarao a qualidade significativamente.

---

## 2. Arquitetura e Estrutura

### Problemas Encontrados

| Prioridade | Problema | Detalhe |
|-----------|---------|--------|
| Medio | `App.css` com codigo Vite boilerplate | Contem estilos `.logo`, `.card`, `.read-the-docs` que nao sao usados e o `#root` com `max-width: 1280px` pode conflitar com layouts full-width |
| Medio | Paginas dashboard muito grandes (150-300 linhas) | `DashboardCards`, `DashboardProfiles`, `DashboardSettings`, `DashboardAppearance` misturam logica de dados, formularios e listagem num unico arquivo |
| Baixo | Tipagem `any` generalizada | Todos os states usam `any[]` em vez de tipos definidos. Ex: `useState<any[]>([])` em todas as paginas |
| Baixo | Poucos componentes dashboard reutilizaveis | Apenas `DashboardSidebar` e `ShareProfileDialog` existem em `components/dashboard/`. Cada pagina reimplementa padroes semelhantes (header + busca + lista) |
| Baixo | Import `Wifi` remanescente | `PublicProfile.tsx` (linha 8) e `DashboardAppearance.tsx` (linha 9) ainda importam o icone `Wifi` do Lucide, contrariando a diretriz de branding minimalista |

### Sugestoes

- Deletar `App.css` ou limpar o conteudo boilerplate
- Extrair hooks customizados (ex: `useProfiles`, `useCards`, `useCompany`) para separar logica de dados da UI
- Criar tipos TypeScript baseados no schema do banco em vez de usar `any`
- Remover imports de `Wifi` restantes

---

## 3. Fluxo do Usuario

### Mapeamento

```text
Landing (/) --> Auth (/auth) --> Onboarding (/onboarding) --> Dashboard (/dashboard)
                                                                |
                                    +---------------------------+---------------------------+
                                    |           |        |       |        |          |       |
                                 Overview  Profiles  Cards   Leads  Analytics  Appearance  Settings
                                                       |
                                               Slug --> /c/:slug --> /p/:profileId (publico)
```

### Pontos de Friccao

| Prioridade | Problema |
|-----------|---------|
| Alto | Apos criar conta, o usuario precisa confirmar email e depois voltar manualmente. Nao ha redirect automatico apos confirmacao |
| Medio | No `Onboarding`, apos criar empresa, usa `window.location.href` (reload completo) em vez de `navigate()` -- necessario para recarregar o contexto de auth, mas experiencia brusca |
| Medio | O botao "Editar" na Overview redireciona para `/dashboard/profiles` genericamente, nao abre o perfil especifico para edicao |
| Baixo | ShareProfileDialog mostra link com UUID (`/p/{uuid}`) em vez de usar o slug do cartao NFC quando disponivel |

---

## 4. Design e UX/UI

| Prioridade | Problema |
|-----------|---------|
| Medio | `PublicProfile.tsx` usa `<iframe>` para video sem sanitizar a URL -- qualquer URL sera embedada, nao apenas YouTube/Vimeo |
| Medio | Formularios usam `confirm()` nativo do browser para acoes destrutivas (excluir perfil, excluir cartao, travar slug) -- inconsistente com o design system |
| Baixo | `DashboardAppearance` tem preview com `Wifi` icon no branding footer -- deve ser apenas texto |
| Baixo | Na listagem de cartoes, o `pl-14` para alinhar o slug pode desalinhar em mobile |
| Baixo | `ShareProfileDialog` usa `<select>` nativo HTML em vez do componente `Select` do design system |

---

## 5. Performance

| Prioridade | Problema |
|-----------|---------|
| Medio | `DashboardOverview` carrega TODOS os eventos (`select("*")`) do banco para calcular KPIs no frontend -- com milhares de eventos isso sera lento. Deveria usar `count` ou funcoes SQL |
| Medio | `DashboardAnalytics` tambem carrega todos os eventos para calcular graficos client-side |
| Medio | Nenhum lazy loading de rotas -- todas as paginas sao importadas estaticamente no `App.tsx` |
| Baixo | `get-team-members` edge function usa `listUsers({ perPage: 1000 })` que lista TODOS os usuarios do sistema, nao apenas os da empresa -- ineficiente e potencial problema de privacidade |
| Baixo | `fetchData()` e chamado apos cada operacao CRUD (create, update, delete) refazendo a query completa em vez de atualizar o state local |

---

## 6. Funcionalidades -- Status

| Feature | Status | Observacao |
|---------|--------|-----------|
| Autenticacao (email + Google) | Funcional | Validacao com Zod, reset de senha implementado |
| Onboarding | Funcional | Cria empresa e membership atomicamente via RPC |
| Perfis CRUD | Funcional | Upload de foto, publish/unpublish, edicao |
| Cartoes NFC + Slug | Funcional | Slug com validacao, lock, copy link, redirect |
| Perfil Publico | Funcional | Layout customizavel, CTAs, vCard, lead form |
| Leads | Funcional | Realtime, paginacao, filtros, export CSV |
| Analytics | Funcional | Charts mensais e distribuicao de CTAs |
| Webhooks | Funcional | CRUD, teste, dispatcher via edge function |
| Follow-up Email | Parcial | Gera email via AI mas NAO envia de fato -- apenas registra no events |
| Aparencia/Layout | Funcional | Preview ao vivo, estilos customizaveis |
| Convites de equipe | Funcional | Convite por email, auto-accept, roles |
| Multi-tenancy/RLS | Funcional | Isolamento completo via `is_company_member`/`is_company_admin` |

### Bugs/Problemas Identificados

| Prioridade | Bug |
|-----------|-----|
| Alto | `send-follow-up` e `webhook-dispatcher` sao chamados diretamente do frontend SEM autenticacao (apenas `apikey`). Qualquer pessoa pode triggerar webhooks para qualquer `company_id` |
| Medio | `DashboardCards.tsx` linha 118: `{ slug_locked: true } as any` -- cast forçado indica problema de tipagem |
| Medio | `DashboardIntegrations.tsx` linha 93-104: teste de webhook e feito do FRONTEND, o que falha com CORS na maioria das URLs externas |

---

## 7. Seguranca

| Prioridade | Problema |
|-----------|---------|
| Critico | Edge functions `webhook-dispatcher` e `send-follow-up` nao verificam autenticacao -- qualquer chamada com a anon key pode disparar webhooks ou gerar follow-ups |
| Alto | `get-team-members` lista todos os usuarios via `admin.listUsers` com `perPage: 1000` -- expoe emails de usuarios de outras empresas na memoria do servidor |
| Medio | A RLS policy "Public slug resolution" permite `SELECT` em todas as colunas do `nfc_cards` quando `slug IS NOT NULL` -- expoe `company_id`, `profile_id`, `tag_uid` para visitantes anonimos |

---

## 8. Priorizacao -- Acoes por Impacto

### Critico (fazer imediatamente)
1. Adicionar verificacao de autenticacao nas edge functions `webhook-dispatcher` e `send-follow-up`
2. Corrigir `get-team-members` para filtrar usuarios por IDs em vez de listar todos

### Alto
3. Mover calculo de KPIs e analytics para queries SQL agregadas (count, group by) em vez de carregar todos os eventos
4. Corrigir redirect apos confirmacao de email
5. Restringir a policy "Public slug resolution" para expor apenas `profile_id` e `status` (usar uma view)

### Medio
6. Implementar lazy loading de rotas com `React.lazy()` + `Suspense`
7. Limpar `App.css` boilerplate
8. Remover imports `Wifi` restantes (`PublicProfile.tsx`, `DashboardAppearance.tsx`)
9. Substituir `confirm()` nativo por AlertDialog do design system
10. Mover teste de webhook para edge function (evitar CORS)
11. Sanitizar URLs de video no perfil publico (aceitar apenas YouTube/Vimeo)

### Baixo
12. Criar tipos TypeScript para entidades (Profile, Card, Lead, Company, etc.)
13. Extrair hooks de dados (`useProfiles`, `useCards`, etc.)
14. Usar componente `Select` no `ShareProfileDialog` em vez de `<select>` nativo
15. Otimizar re-fetches apos CRUD (atualizar state local)

---

## 9. Plano de Acao Sugerido

### Fase 1 -- Seguranca (urgente)
- Proteger edge functions com verificacao de JWT
- Corrigir `get-team-members` para nao listar todos os usuarios
- Restringir dados expostos pela policy de slug publico

### Fase 2 -- Performance
- Mover calculos de analytics para SQL (criar funcoes RPC ou views)
- Implementar lazy loading de rotas
- Otimizar re-fetches

### Fase 3 -- Qualidade de Codigo
- Limpar boilerplate (`App.css`, imports nao usados)
- Criar tipos TypeScript
- Extrair hooks reutilizaveis
- Substituir `confirm()` por `AlertDialog`

### Fase 4 -- UX Polish
- Melhorar fluxo pos-signup (redirect automatico)
- Sanitizar embed de video
- Mover teste de webhook para backend
- Usar slug nos links de compartilhamento quando disponivel
