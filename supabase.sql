-- =====================================================
-- Belle / manicure-app — Setup do Supabase
-- Cole este script no SQL Editor do seu projeto Supabase
-- e execute (Run). Ele é idempotente (pode rodar mais de uma vez).
-- =====================================================

-- 1. Tabela "registros": espelho de todos os dados do app
--    (clientes, agendamentos, contas, centros de custo, serviços,
--     pacotes e pacotes vendidos), um registro por entidade+id.
create table if not exists public.registros (
  id         text not null,
  user_id    uuid not null,
  entidade   text not null,
  dados      jsonb not null default '{}'::jsonb,
  updated_at bigint not null default 0,
  primary key (user_id, entidade, id)
);

-- Índice por usuário para agilizar o fetch de todos os registros.
create index if not exists idx_registros_user
  on public.registros (user_id);

-- 2. Segurança em nível de linha (RLS):
--    cada usuário só lê/insere/edita/exclui os próprios dados.
alter table public.registros enable row level security;

drop policy if exists "own select" on public.registros;
create policy "own select" on public.registros
  for select using (auth.uid() = user_id);

drop policy if exists "own insert" on public.registros;
create policy "own insert" on public.registros
  for insert with check (auth.uid() = user_id);

drop policy if exists "own update" on public.registros;
create policy "own update" on public.registros
  for update using (auth.uid() = user_id);

drop policy if exists "own delete" on public.registros;
create policy "own delete" on public.registros
  for delete using (auth.uid() = user_id);
