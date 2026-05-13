# Agenda Duo

Sistema web de gestão de agenda odontológica para **duplas de estudantes** em clínica universitária. Cada dupla compartilha uma conta para agendar pacientes, registrar consultas, manter prontuários e exportar relatórios.

**Público-alvo:** estudantes de odontologia em disciplinas clínicas  
**Admin:** `eliasafdiasmello@gmail.com` — gerencia duplas, aprova cadastros  
**Status:** produção ativa no Vercel (branch `main` → deploy automático)

---

## URL de produção

| Recurso | URL |
|---|---|
| App | https://agenda-duo.vercel.app |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 6 |
| Estilo | Tailwind CSS v4 (CSS-first, sem `tailwind.config.js`) |
| Roteamento | react-router-dom v7 |
| Banco / Auth | Supabase (PostgreSQL + RLS + Realtime + Auth + Storage) |
| Deploy | Vercel (serverless functions em `/api/`) |
| Ícones | lucide-react |
| Datas | date-fns v4 + ptBR locale |
| Export PNG | html2canvas |
| Push | web-push (VAPID) + Service Worker |

> Tailwind v4 usa `@theme` em `src/index.css` — não existe `tailwind.config.js`. Classes customizadas (`shadow-card`, `.status-*`) definidas via `@layer utilities`.

---

## Estrutura do projeto

```
/api/
  criar-dupla.js           ← cria dupla + 2 usuários (admin direto)
  solicitar-cadastro.js    ← cadastro público, cria dupla com status pendente
  aprovar-dupla.js         ← admin aprova dupla pendente, ativa usuários
  editar-dupla.js          ← admin edita nome/emails/senhas de uma dupla
  send-push.js             ← dispara push notification ao confirmar consulta

/src/
  App.jsx                  ← roteamento + camadas de proteção de auth
  main.jsx                 ← entry point; registra Service Worker

  context/
    AuthContext.jsx        ← session, signIn, signOut, recoveryMode
    AppDataContext.jsx     ← estado da dupla + todas as mutations

  pages/
    Login.jsx              ← login + "esqueci senha" + link para cadastro
    Cadastro.jsx           ← cadastro público de dupla (aguarda aprovação)
    RedefinirSenha.jsx     ← redefine senha via link de e-mail (PASSWORD_RECOVERY)
    Home.jsx               ← dashboard: consultas hoje/pendentes/semana
    Dashboard.jsx          ← agenda semanal (desktop) / diária (mobile)
    Pacientes.jsx          ← lista com busca
    NovoPaciente.jsx       ← cadastro de paciente
    Prontuario.jsx         ← ficha: alertas, anamnese, plano, histórico
    Agendamento.jsx        ← novo agendamento + HorarioPicker + seletor clínica
    Confirmar.jsx          ← página pública /confirmar/:token
    Perfil.jsx             ← perfis dos estudantes (CPF, RG, período, foto)
    Admin.jsx              ← aprovar pendentes, criar/editar/excluir duplas

  components/
    Sidebar.jsx            ← nav desktop + modais Exportar, Configurações, Minha Conta
    MobileNav.jsx          ← header + bottom nav + mesmos modais
    ExportarSection.jsx    ← seletor tipo + formato (CSV/PDF/PNG)
    StatusBadge.jsx        ← badge de status reutilizável

  lib/
    supabase.js            ← createClient
    exportar.js            ← CSV, PDF, PNG + helpers de sanitização

  hooks/
    usePushNotifications.js ← subscribe/unsubscribe push

/public/
  sw.js                    ← Service Worker
  manifest.json            ← PWA manifest
  logo-*.svg
```

---

## Multi-tenancy

Cada dupla tem um `duo_id` (UUID) salvo em `user_metadata` no Supabase Auth. **Toda query client-side filtra por `.eq('duo_id', duoId)`**. RLS no Supabase valida independentemente via JWT.

---

## Tabelas Supabase

