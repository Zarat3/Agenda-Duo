> **IMPORTANTE:** Sempre responda em português brasileiro (pt-BR), independentemente do idioma da pergunta.

# CLAUDE.md — Agenda Duo

## O que é este projeto

Agenda Duo é um sistema de gestão de agenda odontológica para **duplas de estudantes** em clínica universitária. Cada dupla (dois estudantes) compartilha uma conta para agendar pacientes, registrar consultas, manter prontuários e exportar relatórios.

- **Público:** estudantes de odontologia em disciplinas clínicas
- **Admin:** `eliasafdiasmello@gmail.com` — gerencia duplas, aprova cadastros
- **Status:** produção ativa no Vercel (branch `main` → deploy automático)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 6 |
| Estilo | Tailwind CSS v4 (CSS-first, sem `tailwind.config.js`) |
| Roteamento | react-router-dom v7 |
| Banco/Auth/Storage | Supabase (PostgreSQL + RLS + Realtime + Auth + Storage) |
| Deploy | Vercel (funções serverless em `/api/`) |
| Ícones | lucide-react |
| Datas | date-fns v4 + ptBR locale |
| Export PNG | html2canvas |
| Push | web-push (VAPID) + Service Worker |

Tailwind v4 usa `@theme` em `src/index.css` — não tem `tailwind.config.js`. Classes customizadas `shadow-card`, `shadow-card-hover`, `.status-*` e `.pb-safe` definidas lá via `@layer utilities`.

`.pb-safe` = `padding-bottom: env(safe-area-inset-bottom, 0px)` — necessário pois Tailwind v4 não gera essa classe automaticamente. Usada na bottom nav mobile.

---

## Estrutura de pastas

```
/api/                        Vercel serverless functions (ESM, "type":"module")
  criar-dupla.js             Admin cria dupla + 2 usuários direto (status: ativo)
  solicitar-cadastro.js      Público — cria dupla + usuários com status: pendente
  aprovar-dupla.js           Admin aprova dupla pendente; ativa usuários + cria configuracoes
  editar-dupla.js            Admin edita nome/emails/senhas de uma dupla existente
  send-push.js               Dispara push notification ao confirmar consulta

/src/
  App.jsx                    Roteamento + camadas de proteção de auth
  main.jsx                   Entry point; registra Service Worker

  context/
    AuthContext.jsx           Session Supabase; expõe session, signIn, signOut, recoveryMode
    AppDataContext.jsx        Todo o estado da dupla + todas as mutations

  pages/
    Login.jsx                Login + "Esqueci senha" + link para /cadastro
    Cadastro.jsx             Cadastro público — dupla solicita acesso (aguarda aprovação)
    RedefinirSenha.jsx       Redefine senha via link de e-mail (evento PASSWORD_RECOVERY)
    Home.jsx                 Dashboard: consultas hoje/pendentes/semana + atalhos
    Dashboard.jsx            Agenda semanal (desktop) / diária (mobile) + popup edição
    Pacientes.jsx            Lista com busca por nome ou telefone
    NovoPaciente.jsx         Cadastro: nome, telefone, idade, alertas
    Prontuario.jsx           Ficha: alertas, anamnese, plano, histórico de consultas
    Agendamento.jsx          Novo agendamento + HorarioPicker modal + seletor de clínica
    Confirmar.jsx            Página pública /confirmar/:token (sem auth)
    Perfil.jsx               Perfis dos dois estudantes (período, foto)
    Admin.jsx                Aprovação de pendentes + criar/editar/excluir duplas

  components/
    Sidebar.jsx              Nav desktop + modais Exportar e Configurações (conta dentro de Config.)
    MobileNav.jsx            Header sticky + bottom nav (4 itens) + modais Exportar e Configurações
    ExportarSection.jsx      Seletor tipo (Agenda/Ficha/Prontuário) + formato (CSV/PDF/PNG)
    StatusBadge.jsx          Badge de status reutilizável

  lib/
    supabase.js              createClient (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
    supabaseNoSession.js     Resíduo — não usado; pode deletar
    exportar.js              Funções CSV, PDF e PNG + helpers de sanitização

  hooks/
    usePushNotifications.js  Subscribe/unsubscribe; salva endpoint no Supabase

/public/
  sw.js                      Service Worker para push notifications
  logo-*.svg                 Logos horizontal e stacked
  manifest.json              PWA manifest
```

