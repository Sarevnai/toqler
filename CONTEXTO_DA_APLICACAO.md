# Contexto da Aplicação - Toqler

## O que é
**Toqler** é uma plataforma SaaS (Software as a Service) voltada para cartões de visitas digitais interativos e gestão de networking, baseada em tecnologia de link-in-bio acrescida de tecnologias de proximidade (NFC).

## Sobre o que se trata
A plataforma substitui o tradicional cartão de papel por um perfil profissional digital, rico em informações (links para redes sociais, vídeo de apresentação, resumo, telefone, site), integrado ativamente aos cartões físicos com NFC. Mais do que apenas exibir dados, atua como uma ferramenta para captura de "leads" (prospects e novos contatos) originados neste momento de networking.

## Para quem é
- **Profissionais Autônomos e Empreendedores:** Pessoas individuais ou consultores que fazem networking, prospectam clientes ou fecham vendas através do relacionamento e desejam passar uma impressão mais profissional.
- **Micro e Médias Empresas (B2B):** Organizações que fornecem estes cartões ("Perfis") corporativos padronizados para o seu time (ex: representantes de contas, executivos) analisarem o retorno de mercado por equipe, gerindo a presença de todo o time num lugar central, através da estrutura de multi-inquilinos (Multi-tenant).

## O que faz
1. **Perfis Públicos Customizáveis:** Páginas (`/p/:profileId`) desenhadas para exibir as informações de forma interativa, animada em ambas abordagens B2C/B2B (com suporte a customização pelo Brand Kit da empresa).
2. **Cards NFC:** Páginas de redirecionamento (`/c/*`) para ler o cartão de forma física e ser direcionado o respectivo perfil daquele usuário.
3. **Captura e Gestão de Leads:** Permite que durante uma abordagem, a pessoa consultora/representante no Toqler possa coletar ativamente os dados de contato do visitante da página (em troca das suas informações), gravando como "Lead" e exportando-os via painel (e-mail, webhook com notificações).
4. **Dashboards Financeiros e de Performance:** Exibe visualizações, cliques em CTAs e outras estatísticas de performance para acompanhar as taxas de conversão de networking, além de painel de empresa. 
5. **Painel Backend/Admin:** Um dashboard administrativo geral para a dona da ferramenta (Toqler) controlar tenants, contas de usuários, cupons, planos e assinaturas de todos. 

## Por que gera valor
Porque ataca uma das dores clássicas de qualquer negócio ou profissional de vendas/relacionamento: o evento do primeiro encontro, que frequentemente envolve burocracia do papel ou contatos sendo perdidos em caixas de WhatsApp repletas sem categorização. Moderniza este ciclo, salva informações diretamente via vCard (`.vcf`), dá uma aura tecnológica sobre a empresa, e traz dados reais do impacto desse esforço manual de networking (views e cliques). 

## O que tem de valor (Diferenciais Técnicos / Produto)
- Realtime Updates (notificações ativas quando ocorrem ações no Perfil do cliente).
- Dashboard elegante orientado a dados (Data-Driven), onde os clientes percebem o valor pelo volume de visualizações/impactos.
- Backend Multi-tenant com separação e isolamento lógicos rígidos usando RLS (Row Level Security) e tabelas associativas e relativas, provando escalabilidade.
- Integração de webhooks para CRMs externos fluida no momento que um Lead é convertido.

## Qual é a situação atual
O projeto se encontra numa fase onde boa parte do MVP (Minimum Viable Product) ou Core Product está validado e montado, já possuindo regras de negócios completas sobre Perfis, Leads, Cartões (NFC), Empresas (Companies), Analytics e Layouts dinâmicos. A plataforma se baseia puramente num Client e Service escalável.
- **Frontend Engine**: React + Vite, Typescript, TailwindCSS e o uso contínuo dos componentes focados em interfaces sólidas com *Shadcn UI*.
- **Backend BaaS (Backend as a Service)**: Supabase, cuidando da autenticação e dados (PostgresSQL) de forma serverless. Usa fortemente os `postgres_changes` via WebSockets de lá.  

