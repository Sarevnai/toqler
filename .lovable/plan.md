

# Analise Completa do Greattings -- Status Atual e Plano de Execucao

---

## Diagnostico: O que esta FUNCIONANDO vs MOCKADO

### Funcionando (conectado ao banco de dados)
| Area | Status | Detalhes |
|------|--------|---------|
| Autenticacao | Funcional | Login/signup com email + Google OAuth, reset de senha |
| Onboarding | Funcional | Criacao de empresa via RPC (idempotente) |
| Perfis (CRUD) | Funcional | Criar, listar, publicar/despublicar, excluir |
| Cartoes NFC (CRUD) | Funcional | Criar (UID automatico), listar, ativar/desativar, excluir |
| Perfil Publico | Funcional | Exibicao de perfil, CTAs, vCard, formulario de lead, tracking de eventos |
| Leads | Funcional | Listagem, filtros, exportacao CSV |
| Analytics | Funcional | Graficos de visualizacoes/leads e distribuicao de CTAs (dados reais da tabela events) |
| Configuracoes | Parcial | Salva nome, cor, branding, follow-up -- mas faltam funcionalidades |
| Overview | Funcional | KPIs e grafico de 7 dias com dados reais |

### MOCKADO / Incompleto
| Area | Problema |
|------|----------|
| **Integracoes** | 100% mockado -- lista estatica de 12 integracoes com badge "Em breve", nenhuma funcionalidade real |
| **Editar perfil** | Nao existe -- so cria e exclui. Nao ha tela para editar campos de um perfil existente |
| **Upload de foto/logo** | Nao implementado -- campos `photo_url`, `cover_url`, `logo_url` existem no banco mas nao ha upload |
| **Vincular cartao a perfil** | Nao implementado -- `nfc_cards.profile_id` existe mas nunca e preenchido |
| **Convite de membros** | Nao implementado -- Settings mostra membros mas nao tem convite funcional (campo `inviteEmail` existe no estado mas nao e usado) |
| **Email de follow-up** | Toggle existe mas nenhuma logica de envio |
| **Profile Layouts** | Tabela existe, PublicProfile le os dados, mas nao ha UI para configurar o layout |
| **Remover branding** | Toggle salva no banco, respeitado no perfil publico -- mas deveria estar atras de um plano pago (nao ha billing) |

---

## Plano de Execucao em Fases

### FASE 1 -- Completar o Core (Perfis e Cartoes)
**Objetivo:** Tornar o produto minimamente utilizavel para o fluxo principal: criar perfil completo, vincular ao cartao NFC, e compartilhar.

**Mudancas:**
1. **Tela de edicao de perfil** -- ao clicar em um perfil existente, abrir formulario pre-preenchido para editar todos os campos (nome, cargo, bio, redes sociais, video)
2. **Upload de foto do perfil** -- criar um storage bucket e implementar upload de imagem no formulario de perfil, salvando a URL em `photo_url`
3. **Vincular cartao NFC a perfil** -- no formulario do cartao, adicionar select para escolher um perfil da empresa. Atualizar `nfc_cards.profile_id`
4. **Upload de logo da empresa** -- no Settings, permitir upload do logo que aparece no perfil publico

**Arquivos afetados:** `DashboardProfiles.tsx`, `DashboardCards.tsx`, `DashboardSettings.tsx`, nova migracao para storage bucket

---

### FASE 2 -- Gestao de Equipe
**Objetivo:** Permitir que admins convidem membros para a empresa.

**Mudancas:**
1. **Convite por email** -- implementar logica de convite: admin insere email, sistema cria um registro de convite pendente
2. **Aceitar convite** -- ao fazer login/signup, usuario verifica se tem convites pendentes e e adicionado a empresa
3. **Mostrar nome/email dos membros** -- atualmente mostra apenas `user_id.slice(0,8)`. Criar uma tabela `user_profiles` ou buscar dados do auth

**Arquivos afetados:** `DashboardSettings.tsx`, nova tabela `invitations`, nova migracao, possivel edge function para envio de email

---

### FASE 3 -- Personalizacao do Perfil Publico
**Objetivo:** Permitir que a empresa customize a aparencia dos perfis publicos.

**Mudancas:**
1. **Editor de layout** -- nova pagina ou secao em Settings para configurar `profile_layouts` (ordem dos CTAs, mostrar/ocultar secoes, estilo de botoes)
2. **Aplicar cor primaria** -- usar `companies.primary_color` como variavel CSS no perfil publico
3. **Preview em tempo real** -- mostrar preview do perfil publico enquanto edita o layout

**Arquivos afetados:** novo componente `ProfileLayoutEditor.tsx`, `PublicProfile.tsx`, `DashboardSettings.tsx`

---

### FASE 4 -- Integracoes Reais (Webhook + Zapier)
**Objetivo:** Substituir a pagina mockada por pelo menos uma integracao funcional.

**Mudancas:**
1. **Webhook customizado** -- permitir que a empresa configure uma URL de webhook. Ao capturar um lead, disparar POST para essa URL via edge function
2. **Salvar configuracao** -- nova tabela `integrations` com `type`, `config` (JSON), `active`
3. **Atualizar pagina de integracoes** -- mostrar integracoes configuradas vs disponiveis

**Arquivos afetados:** `DashboardIntegrations.tsx`, nova tabela `integrations`, nova edge function `webhook-dispatcher`

---

### FASE 5 -- Polimento e Funcionalidades Avancadas
**Objetivo:** Refinar a experiencia e adicionar features de valor.

**Mudancas:**
1. **Email de follow-up** -- edge function que envia email automatico ao lead usando o Lovable AI ou servico de email
2. **Paginacao de leads** -- atualmente carrega todos os leads de uma vez. Implementar paginacao server-side
3. **Dashboard responsivo** -- revisar UX mobile em todas as telas do dashboard
4. **Notificacoes em tempo real** -- usar Supabase Realtime para notificar novos leads no dashboard

---

## Resumo da Prioridade

```text
FASE 1: Core (Perfis + Cartoes + Upload)     -- Maior impacto, desbloqueia uso real
FASE 2: Gestao de Equipe                      -- Essencial para B2B
FASE 3: Personalizacao                        -- Diferencial competitivo
FASE 4: Integracoes                           -- Valor para empresas maiores
FASE 5: Polimento                             -- Qualidade e retencao
```

## Detalhes Tecnicos

- **Storage:** Sera necessario criar um bucket no Lovable Cloud para armazenar fotos e logos
- **Edge Functions:** Necessarias para webhook dispatcher (Fase 4) e email de follow-up (Fase 5)
- **Novas tabelas:** `invitations` (Fase 2), `integrations` (Fase 4)
- **RLS:** Todas as novas tabelas seguirao o padrao existente com `is_company_member` / `is_company_admin`
- **Realtime:** Fase 5 requer habilitar realtime na tabela `leads`