---

## Layout raiz (App.jsx)

Container externo: `flex h-screen max-w-[100vw] overflow-x-hidden` — o `max-w-[100vw]` + `overflow-x-hidden` previnem overflow horizontal que causava "zoom out" automático no Android/iOS e sumia a bottom nav. O `html` também tem `overflow-x: hidden` no CSS (seguro para `position:fixed` diferente de colocar no `body`).

Filho flex: `flex flex-col flex-1 min-h-0 min-w-0` — o `min-w-0` impede expansão além do espaço disponível.

---

## Arquitetura de roteamento (App.jsx)

Camadas concêntricas:

1. **`/confirmar/:token`** e **`/cadastro`** — rotas públicas, fora de qualquer proteção
2. **`AppInner`** — verifica `session` + estado do usuário:
   - sem session → `<Login />`
   - `recoveryMode === true` → `<RedefinirSenha />`
   - session sem `user_metadata.duo_id` → tela "Conta sem dupla configurada"
   - `user_metadata.status === 'pendente'` → tela "Aguardando aprovação"
   - ok → renderiza `AppContent`
3. **`AppContent`** — wraps `AppDataProvider` com `duoId`; renderiza rotas protegidas
   - Admin detectado por `session.user.email === VITE_ADMIN_EMAIL`
   - Rota `/admin` só renderiza se `isAdmin`

Rotas protegidas: `/` (Home), `/agenda` (Dashboard), `/pacientes`, `/pacientes/novo`, `/pacientes/:id` (Prontuário), `/agendamento`, `/perfil`, `/admin`

---

## Multi-tenancy

Cada dupla tem `duo_id` (UUID). Salvo em `user_metadata.duo_id` de cada usuário Supabase. **Toda query client-side filtra por `.eq('duo_id', duoId)`** — jamais omitir.

`AppDataProvider` recebe `duoId` de `App.jsx`. RLS no Supabase valida independente via JWT.

---

## Tabelas Supabase

| Tabela | Colunas chave |
|---|---|
| `duplas` | `id`, `nome`, `status` (ativo\|pendente), `user_a_id`, `user_b_id`, `nome_a`, `nome_b`, `email_a`, `email_b` |
| `pacientes` | `duo_id`, `nome`, `telefone`, `idade`, `alertas` (text), `queixa_principal`, `historico_medico`, `medicamentos` |
| `consultas` | `duo_id`, `paciente_id`, `data` (yyyy-MM-dd), `horario`, `horario_fim`, `dupla` ("Estudante A"\|"B"), `status`, `clinica`, `descricao`, `dente`, `procedimento`, `proxima_sessao`, `confirmation_token` |
| `plano_tratamento` | `duo_id`, `paciente_id`, `dente`, `procedimento`, `observacoes`, `status` |
| `configuracoes` | `duo_id` (PK), `estudante_a`, `estudante_b`, `nome_clinica`, `turma`, `horarios_ativos[]`, `dias_ativos[]`, `clinicas_ativas[]` |
| `dias_bloqueados` | `duo_id`, `data` (yyyy-MM-dd), `motivo` |
| `push_subscriptions` | `duo_id`, `endpoint`, `p256dh`, `auth` |
| `perfis` | `duo_id`, `user_id` (unique), `cpf`, `rg`, `periodo` (int), `foto_url` |

**Storage:** bucket `avatars` (público) — fotos em `{duo_id}/{user_id}.ext`. RLS: INSERT/UPDATE apenas para `auth.uid() IS NOT NULL`.

`mapConsulta()` em AppDataContext converte `paciente_id` → `pacienteId` ao carregar. Usar `c.pacienteId` no frontend, `paciente_id` no banco.

---

## AppDataContext — estado e mutations completos

**Estados:**
- `pacientes[]`, `consultas[]`, `plano[]`
- `nomes`: `{estudanteA, estudanteB}`
- `configuracoes`: `{nomeClinica, turma, horariosAtivos[], diasAtivos[], clinicasAtivas[]}`
- `perfis[]` — perfis dos dois estudantes da dupla
- `diasBloqueados[]`, `feriadosNacionais[]` (fetch `brasilapi.com.br`)
- `loading: bool`

