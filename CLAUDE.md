# CLAUDE.md — Agenda Duo

## O que é este projeto

Agenda Duo é um sistema de gestão de agenda odontológica para **duplas de estudantes** em clínica universitária. Cada dupla (dois estudantes) compartilha uma conta para agendar pacientes, registrar consultas, manter prontuários e exportar relatórios.

- **Público:** estudantes de odontologia em disciplinas clínicas
- **Admin:** `eliasafdiasmello@gmail.com` — único usuário que pode criar novas duplas
- **Status:** produção ativa no Vercel (branch `main` → deploy automático)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 6 |
| Estilo | Tailwind CSS v4 (CSS-first, sem `tailwind.config.js`) |
| Roteamento | react-router-dom v7 |
| Banco/Auth | Supabase (PostgreSQL + RLS + Realtime + Auth) |
| Deploy | Vercel (funções serverless em `/api/`) |
| Ícones | lucide-react |
| Datas | date-fns v4 + ptBR locale |
| Export PNG | html2canvas |
| Push | web-push (VAPID) + Service Worker |

Tailwind v4 usa `@theme` em `src/index.css` — não tem `tailwind.config.js`. Classes customizadas `shadow-card`, `shadow-card-hover` e `.status-*` definidas lá via `@layer utilities`.

---

## Estrutura de pastas

```
/api/                        Vercel serverless functions (ESM, "type":"module")
  criar-dupla.js             Cria dupla + 2 usuários via Supabase admin API
  send-push.js               Dispara push notification ao confirmar consulta

/src/
  App.jsx                    Roteamento + 3 camadas de proteção de auth
  main.jsx                   Entry point; registra Service Worker

  context/
    AuthContext.jsx           Session Supabase; expõe session, signIn, signOut
    AppDataContext.jsx        Todo o estado da dupla + todas as mutations

  pages/
    Login.jsx                Tela de login (sem cadastro público)
    Home.jsx                 Dashboard: consultas hoje/pendentes/semana + atalhos
    Dashboard.jsx            Agenda semanal (desktop) / diária (mobile) + popup edição + ModalBloqueio
    Pacientes.jsx            Lista com busca por nome ou telefone
    NovoPaciente.jsx         Cadastro: nome, telefone, idade, alertas
    Prontuario.jsx           Ficha: perfil, alertas, anamnese, plano, histórico de consultas
    Agendamento.jsx          Novo agendamento + HorarioPicker modal
    Confirmar.jsx            Página pública /confirmar/:token (sem auth)
    Admin.jsx                Criar/excluir duplas (só VITE_ADMIN_EMAIL)

  components/
    Sidebar.jsx              Nav desktop + modais Exportar e Configurações
    MobileNav.jsx            Header sticky + bottom nav + mesmos dois modais
    ExportarSection.jsx      Seletor tipo (Agenda/Ficha/Prontuário) + formato (CSV/PDF/PNG)
    StatusBadge.jsx          Badge de status reutilizável

  lib/
    supabase.js              createClient (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY)
    supabaseNoSession.js     Cliente sem persistir sessão — NÃO usado atualmente (resíduo)
    exportar.js              Funções CSV, PDF e PNG + helpers de sanitização

  hooks/
    usePushNotifications.js  Subscribe/unsubscribe; salva endpoint no Supabase

/public/
  sw.js                      Service Worker para push notifications
  logo-*.svg                 Logos horizontal e stacked
  manifest.json              PWA manifest
```

---

## Arquitetura de roteamento (App.jsx)

3 camadas concêntricas:

1. **`/confirmar/:token`** — rota pública, fora de qualquer proteção
2. **`AppInner`** — verifica `session` + `duo_id`:
   - sem session → `<Login />`
   - session sem `user_metadata.duo_id` → tela de erro "Conta sem dupla configurada"
   - ok → renderiza `AppContent`
3. **`AppContent`** — wraps `AppDataProvider` com `duoId`; renderiza rotas protegidas
   - Admin detectado por `session.user.email === VITE_ADMIN_EMAIL`
   - Rota `/admin` só renderiza se `isAdmin`; senão redireciona para `/`

Rotas protegidas: `/` (Home), `/agenda` (Dashboard), `/pacientes`, `/pacientes/novo`, `/pacientes/:id` (Prontuário), `/agendamento`, `/admin`

---

## Multi-tenancy

Cada dupla tem `duo_id` (UUID). Salvo em `user_metadata.duo_id` de cada usuário Supabase. **Toda query client-side filtra por `.eq('duo_id', duoId)`** — jamais omitir.

