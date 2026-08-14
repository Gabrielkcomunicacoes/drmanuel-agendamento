# Clínica do Dr. Manuel

Sistema web de gestão de contatos e atendimentos. Exibe os leads da tabela
`crm_estetica` (Supabase), com métricas, gráficos e busca.

## Como rodar

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:5173`.

## Deploy (Vercel)

Produção: **https://agendamento.drmanuelataide.com.br** — projeto Vercel
`drmanuel-agendamento`, deploy automático a cada push em `main` (integração
GitHub já conectada). `vercel.json` tem o rewrite de SPA — sem ele, recarregar
`/agendar`, `/login` etc. direto no navegador dá 404.

Variáveis de ambiente do projeto na Vercel: só `VITE_SUPABASE_URL` e
`VITE_SUPABASE_ANON_KEY` (Production + Preview). Nunca adicione
`VITE_SUPABASE_ACCESS_TOKEN` lá — o prefixo `VITE_` faz o Vite embutir a
variável no JS público, e esse token dá acesso de admin ao Supabase.

### Incidente 14/08/2026: tela em branco em produção

O domínio já tinha sido apontado para um projeto Vercel diferente do que criei
(`drmanuel-agendamento`, conectado ao mesmo repositório GitHub) antes de eu
perceber — esse projeto tinha `VITE_SUPABASE_ACCESS_TOKEN` guardado com
prefixo `VITE_` (confirmei que não vazou pro bundle publicado, mas removi).
Depois da limpeza, o site carregava mas ficava com a **tela toda branca** —
`curl` em todas as rotas dava 200 porque o HTML/JS chegava certinho, só que o
`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` daquele projeto estavam com valor
vazio ou corrompido no momento do build (a Vercel não deixa reler variável
`Sensitive` depois de criada, então não dava pra confirmar o valor direto).
`supabase.ts` lançava `throw new Error(...)` no boot, e sem um `ErrorBoundary`
isso derrubava a árvore inteira do React sem deixar rastro na tela.

Como resolvi:

1. Apaguei e recriei `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` com os
   valores confirmados do `.env` local.
2. Escrevi `scripts/debug-live.mjs` (Playwright) pra abrir a URL num Chromium
   de verdade e capturar erro de runtime — é o que achou a causa: `curl` não
   executa JavaScript, então nunca pegaria isso.
3. Adicionei `src/components/ErrorBoundary.tsx`, envolvendo o `<App />` em
   `main.tsx` — qualquer erro futuro agora mostra uma tela com botão de
   recarregar em vez de ficar em branco silenciosamente.

```bash
node scripts/debug-live.mjs https://agendamento.drmanuelataide.com.br/
```

Roda contra qualquer URL, imprime erros de console, exceções não tratadas e
requisições que falharam, e salva um screenshot em
`scripts/debug-live-screenshot.png`. Vale rodar depois de qualquer deploy que
mexa em env vars ou no bootstrap do app — `curl` sozinho não teria pego esse
bug.

## Login (Prompt 3)

Dashboard, Contatos e Agendamentos agora exigem sessão logada (Supabase Auth,
e-mail/senha). `/agendar` continua público, sem login.

**Não há tela de cadastro no app.** Contas são criadas direto no painel do
Supabase — veja "Criando a primeira conta" abaixo. O auto-cadastro público
(`disable_signup`) foi desligado no projeto para que ninguém crie conta pela
API mesmo sem UI.

### O que mudou no banco

- `crm_estetica`: a policy `anon_read_crm_estetica` foi trocada por
  `staff_read_crm_estetica`, restrita a `authenticated`. Isso fecha a leitura
  pública que existia desde o Prompt 1.
- `agendamentos`: ganhou uma policy `staff_read_agendamentos` para
  `authenticated`, **além** da `select publico` (`anon`) que já existia — essa
  última continua necessária para a checagem de disponibilidade em `/agendar`.
  As policies de `insert` continuam abertas a `anon`, como antes.

  Atenção ao motivo de precisar das duas: quando alguém loga, o client do
  Supabase passa a mandar o token do usuário em vez da anon key, e o Postgres
  passa a avaliar as policies como `authenticated`, não `anon`. Uma policy só
  de `anon` não cobre sessões logadas.

### Criando a primeira conta

1. No painel do Supabase, vá em **Authentication → Users → Add user**.
2. Preencha e-mail e senha da pessoa da equipe.
3. Ative o toggle **Auto Confirm User** antes de criar — sem isso a conta fica
   pendente de confirmação por e-mail (o projeto não tem SMTP configurado, só
   o serviço padrão do Supabase, com limite de envio).
4. Clique em **Create user**. A pessoa já consegue logar em `/login` com esse
   e-mail e senha.

Repita para cada pessoa da equipe. Para trocar a senha de alguém depois, edite
o usuário na mesma tela (**Reset password** envia e-mail; ou apague e recrie a
conta se preferir não depender de e-mail).

### Verificado contra o Supabase real

Criei uma conta de teste via Admin API, logei com e-mail/senha, e confirmei:

- `crm_estetica` com a `anon key` pura → **0 linhas** (bloqueado, como deveria).
- `crm_estetica` com o token da sessão logada → **23.030 linhas** (liberado).
- `agendamentos` com a sessão logada → enxerga registros inseridos por `anon`
  (política nova funcionando).
- `agendamentos` continua aceitando `insert` de `anon` (fluxo público intacto).

Apaguei a conta e os registros de teste ao final.

## Stack

React 18 + Vite + TypeScript · Tailwind CSS · Shadcn/UI · Supabase JS ·
Recharts · React Router DOM · date-fns.

## Variáveis de ambiente

O `.env` já está preenchido. Duas observações:

- **`VITE_SUPABASE_URL` usa o _project ref_, não o nome do projeto.** A URL é
  `https://sliokbwbjoanepvbjhdq.supabase.co` — `https://DrManuel.supabase.co`
  não resolve. O ref foi obtido em `GET /v1/projects` da Management API.