**Mutations disponíveis:**
```
addPaciente / deletePaciente / updatePaciente / updatePacienteAlertas / updateAnamnese
addConsulta / deleteConsulta / updateConsulta / updateConsultaStatus / updateConsultaDescricao / updateConsultaFicha
updateNomes / updateConfiguracoes
upsertPerfil
addPlanoItem / updatePlanoStatus / deletePlanoItem
bloquearDia / desbloquearDia
```

**`updateConfiguracoes`** recebe `{ estudanteA, estudanteB, nomeClinica, turma, horariosAtivos, diasAtivos, clinicasAtivas }` — inclui `clinicas_ativas` no upsert.

**`upsertPerfil`** recebe `{ user_id, cpf, rg, periodo, foto_url }` — faz upsert com `onConflict: 'user_id'`; atualiza `perfis[]` no estado local.

**`addConsulta`** inclui o campo `clinica` no insert.

**Realtime:**
- Supabase channel escuta `postgres_changes` `UPDATE` em `consultas` filtrado por `duo_id`
- Atualiza estado local ao receber evento
- Subscription cancelada no `useEffect` cleanup (sem leak)

**Slots fixos (ALL_SLOTS):**
```js
['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','16:20','17:20','18:20']
```
⚠️ Definido **duas vezes**: em `AppDataContext.jsx` e em `Dashboard.jsx` — não é uma constante compartilhada.

`getSlotsInRange(inicio, fim)` retorna todos os slots entre início e fim (inclusive).

---

## Fluxos implementados

### Login / sessão / recuperação
- Supabase email+senha
- "Esqueci minha senha": `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/' })` — envia link por e-mail
- Ao clicar no link, Supabase emite evento `PASSWORD_RECOVERY` → `AuthContext` seta `recoveryMode = true` → `AppInner` exibe `<RedefinirSenha />`
- `RedefinirSenha`: `supabase.auth.updateUser({ password })` → chama `setRecoveryMode(false)` após sucesso

### Cadastro público de dupla
1. Dupla preenche `/cadastro` (nome da dupla, nome/email/senha de A e B)
2. `POST /api/solicitar-cadastro` — cria `duplas` com `status: 'pendente'` + 2 usuários auth com `user_metadata: { duo_id, status: 'pendente' }`
3. Admin vê solicitação em `Admin.jsx` na seção "Solicitações Pendentes"
4. Admin clica Aprovar → `POST /api/aprovar-dupla` → seta `status: 'ativo'` na dupla e nos dois usuários; cria `configuracoes` inicial com nomes dos estudantes
5. Dupla pode fazer login normalmente

**Usuário pendente:** `session.user.user_metadata.status === 'pendente'` → tela "Aguardando aprovação" com botão de recarregar. Compatível com duplas antigas (sem campo `status` → tratado como ativo).

### Criar dupla direta (Admin)
1. `POST /api/criar-dupla` com Bearer JWT do admin
2. Insere linha em `duplas` com `status: 'ativo'`, `email_a`, `email_b`
3. `supabase.auth.admin.createUser` para A e B (`email_confirm: true`)
4. Salva `user_a_id`, `user_b_id` na dupla
5. Rollback se B falhar: deleta usuário A + linha `duplas`

### Editar dupla (Admin)
`POST /api/editar-dupla` — atualiza `duplas.nome`, `email_a`, `email_b`; chama `updateUserById` para email e/ou senha (apenas se fornecidos).
Para duplas antigas sem `user_a_id`/`user_b_id`: lazy-init busca todos os usuários e filtra por `duo_id` nos metadados, depois persiste os IDs encontrados.

### Excluir dupla (Admin)
Client-side em `Admin.jsx`: deleta em cascata (nesta ordem) consultas, plano_tratamento, pacientes, dias_bloqueados, push_subscriptions, perfis, configuracoes; depois deleta a linha `duplas`.
⚠️ Os usuários Auth (`auth.users`) **não são deletados** — continuam existindo mas ficam sem dupla vinculada. Admin delete não avisa se há consultas futuras.