`AppDataProvider` recebe `duoId` de `App.jsx`. RLS no Supabase valida independente via JWT.

---

## Tabelas Supabase

| Tabela | Colunas chave |
|---|---|
| `duplas` | `id`, `nome` |
| `pacientes` | `duo_id`, `nome`, `telefone`, `idade`, `alertas` (text), `queixa_principal`, `historico_medico`, `medicamentos` |
| `consultas` | `duo_id`, `paciente_id`, `data` (yyyy-MM-dd), `horario`, `horario_fim`, `dupla` ("Estudante A"\|"B"), `status`, `descricao`, `dente`, `procedimento`, `proxima_sessao`, `confirmation_token` |
| `plano_tratamento` | `duo_id`, `paciente_id`, `dente`, `procedimento`, `observacoes`, `status` |
| `configuracoes` | `duo_id` (PK), `estudante_a`, `estudante_b`, `nome_clinica`, `turma`, `horarios_ativos` (array), `dias_ativos` (array int 1–6) |
| `dias_bloqueados` | `duo_id`, `data` (yyyy-MM-dd), `motivo` |
| `push_subscriptions` | `duo_id`, `endpoint`, `p256dh`, `auth` |

`mapConsulta()` em AppDataContext converte `paciente_id` → `pacienteId` ao carregar. Usar `c.pacienteId` no frontend, `paciente_id` no banco.

---

## AppDataContext — estado e mutations completos

**Estados:**
- `pacientes[]`, `consultas[]`, `plano[]`
- `nomes`: `{estudanteA, estudanteB}`
- `configuracoes`: `{nomeClinica, turma, horariosAtivos[], diasAtivos[]}`
- `diasBloqueados[]`, `feriadosNacionais[]` (fetch `brasilapi.com.br`)
- `loading: bool`

**Mutations disponíveis:**
```
addPaciente / deletePaciente / updatePaciente / updatePacienteAlertas / updateAnamnese
addConsulta / deleteConsulta / updateConsulta / updateConsultaStatus / updateConsultaDescricao / updateConsultaFicha
updateNomes / updateConfiguracoes
addPlanoItem / updatePlanoStatus / deletePlanoItem
bloquearDia / desbloquearDia
```

**Realtime:**
- Supabase channel escuta `postgres_changes` `UPDATE` em `consultas` filtrado por `duo_id`
- Atualiza estado local ao receber evento
- Subscription cancelada no `useEffect` cleanup (sem leak)

**Slots fixos (ALL_SLOTS):**
```js
['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','16:20','17:20','18:20']
```
⚠️ Definido **duas vezes**: em `AppDataContext.jsx` e em `Dashboard.jsx` — não é uma constante compartilhada.

`getSlotsInRange(inicio, fim)` retorna todos os slots entre início e fim (inclusive). Usado para verificar conflitos e renderizar blocos multi-slot.

---

## Fluxos implementados

### Login / sessão
Supabase email+senha; sem cadastro público. Usuário sem `duo_id` vê erro. Admin por comparação de email com `VITE_ADMIN_EMAIL`.

### Criar dupla (Admin)
1. `POST /api/criar-dupla` com Bearer JWT do admin
2. Insere linha em `duplas`
3. `supabase.auth.admin.createUser` para estudante A (com `duo_id` em metadata, `email_confirm: true`)
4. Mesmo para estudante B
5. Rollback se B falhar: deleta usuário A + linha `duplas`

Excluir dupla em `Admin.jsx`: deleta em cascata consultas, pacientes, plano_tratamento, dias_bloqueados, push_subscriptions, configuracoes, e os 2 usuários.

### Agendamento
Valida nesta ordem:
1. Campos obrigatórios (paciente, data, horário, dupla)
2. Dia bloqueado manualmente (`diasBloqueados`)
3. Feriado (`feriadosNacionais`)
4. Dia inativo (`configuracoes.diasAtivos`)

⚠️ **NÃO valida conflito de horário** — dois agendamentos podem ser criados no mesmo slot da mesma dupla sem aviso.

Dias da semana: `getDay()` retorna 0=Dom → mapeado para 7; `diasAtivos` usa 1–6 (Seg–Sáb).
Datas sempre `yyyy-MM-dd` (sem timezone).

### HorarioPicker
- 1º toque: define horário início
- 2º toque no mesmo turno: define horário fim
- Toque em turno diferente: reinicia seleção no novo turno
- Slots filtrados por `configuracoes.horariosAtivos`
- Exibe label `"HH:MM – HH:MM"` ou só `"HH:MM"` se sem fim