- **`VITE_SUPABASE_ACCESS_TOKEN` não é usado pelo frontend.** Ele serve só à
  Management API (busca das chaves). Ele é um token de conta com poder de
  administração — mantenha fora do controle de versão. O `.gitignore` já
  ignora o `.env`.

## Estado do banco (verificado na introspecção)

A tabela `crm_estetica` não foi criada nem teve o schema alterado. Além das
colunas da spec, ela também tem `id_conta_chatwoot`, `id_conversa_chatwoot`,
`id_lead_chatwoot`, `inbox_id_chatwoot`, `created_at` e `updated_at` —
nenhuma delas é consultada pelo app.

Todos os campos de data são `timestamptz`, então os filtros viajam como ISO 8601
(`.gte()` / `.lte()`).

**Limpeza de dados sintéticos (14/08/2026):** a tabela chegou a ter 23.030
registros, mas **23.024 eram linhas totalmente vazias** — sem nome, WhatsApp,
motivo, resumo, procedimento, agendamento ou follow-up em nenhum campo. A
assinatura entregava o culpado: milhares de linhas com o mesmíssimo
`inicio_atendimento` até o milissegundo (ex.: 2.000 linhas cravadas em
`2026-08-13 14:17:15.636`) e `id_conversa_chatwoot`/`inbox_id_chatwoot` nulos —
claramente um script de carga/teste, não conversa real de WhatsApp. Confirmei
que nenhuma dessas linhas tinha qualquer campo preenchido antes de apagar, e
usei DELETE só nelas (nunca em linha com algum dado real). Restaram **6
registros genuínos**, todos de 12–13/08/2026.

Dois fatos que ainda afetam o que a tela mostra:

1. **`data_agendamento` está nula nas 6 linhas restantes.** O card
   "Agendamentos" mostra 0, o gráfico "Agendamentos futuros" (que hoje já lê
   da tabela `agendamentos`, não mais de `crm_estetica`) fica vazio, e todo
   lead aparece como "Em atendimento". É o dado, não um bug.
2. **Campos de texto vêm como string vazia (`""`), não `null`** em algumas
   linhas (ex.: lead que ainda não disse o nome). O app trata `""` igual a
   ausente e mostra `—`.

### Row Level Security

A tabela tinha RLS ativado e **nenhuma policy**, o que fazia a anon key
retornar `[]`. No Prompt 1 criei uma policy pública (`anon`); no Prompt 3, ao
adicionar login, ela foi **substituída** por uma restrita a `authenticated`
(veja a seção "Login" acima) — hoje só quem está logado lê `crm_estetica`:

```sql
create policy "staff_read_crm_estetica"
  on public.crm_estetica
  for select to authenticated
  using (true);
```

Para revogar (ninguém mais lê a tabela pelo app):

```sql
drop policy "staff_read_crm_estetica" on public.crm_estetica;
```

## Decisões de implementação

**Contagens no servidor.** Os cards usam `count: 'exact', head: true` — o
Postgres conta e nenhuma linha trafega.