### Minha Conta (dentro das Configurações)
A seção "Conta" fica dentro do modal de Configurações (Sidebar e MobileNav), com duas abas:
- **Senha**: `supabase.auth.updateUser({ password })` — usuário já autenticado, não pede senha atual
- **E-mail**: `supabase.auth.updateUser({ email })` — Supabase envia confirmação para o novo e-mail
- Exibe o email do usuário logado no topo da seção

### Perfis dos estudantes (`/perfil`)
- `Perfil.jsx` carrega `perfis[]` do contexto + consulta `duplas` para determinar qual estudante é A ou B (`dupla.user_a_id === session.user.id`)
- Exibe dois cards: próprio (editável) e parceiro (leitura)
- Campos editáveis: período (1–10) e foto (CPF e RG removidos por segurança)
- Upload de foto: `supabase.storage.from('avatars').upload(path, file, { upsert: true })` → salva URL pública em `perfis.foto_url`
- Path da foto: `{duo_id}/{user_id}.{ext}`
- **Botão "Painel Administrativo"** (ícone ShieldCheck, maroon) visível apenas quando `session.user.email === VITE_ADMIN_EMAIL` — navega para `/admin`

### Clínicas por atendimento
- `configuracoes.clinicasAtivas[]` — lista ativada via toggles nas Configurações
- 12 opções predefinidas: Clínica Integrada, Periodontia, Dentística, Endodontia, Pediatria, Prótese Total, Prótese Parcial Removível, Cirurgia, Ortodontia, Saúde Coletiva, Urgência, Radiologia
- Campo `clinica` visível no `Agendamento.jsx` apenas quando `clinicasAtivas.length > 0`
- Badge vinho (`bg-[#800000]/10 text-[#800000]`) exibido no popup do Dashboard

### Agendamento
Valida nesta ordem:
1. Campos obrigatórios (paciente, data, horário, dupla)
2. Dia bloqueado manualmente (`diasBloqueados`)
3. Feriado (`feriadosNacionais`)
4. Dia inativo (`configuracoes.diasAtivos`)

⚠️ **NÃO valida conflito de horário** — dois agendamentos podem ser criados no mesmo slot.

Datas sempre `yyyy-MM-dd` (sem timezone). `getDay()` retorna 0=Dom → mapeado para 7; `diasAtivos` usa 1–6.

### HorarioPicker
- 1º toque: define início; 2º toque mesmo turno: define fim; turno diferente: reinicia
- Slots filtrados por `configuracoes.horariosAtivos`

### Confirmação do paciente
`/confirmar/:token` — rota pública. Ao confirmar: `POST /api/send-push` com `consulta_id`.
`send-push.js`: busca consulta, valida `status === "Confirmado"`, busca subscriptions, `Promise.allSettled`.

### Dashboard — popup de edição
Clínica exibida como badge. WhatsApp normaliza tel (remove `55` se presente, remove não-dígitos). `isContinuacao`: slot cujo horário ≠ `c.horario` — oculta badge de status.

### Modal de bloqueio de dia
4 estados: feriado → bloqueado → dia inativo → livre. Feriados não desbloqueáveis.

### Configurações (Sidebar/MobileNav modal)
- Nomes dos estudantes, nome da clínica, turma
- Toggle horários ativos (min 1 dos 11 slots)
- Toggle dias ativos (min 1, Seg–Sáb)
- Toggle clínicas ativas (sem mínimo)
- UPSERT em `configuracoes` com `ON CONFLICT duo_id`

### Exportação
CSV, PDF e PNG para Agenda (semana), Ficha (1 consulta) e Prontuário (paciente completo).
- CSV: BOM UTF-8; `esc()` anti-injection; `downloadBlob` appenda ao DOM para iOS
- PDF: `window.open` + HTML + `window.print()` após 400ms
- PNG: `html2canvas` offscreen (`position:fixed; left:-9999px`), `scale:2`, `useCORS:true`

### Push notifications
`usePushNotifications(duoId)`: solicita permissão, upsert em `push_subscriptions` (conflict: `endpoint`).
Service Worker em `/public/sw.js`. VAPID keys via env.

### Realtime
Canal Supabase escuta `UPDATE` em `consultas` filtrado por `duo_id`. Cleanup ao desmontar.

---

## Variáveis de ambiente