### Confirmação do paciente
`/confirmar/:token` — rota pública, usa Supabase anon.
Estados: Pendente/Realizado → exibe opções Confirmar/Cancelar. Confirmado/Cancelado → tela final.
Ao confirmar: `POST /api/send-push` com `consulta_id`.

`send-push.js`:
- Busca consulta, valida `status === "Confirmado"`
- Busca `push_subscriptions` da dupla
- `Promise.allSettled` (falha individual não interrompe outras)
- Payload: `{title: "Consulta confirmada! ✅", body: "{nome} confirmou para dd/MM às HH:MM", url: "/"}`

### Dashboard — popup de edição de consulta
Ao clicar em consulta na grade: popup com dados do paciente, select de status, editar data/horário/dupla, link WhatsApp (normaliza tel: remove `55` se presente, remove não-dígitos), link "Lembrete" (`/confirmar/:token`), link Prontuário, botão Apagar.

`isContinuacao`: slot cujo horário ≠ `c.horario` (continuação de bloco multi-slot) — oculta badge de status para não duplicar.

### Modal de bloqueio de dia
4 estados em precedência: feriado → bloqueado manualmente → dia inativo → livre.
`isDiaIndisponivel = isDiaBloqueado || isFeriado || isDiaInativo`
Feriados: nome exibido mas não desbloqueável pelo usuário.

### Configurações (Sidebar/MobileNav modal)
- Nomes dos estudantes, nome da clínica, turma
- Toggle horários ativos (min 1 dos 11 slots)
- Toggle dias ativos (min 1, Seg–Sáb)
- UPSERT em `configuracoes` com `ON CONFLICT duo_id`

### Exportação
| Tipo | CSV | PDF | PNG |
|---|---|---|---|
| Agenda (semana) | ✓ | ✓ | ✓ |
| Ficha (1 consulta) | ✓ | ✓ | ✓ |
| Prontuário (paciente completo) | ✓ | ✓ | ✓ |

- CSV: BOM UTF-8; `esc()` anti-injection (`=+-@` prefixados com `'`); `downloadBlob` appenda ao DOM para iOS
- PDF: `window.open` + HTML + `window.print()` após 400ms
- PNG: `html2canvas` em div `position:fixed; left:-9999px` (offscreen), `scale:2`, `useCORS:true`

### Push notifications
`usePushNotifications(duoId)`: solicita permissão, obtém subscription, upsert em `push_subscriptions` (conflict: `endpoint`). Retorna `{subscribed, loading, supported, subscribe, unsubscribe}`.
Service Worker em `/public/sw.js`. VAPID keys via env.

### Realtime
Canal Supabase escuta `UPDATE` em `consultas` filtrado por `duo_id`. Atualiza estado local. Cleanup ao desmontar.

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

Status CSS: classes `.status-confirmado`, `.status-pendente`, `.status-cancelado`, `.status-realizado` definidas em `index.css` via `@layer utilities`.

---

## Padrões de código

**Supabase queries:**
- Sempre `.eq('duo_id', duoId)` em client-side
- `PostgrestFilterBuilder` NÃO tem `.catch()` — usar `try { await query } catch {}`
- Funções `/api` usam `SUPABASE_SERVICE_ROLE_KEY` e verificam JWT antes de operar

**Nomenclatura:**
- `dupla` no banco = `"Estudante A"` ou `"Estudante B"` (string literal)
- Nomes reais: `nomes.estudanteA` / `nomes.estudanteB` (vêm de `configuracoes`)
- Loading states: `salvando` (forms), `baixando` (export), `deletando`
- Alias `pacienteId` no frontend ↔ `paciente_id` no banco (via `mapConsulta`)

**Estilo:**
- Tailwind v4 puro — sem `@apply` em componentes, classes inline no JSX
- Cores via variáveis CSS `--color-brand` etc., não hardcode
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
- Feriados de `brasilapi.com.br`: se API fora do ar, `feriadosNacionais` fica vazio e feriados ficam desbloqueados silenciosamente
- **Sem recuperação de senha** — não existe flow de reset (usuário precisa contatar admin)
- Admin delete não avisa se há consultas futuras — deleta tudo sem confirmação de impacto
- Push notifications: falha silenciosa se browser não suporta (sem feedback ao usuário)
- Sem testes automatizados — validação 100% manual
- `sharp` em `devDependencies` só serve para gerar ícones PWA via `scripts/generate-icons.mjs` (manual)
- Export PNG demora 2–3s (html2canvas blocking na thread principal)
- Sem logout automático por inatividade