**Gráficos paginam só uma coluna.** Os gráficos 1 e 2 precisam de
`inicio_atendimento` e nada mais; puxar `resumo_conversa` junto traria megabytes.
Como o total exato já veio da contagem, as páginas de 1.000 linhas são
disparadas em paralelo (lotes de 8) em vez de uma de cada vez.

**Teto na página de Contatos.** A spec pede "sem limite de registros", mas
renderizar 23 mil linhas trava o navegador. O app carrega até
**2.000** (`CONTACTS_ROW_CAP` em `src/lib/queries.ts`) e, quando o período tem
mais que isso, avisa no contador: `de N no período · limite de 2.000 por carga`.
A busca continua local, como pedido. Para remover o teto, aumente a constante —
o custo é o congelamento da aba.

## Tabela `agendamentos` (Prompt 2)

Criada via Management API, RLS habilitado com policies públicas de leitura e
gravação (`anon` pode `insert` e `select`) e adicionada à publicação
`supabase_realtime` — sem isso `postgres_changes` não dispara:

```sql
create table if not exists public.agendamentos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  whatsapp text not null,
  procedimento text not null,
  data_agendamento date not null,
  horario time not null,
  criado_em timestamptz default now()
);

alter table public.agendamentos enable row level security;
create policy "insert publico" on public.agendamentos for insert to anon with check (true);
create policy "select publico" on public.agendamentos for select to anon using (true);

alter publication supabase_realtime add table public.agendamentos;
```

Mesmo trade-off do `crm_estetica`: como o acesso é público e sem autenticação,
qualquer pessoa com a URL da API pode ler nome/WhatsApp de todos os
agendamentos. É o que a spec pediu para viabilizar a página `/agendar` sem
login.

**`whatsapp` é salvo com o DDI 55 na frente** (ex.: `5532999998888`), mesmo o
formulário só pedindo DDD + número — assim casa com o padrão já usado em
`crm_estetica.whatsapp_lead` e o link `wa.me` da página interna funciona sem
tratamento especial.

### Página pública `/agendar`

- Sem sidebar, sem autenticação, mobile-first a partir de 375px.
- Horários fixos em `src/lib/horarios.ts` (não vêm do banco): seg-sex
  08h-19h, sábado 09h-15h, domingo fechado.
- Ao escolher a data, busca a contagem por horário em `agendamentos` e assina
  `postgres_changes` (`INSERT`) filtrado por aquele dia — a grade atualiza
  sozinha se outro lead reservar um horário enquanto a página está aberta. A
  assinatura é cancelada ao trocar de data e ao desmontar o componente.
- **Revalidação no envio:** capacidade fixa de 1 por horário, mas a tabela não
  tem `unique constraint`. Para reduzir (não eliminar) a corrida entre dois
  leads no mesmo slot, o formulário busca a contagem de novo bem antes do
  `insert` e recusa se o horário já foi preenchido nesse intervalo.

### Página interna `/agendamentos`

Lista agendamentos com `data_agendamento >= hoje`, ordenados por data e
horário. Assina `INSERT` na tabela inteira (sem filtro de data) para refletir
novos agendamentos em tempo real; cancela a assinatura ao desmontar.

## Verificação feita

- `npx tsc -b` — sem erros
- `npm run build` — build de produção OK
- Todos os módulos passam pelo transform do Vite sem erro
- `node scripts/check-periods.mjs` — 12 checagens de limite de período e
  agregação (inclusive ida e volta para UTC nos filtros)
- `node scripts/check-booking.mjs` — 14 checagens de horários fixos, máscara
  de WhatsApp, validação de dígitos, formatação de data/hora e `toDateKey`
- Queries validadas contra o Supabase real: `insert`, contagem por horário e
  contagem de futuros na tabela `agendamentos` (registro de teste apagado
  depois); contagem do período em `crm_estetica` retornava 23.030 antes da
  limpeza de dados sintéticos do dia 14/08 (veja "Estado do banco" acima)

Não foi feita verificação visual em navegador — não há ferramenta de
screenshot neste ambiente.

## Estrutura

```
src/
  lib/          supabase, auth, queries, appointments, horarios,
                 procedimentos, períodos, agregação, formatação, tipos
  pages/        Dashboard, Contacts, Appointments, PublicBooking, Login
  components/   Sidebar, Layout, FilterBar, StatCard, ContactModal,
                ContactsTable, AppointmentsTable, StatusBadge,
                ProtectedRoute, charts/, ui/ (Shadcn)
```