| Var | Onde | Uso |
|---|---|---|
| `VITE_SUPABASE_URL` | Preview + Production | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Preview + Production | Chave pública |
| `VITE_ADMIN_EMAIL` | Preview + Production | Email do admin |
| `VITE_VAPID_PUBLIC_KEY` | Preview + Production | Push no cliente |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | API serverless (nunca expor no cliente) |
| `VAPID_SUBJECT` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Production | Push no servidor |
| `APP_URL` | Production | CORS nas funções `/api` |

---

## Identidade visual

```
Primária (brand): #800000 (maroon)  hover: #9a0000  dark: #660000
Surface:  #F9F9F9 (página)  #FFFFFF (card)
Borda:    #DADADA
Texto:    #1A1A1A (primary)  #666666 (secondary)
Erro:     #C94C4C  bg: #FDECEA
Sucesso:  #2D6A4F  bg: #D8F3DC
Alerta:   #7A5800  bg: #FFF3CD
Realizado: #4B5563  bg: #F3F4F6
```

Font stack: `Manrope, Inter, sans-serif`
`min-height: 48px` em inputs, `44px` em botões (touch targets).

Status CSS: `.status-confirmado`, `.status-pendente`, `.status-cancelado`, `.status-realizado` — `index.css` via `@layer utilities`.

---

## Padrões de código

**Supabase queries:**
- Sempre `.eq('duo_id', duoId)` em client-side
- `PostgrestFilterBuilder` NÃO tem `.catch()` — usar `try { await query } catch {}`
- Funções `/api` usam `SUPABASE_SERVICE_ROLE_KEY` e verificam JWT antes de operar

**Nomenclatura:**
- `dupla` no banco = `"Estudante A"` ou `"Estudante B"` (string literal)
- Nomes reais: `nomes.estudanteA` / `nomes.estudanteB` (vêm de `configuracoes`)
- Loading states: `salvando` (forms), `baixando` (export), `deletando`, `aprovando`
- Alias `pacienteId` no frontend ↔ `paciente_id` no banco (via `mapConsulta`)

**Estilo:**
- Tailwind v4 puro — sem `@apply` em componentes, classes inline no JSX
- Modais: `fixed inset-0 bg-black/40 z-50`; desktop centered, mobile bottom-sheet

**Segurança em exports:**
- `htmlEsc()` antes de qualquer dado do usuário em string HTML
- `fileSafe()` antes de usar como nome de arquivo (max 80 chars)
- `esc()` antes de célula CSV

---

## Problemas conhecidos / pendências

- `ALL_SLOTS` duplicado em `AppDataContext.jsx` e `Dashboard.jsx` — extrair para constante compartilhada
- `getDataBloqueio()` duplicado em `Dashboard.jsx` e `Agendamento.jsx` — extrair para `lib/`
- `supabaseNoSession.js` não é importado em nenhum arquivo ativo — pode deletar
- **Sem validação de conflito de horário** — dois agendamentos no mesmo slot/dupla são possíveis
- Feriados de `brasilapi.com.br`: se API fora do ar, `feriadosNacionais` fica vazio silenciosamente
- Push notifications: falha silenciosa se browser não suporta
- Sem testes automatizados — validação 100% manual
- Export PNG demora 2–3s (html2canvas blocking na thread principal)
- Sem logout automático por inatividade
- Exportações (CSV/PDF/PNG) não incluem o campo `clinica` ainda
- Excluir dupla não deleta os usuários Auth (`auth.users`) — só remove da tabela `duplas` e dados associados
- Dupla "Kat e Geovane": `email_a` ainda está null — admin precisa editar e preencher o email do estudante A
- Ainda existem duplas duplicadas vazias de "Julia e Raquel" e "Batista e Martins" que precisam ser excluídas pelo admin

---

## Estado da Sessão — 2026-05-23 (atualizado)

