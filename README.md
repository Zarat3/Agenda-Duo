# Agenda Duo

Sistema de gestão de agenda odontológica para **duplas de estudantes** em clínica universitária.
Cada dupla compartilha uma conta para agendar pacientes, registrar consultas, manter prontuários e exportar relatórios.

## Visão geral
- Público-alvo: estudantes de odontologia em disciplinas clínicas
- Multi-tenant por `duo_id` (cada dupla enxerga somente seus dados)
- Admin único: configurado por `VITE_ADMIN_EMAIL` (cria/exclui duplas)
- Deploy: Vercel (branch `main`, deploy automático)

## Principais funcionalidades
- Login com Supabase Auth (sem cadastro público)
- Agenda diária/semanal com edição de consultas
- Cadastro de pacientes e prontuário completo
- Plano de tratamento por paciente
- Configuração de horários e dias ativos
- Bloqueio manual de dias + leitura de feriados nacionais
- Confirmação pública de consulta por token (`/confirmar/:token`)
- Exportação em CSV, PDF e PNG (agenda, ficha e prontuário)
- Push notifications para confirmação de consulta

## Stack
- React 19 + Vite 6
- Tailwind CSS v4 (CSS-first, sem `tailwind.config.js`)
- React Router DOM v7
- Supabase (PostgreSQL + RLS + Realtime + Auth)
- Vercel Serverless Functions (`/api`)
- date-fns, lucide-react, html2canvas, web-push

## Estrutura do projeto
```text
api/
  criar-dupla.js
  send-push.js
src/
  App.jsx
  main.jsx
  context/
  pages/
  components/
  lib/
  hooks/
public/
  sw.js
  manifest.json
```

## Como rodar localmente
### 1) Pré-requisitos
- Node.js 20+ (recomendado)
- Conta e projeto Supabase

### 2) Instalar dependências
```bash
npm install
```

### 3) Criar `.env.local`
Use o modelo abaixo:
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_ADMIN_EMAIL=
VITE_VAPID_PUBLIC_KEY=
```

### 4) Executar em desenvolvimento
```bash
npm run dev
```

### 5) Build e preview
```bash
npm run build
npm run preview
```

## Variáveis de ambiente
### Cliente (Vite)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`
- `VITE_VAPID_PUBLIC_KEY`

### Serverless (`/api`, Vercel)
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_SUBJECT`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `APP_URL`

> Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Multi-tenancy e segurança
- O app usa `duo_id` como fronteira de dados entre duplas.
- No frontend, queries devem sempre filtrar por `.eq('duo_id', duoId)`.
- No backend, RLS no Supabase reforça isolamento via JWT.
- Rotas públicas limitadas à confirmação de consulta por token.

## Scripts disponíveis
- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — preview local do build
- `npm run lint` — lint com ESLint

## Estado do projeto
Em produção ativa.
Pendências conhecidas (resumo):
- Falta validação de conflito de horário no agendamento
- Duplicação de constantes/helpers em alguns arquivos
- Sem fluxo de recuperação de senha
- Sem suíte de testes automatizados

## Licença
Definir.