---

## 🔍 Avaliação End-to-End (Fortalezas e Melhorias)

### 🟢 Pontos de Fortaleza
- **Arquitetura Multi-Tenant Sólida (Back-end):** A adoção de RLS (Row Level Security) nativo do Supabase desde os migrations e bancos `companies` garante isolação correta dos dados e evita vazamento de leads entre os inquilinos (clientes), tornando os requests eficientes e muito focados.
- **Delegação de Processamento (Back-end):** Funções e estatísticas como métricas do dashboard e diárias estão sendo calculadas diretamente no PostgreSQL com RPC (`get_dashboard_kpis`), evitando sobrecarregar o Client com listas não paginadas ou mapeamentos custosos no JavaScript.
- **Interface Polida, Minimalista e Responsiva (Front-end):** O uso do Shadcn UI combinado a animações do *framer-motion* entrega transições dinâmicas ao usuário na navegação nos painéis (animações em fade). A experiência em mobile aparenta ter sido muito bem pensada.

### 🔴 Pontos de Melhora
- **Acoplamento Extremo na Camada Client (Front-end):** Muitas regras de negócios e consultas ao banco (ex: `supabase.from('leads').select...`) e de autenticação/webhook estão injetadas de forma "hard-coded" diretamente nos Controllers/Visualizadores do React (`.tsx`). Uma camada intermediária abstraindo serviços (como API Layers, ou Queries Tanstack bem definidas em `hooks` próprios ex: `useLeadsList`) manteria o projeto muito mais testável e reaproveitável. 
- **Estratégia de Gestão e Cache de Estado (Front-end):** Páginas como a de Leads misturam `useEffect` manual, setando variáveis locais como data real-time versus manual loading. Implementar completamente o uso do **React Query (TanStack Query)** (já presente no package.json, porém subaproveitado pelas requisições listadas) mitigaria dezenas de `useEffect`, facilitaria infinitamente a paginação das features, e lidaria muito melhor com memory refresh da lista e invalidação nativa do cache após os inserts pelo Supabase Live channel.
- **Estratégia na Exportação de Dados Sensíveis:** O botão de exportar CSV na página de Leads efetua um grande "fetch-all" no database dentro do browser do cliente em lote, processando strings e buffers via javascript thread. Em volumes muito grandes de Leads (ex: mais de 10.000 contatos), é um método passível de dar "Out of Memory/Crash" no Client. Recomenda-se realizar exportações através do Cloud Function (Supabase Edge) processando tudo no server, despachando um e-mail com o link de Download do AWS/Bucket final ou via background task local. 
- **Reuso Lógico (Front-end / Clean Code)**: Muitas variáveis e chamadas são duplicadas na aplicação sob lógicas parecidas que geram o famoso 'boiletplate'. Pode-se unificar chamadas para evitar duplicação de lógicas de filtros complexas no UI.

---

## 📝 Histórico de Atualizações do Assistente (Changelog)

**(Regra do Usuário: Toda vez que o assistente AI introduzir um novo código na área, deverá atualizar este documento pontuando de forma clara aqui na seção suas implementações para termos este material concatenado e em memória persistente).**

* **[20/02/2026] - Criação do Documento:** Análise inicial sobre arquitetura (Frontend em React Vite + Backend em Supabase), mapeamento de domínio (O que faz) e leitura criteriosa do design system do "Toqler". Identificados os prós e contras envolvendo Client Acoplamento em relação à gestão manual de Hooks X React Query.
* **[20/02/2026] - Migração de Backend (Supabase):** Migração bem-sucedida do projeto Supabase antigo para a nova URL (`fgwrhlofmokicshckrbe`). Atualização realizada nas variáveis do `.env` e todo o schema do banco de dados (tabelas, políticas RLS, rotinas) restabelecido empurrando as migrações (Supabase CLI) direto para o ambiente remoto online.
