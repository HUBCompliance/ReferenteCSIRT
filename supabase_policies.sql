-- Abilita RLS per tutte le tabelle core
alter table public.csirtcompanies enable row level security;
alter table public.csirtincidents enable row level security;
alter table public.csirtnotifications enable row level security;
alter table public.csirtnetwork_configuration enable row level security;
alter table public.profiles enable row level security;

-- Helper per recuperare il ruolo dall'access token Supabase
create or replace view public.current_app_role as
select coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', 'anonymous') as role,
       coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'sub', '')::uuid       as user_id,
       coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::uuid, null) as company_id;

-- Aziende: solo admin e csirt possono scrivere, tutti i ruoli autenticati vedono la propria company
create policy "csirtcompanies_select" on public.csirtcompanies
for select
using (
  (select role from current_app_role) in ('admin', 'csirt')
  or (id = (select company_id from current_app_role))
);

create policy "csirtcompanies_upsert" on public.csirtcompanies
for all
using ((select role from current_app_role) in ('admin', 'csirt'))
with check ((select role from current_app_role) in ('admin', 'csirt'));

-- Profili: solo admin può leggere/creare
create policy "profiles_select_admin" on public.profiles
for select
using ((select role from current_app_role) = 'admin');

create policy "profiles_insert_admin" on public.profiles
for insert
with check ((select role from current_app_role) = 'admin');

-- Incidenti: aziende limitate alla propria company_id, csirt/admin vedono tutto
create policy "incidents_select" on public.csirtincidents
for select
using (
  (select role from current_app_role) in ('admin', 'csirt')
  or company_id = (select company_id from current_app_role)
);

create policy "incidents_insert" on public.csirtincidents
for insert
with check (
  (select role from current_app_role) in ('admin', 'csirt')
  or company_id = (select company_id from current_app_role)
);

-- Configurazioni di rete
create policy "config_select" on public.csirtnetwork_configuration
for select
using (
  (select role from current_app_role) in ('admin', 'csirt')
  or company_id = (select company_id from current_app_role)
);

create policy "config_upsert" on public.csirtnetwork_configuration
for all
using ((select role from current_app_role) in ('admin', 'csirt') or company_id = (select company_id from current_app_role))
with check ((select role from current_app_role) in ('admin', 'csirt') or company_id = (select company_id from current_app_role));

-- Notifiche
create policy "notifications_select" on public.csirtnotifications
for select
using (
  (select role from current_app_role) in ('admin', 'csirt')
  or company_id = (select company_id from current_app_role)
);

create policy "notifications_insert" on public.csirtnotifications
for insert
with check (
  (select role from current_app_role) in ('admin', 'csirt')
  or company_id = (select company_id from current_app_role)
);