| Tabela | Colunas principais |
|---|---|
| `duplas` | `id`, `nome`, `status` (ativo/pendente), `user_a_id`, `user_b_id`, `nome_a`, `nome_b`, `email_a`, `email_b` |
| `pacientes` | `duo_id`, `nome`, `telefone`, `idade`, `alertas`, `queixa_principal`, `historico_medico`, `medicamentos` |
| `consultas` | `duo_id`, `paciente_id`, `data`, `horario`, `horario_fim`, `dupla`, `status`, `clinica`, `descricao`, `dente`, `procedimento`, `proxima_sessao`, `confirmation_token` |
| `plano_tratamento` | `duo_id`, `paciente_id`, `dente`, `procedimento`, `observacoes`, `status` |
| `configuracoes` | `duo_id` (PK), `estudante_a`, `estudante_b`, `nome_clinica`, `turma`, `horarios_ativos[]`, `dias_ativos[]`, `clinicas_ativas[]` |
| `dias_bloqueados` | `duo_id`, `data`, `motivo` |
| `push_subscriptions` | `duo_id`, `endpoint`, `p256dh`, `auth` |
| `perfis` | `duo_id`, `user_id` (unique), `cpf`, `rg`, `periodo`, `foto_url` |

**Storage:** bucket `avatars` (público) — fotos de perfil em `{duo_id}/{user_id}.ext`

---

## Como rodar localmente

```bash
npm install

# Criar .env.local
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAIL=eliasafdiasmello@gmail.com
VITE_VAPID_PUBLIC_KEY=

npm run dev
```

Variáveis adicionais necessárias **nas funções serverless** (configurar no Vercel):
```
SUPABASE_SERVICE_ROLE_KEY=
VAPID_SUBJECT=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
APP_URL=
```

> `SUPABASE_SERVICE_ROLE_KEY` **nunca** vai ao frontend.

---

## Deploy

Branch `main` → deploy automático no Vercel. Não há ambiente de staging.

```bash
npm run build    # build local
npm run preview  # preview local do build
```

---

## Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Login | Supabase Auth email+senha |
| Recuperação de senha | Link por e-mail → tela de redefinição automática |
| Cadastro público | `/cadastro` — dupla solicita acesso, admin aprova |
| Minha Conta | Alterar senha e e-mail (Sidebar / MobileNav) |
| Agenda | Vista semanal (desktop) e diária (mobile), edição inline |
| HorarioPicker | Seleção de início e fim em slots configuráveis |
| Confirmação pública | `/confirmar/:token` sem autenticação |
| Push notifications | Alerta ao confirmar consulta (VAPID + Service Worker) |
| Realtime | Atualização automática via Supabase Realtime |
| Prontuário | Anamnese, plano de tratamento, histórico de consultas |
| Exportação | CSV, PDF e PNG para agenda, ficha e prontuário |
| Bloqueio de dias | Manual + feriados nacionais via BrasilAPI |
| Configurações | Nomes, clínica, turma, horários, dias e clínicas ativas |
| Clínica por atendimento | Campo clínica no agendamento; exibido como badge na agenda |
| Perfis | CPF, RG, período e foto por estudante (`/perfil`) |
| Admin — aprovação | Seção de solicitações pendentes com aprovar/recusar |
| Admin — edição | Editar nome, e-mails e senhas de qualquer dupla |
| Admin — exclusão | Exclui dupla + todos os dados em cascata |

---

## Identidade visual

```
Primária (brand):  #800000 (maroon)   hover: #9a0000   dark: #660000
Surface:           #F9F9F9 (página)   #FFFFFF (card)
Borda:             #DADADA
Texto:             #1A1A1A (primary)  #666666 (secondary)
Erro:              #C94C4C  bg: #FDECEA
Sucesso:           #2D6A4F  bg: #D8F3DC
Alerta:            #7A5800  bg: #FFF3CD
Realizado:         #4B5563  bg: #F3F4F6
```

Fonte: `Manrope, Inter, sans-serif`  
Touch targets: inputs `min-height: 48px`, botões `44px`

---

## Pendências conhecidas

- [ ] Sem validação de conflito de horário — dois agendamentos no mesmo slot são possíveis
- [ ] `ALL_SLOTS` duplicado em `AppDataContext.jsx` e `Dashboard.jsx`
- [ ] Sem testes automatizados
- [ ] Push notifications sem feedback ao usuário se browser não suportar
- [ ] Admin delete sem aviso de impacto em consultas futuras
- [ ] Feriados silenciosamente ausentes se BrasilAPI estiver fora do ar
- [ ] Export PNG demora 2–3s (html2canvas blocking na thread principal)
- [ ] Sem logout automático por inatividade