### Concluído
- **Prontuário — edição inline do plano de tratamento**: adicionado `updatePlanoItem` no AppDataContext; cada item do plano agora tem botão de lápis que abre formulário inline para editar dente/procedimento/observações
- **Prontuário — ficha clínica melhorada**: visualização dos dados preenchidos em blocos organizados; CTAs mais claros ("Preencher ficha" quando vazia); botão de edição com borda em vez de link minúsculo
- **Prontuário — acordeão na ficha clínica**: com mais de 3 consultas, as antigas ficam recolhidas por padrão; cabeçalho clicável abre/fecha; resumo do procedimento visível mesmo recolhido; botão "Ver todas / Recolher antigas"
- **Prontuário — exclusão de consulta**: botão de lixeira em cada entrada da ficha clínica com confirmação antes de deletar
- **Admin — exclusão via API serverless** (`/api/excluir-dupla.js`): deleção client-side era bloqueada silenciosamente pelo RLS; agora passa pela API com service role key
- **Admin — contagens por dupla** (`/api/contagens-duplas.js`): badges "X pac · Y cons" em cada dupla no painel; verde = tem dados, cinza = vazia; usa service role key para contornar RLS
- **Admin — alertas de conta com problema**: destaque laranja para duplas com `email_a` ou `email_b` null mas user_id existente

### Decidido
- Contagens de pacientes/consultas no admin **devem** usar API serverless — RLS impede o admin de ver dados de outras duplas com o JWT normal
- Deleção de duplas **deve** usar API serverless pelo mesmo motivo

### Pendente / Próximos passos
- Admin excluir as 3 "Batista e Martins" vazias (IDs: `9a8bd091`, `b95b8803`, `c689f206`) — a que tem 9 pacientes/6 consultas é a `8f6b220d`
- Admin excluir uma das duas "Julia e Raquel" (ambas vazias)
- Admin editar "Kat e Geovane" e preencher o email do estudante A (email_b = boltzinho74@gmail.com já está ok)

---

## Estado da Sessão — 2026-05-23 (sessão 2)

### Concluído
- **Remoção do fluxo de aprovação**: `api/solicitar-cadastro.js` agora cria duplas com `status: 'ativo'` e cria `configuracoes` iniciais imediatamente; removida tela de "Aguardando aprovação" do `App.jsx`; seção de solicitações pendentes removida do `Admin.jsx`; mensagem de sucesso no `Cadastro.jsx` atualizada
- **Agendar clicando em slot vazio**: no mobile e no desktop, clicar em um horário livre na Agenda navega para `/agendamento` com data e horário pré-preenchidos via `location.state`
- **Tema de cor personalizável por integrante**: `ThemeContext.jsx` criado — armazena cores no localStorage por `duo_id`, aplica `--duo-accent` como CSS variable quando filtro de estudante individual está ativo; seção "Cores dos Integrantes" adicionada nas Configurações (Sidebar e MobileNav); nav ativo usa `var(--duo-accent)` via inline style
- **Aba de Estatísticas**: `src/pages/Estatisticas.jsx` criado com recharts (instalado v3.8.1); filtros por integrante e período; gráficos: pizza (por status), barra empilhada (por mês), linha (evolução), comparativo A vs B, e ranking de procedimentos; botão "Ver Estatísticas" adicionado no Perfil
- **Sugestões nas Configurações**: seção "Sugestões" adicionada em Sidebar e MobileNav; texto salvo no localStorage com data/hora; lista as 5 últimas enviadas
- **Remoção do nome da faculdade**: `index.html` (title + og:title) e `manifest.json` atualizados de "Agenda Duo | Univassouras" para "Agenda Duo"; instrução fornecida para limpar cache do WhatsApp via Facebook Sharing Debugger

### Decidido
- Fluxo de aprovação foi removido por completo — qualquer dupla que se cadastre entra imediatamente com acesso ativo
- Cores ficam no `localStorage` (não no Supabase) — simples e sem necessidade de nova coluna no banco
- `ThemeContext` posicionado dentro de `AppDataProvider` e fora de `AuthProvider` — acessa `duoId` via prop

### Pendente / Próximos passos
- Limpar cache do preview do WhatsApp via Facebook Sharing Debugger para o link `https://agenda-duo.vercel.app/`
- Admin excluir as 3 "Batista e Martins" vazias — pendência da sessão anterior
- Avaliar se a Estatística de "Procedimentos" tem dados suficientes (depende do campo `procedimento` preenchido nas fichas)

---

## Modelo de IA em uso

Este projeto está configurado para usar **DeepSeek V4 Pro** via OpenRouter em vez da API oficial da Anthropic.

- Ativar DeepSeek: `/deepseek-on`
- Desativar (voltar ao Claude): `/deepseek-off`
- Configuração em: `.claude/settings.local.json`
