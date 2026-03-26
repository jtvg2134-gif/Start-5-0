create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'prova_status'
  ) then
    create type public.prova_status as enum (
      'draft',
      'processing',
      'review',
      'published',
      'archived'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'questao_review_status'
  ) then
    create type public.questao_review_status as enum (
      'pending',
      'reviewed',
      'approved',
      'rejected'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'dificuldade_nivel'
  ) then
    create type public.dificuldade_nivel as enum (
      'easy',
      'medium',
      'hard'
    );
  end if;

  if not exists (
    select 1
    from pg_type
    where typname = 'tentativa_resultado'
  ) then
    create type public.tentativa_resultado as enum (
      'correct',
      'wrong',
      'skipped'
    );
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.sync_prova_lifecycle_timestamps()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('review', 'published', 'archived') and new.processado_em is null then
    new.processado_em = now();
  end if;

  if new.status = 'published' and new.publicado_em is null then
    new.publicado_em = now();
  end if;

  return new;
end;
$$;

create or replace function public.sync_questao_publication_timestamp()
returns trigger
language plpgsql
as $$
begin
  if new.published and new.publicado_em is null then
    new.publicado_em = now();
  end if;

  if not new.published then
    new.publicado_em = null;
  end if;

  return new;
end;
$$;

create or replace function public.set_question_attempt_number()
returns trigger
language plpgsql
as $$
begin
  if new.respondida_em is null then
    new.respondida_em = now();
  end if;

  if new.tentativa_numero is null or new.tentativa_numero <= 0 then
    select coalesce(max(t.tentativa_numero), 0) + 1
      into new.tentativa_numero
    from public.user_questao_tentativas t
    where t.user_id = new.user_id
      and t.questao_id = new.questao_id;
  end if;

  return new;
end;
$$;

create table if not exists public.vestibulares (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  sigla text not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vestibulares_nome_not_blank check (length(trim(nome)) > 0),
  constraint vestibulares_sigla_not_blank check (length(trim(sigla)) > 0)
);

create unique index if not exists vestibulares_nome_unique_idx
  on public.vestibulares (lower(nome));

create unique index if not exists vestibulares_sigla_unique_idx
  on public.vestibulares (lower(sigla));

create table if not exists public.materias (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint materias_nome_not_blank check (length(trim(nome)) > 0),
  constraint materias_slug_not_blank check (length(trim(slug)) > 0),
  constraint materias_slug_lowercase check (slug = lower(slug))
);

create unique index if not exists materias_nome_unique_idx
  on public.materias (lower(nome));

create unique index if not exists materias_slug_unique_idx
  on public.materias (slug);

create table if not exists public.temas (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias(id) on delete restrict,
  nome text not null,
  slug text not null,
  descricao text,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint temas_nome_not_blank check (length(trim(nome)) > 0),
  constraint temas_slug_not_blank check (length(trim(slug)) > 0),
  constraint temas_slug_lowercase check (slug = lower(slug)),
  constraint temas_id_materia_unique unique (id, materia_id)
);

create unique index if not exists temas_materia_nome_unique_idx
  on public.temas (materia_id, lower(nome));

create unique index if not exists temas_materia_slug_unique_idx
  on public.temas (materia_id, slug);

create table if not exists public.provas (
  id uuid primary key default gen_random_uuid(),
  vestibular_id uuid not null references public.vestibulares(id) on delete restrict,
  materia_principal_id uuid references public.materias(id) on delete set null,
  ano integer not null,
  fase text not null default '',
  versao text not null default '',
  dia integer not null default 0,
  caderno text not null default '',
  titulo text not null,
  pdf_storage_path text not null,
  pdf_url_publica text,
  gabarito_storage_path text not null default '',
  gabarito_url_publica text,
  status public.prova_status not null default 'draft',
  observacoes_adm text,
  processado_em timestamptz,
  publicado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  constraint provas_ano_range check (ano between 1900 and 2100),
  constraint provas_dia_range check (dia between 0 and 9),
  constraint provas_titulo_not_blank check (length(trim(titulo)) > 0),
  constraint provas_pdf_storage_not_blank check (length(trim(pdf_storage_path)) > 0),
  constraint provas_unique_source unique (vestibular_id, ano, fase, versao, dia, caderno)
);

create unique index if not exists provas_pdf_storage_path_unique_idx
  on public.provas (pdf_storage_path);

create index if not exists provas_vestibular_ano_idx
  on public.provas (vestibular_id, ano desc);

create index if not exists provas_catalogo_idx
  on public.provas (vestibular_id, ano desc, dia asc, caderno asc);

create index if not exists provas_status_idx
  on public.provas (status, publicado_em desc nulls last);

create index if not exists provas_created_by_idx
  on public.provas (created_by, created_at desc);

create table if not exists public.questoes (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references public.provas(id) on delete cascade,
  numero_questao integer not null,
  enunciado text not null,
  imagem_url text,
  materia_id uuid not null references public.materias(id) on delete restrict,
  tema_id uuid,
  dificuldade_manual public.dificuldade_nivel,
  dificuldade_calculada public.dificuldade_nivel,
  dificuldade_final public.dificuldade_nivel generated always as (
    coalesce(dificuldade_calculada, dificuldade_manual)
  ) stored,
  resposta_correta_letra text not null,
  explicacao_resolucao text,
  review_status public.questao_review_status not null default 'pending',
  origem_pdf_pagina integer,
  origem_pdf_trecho text,
  observacoes_adm text,
  ativo boolean not null default true,
  published boolean not null default false,
  publicado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  constraint questoes_numero_positive check (numero_questao > 0),
  constraint questoes_enunciado_not_blank check (length(trim(enunciado)) > 0),
  constraint questoes_resposta_correta_valid check (
    resposta_correta_letra = upper(resposta_correta_letra)
    and resposta_correta_letra ~ '^[A-F]$'
  ),
  constraint questoes_pdf_page_positive check (origem_pdf_pagina is null or origem_pdf_pagina > 0),
  constraint questoes_publish_requires_approval check (published = false or review_status = 'approved'),
  constraint questoes_unique_numero_por_prova unique (prova_id, numero_questao),
  constraint questoes_tema_da_mesma_materia_fk
    foreign key (tema_id, materia_id)
    references public.temas(id, materia_id)
    on delete restrict
);

create index if not exists questoes_prova_numero_idx
  on public.questoes (prova_id, numero_questao);

create index if not exists questoes_materia_idx
  on public.questoes (materia_id);

create index if not exists questoes_tema_idx
  on public.questoes (tema_id);

create index if not exists questoes_review_status_idx
  on public.questoes (review_status, updated_at desc);

create index if not exists questoes_publicadas_ativas_idx
  on public.questoes (published, ativo, prova_id);

create index if not exists questoes_student_filter_idx
  on public.questoes (materia_id, tema_id, dificuldade_final, prova_id)
  where published = true and ativo = true;

create index if not exists questoes_dificuldade_final_idx
  on public.questoes (dificuldade_final);

create table if not exists public.alternativas (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null references public.questoes(id) on delete cascade,
  letra text not null,
  texto text not null,
  ordem smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alternativas_letra_valid check (
    letra = upper(letra)
    and letra ~ '^[A-F]$'
  ),
  constraint alternativas_ordem_positive check (ordem > 0),
  constraint alternativas_texto_not_blank check (length(trim(texto)) > 0),
  constraint alternativas_unique_letra_por_questao unique (questao_id, letra),
  constraint alternativas_unique_ordem_por_questao unique (questao_id, ordem)
);

create index if not exists alternativas_questao_idx
  on public.alternativas (questao_id, ordem);

create table if not exists public.questao_estatisticas (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null unique references public.questoes(id) on delete cascade,
  total_tentativas integer not null default 0,
  total_respostas integer not null default 0,
  total_acertos integer not null default 0,
  total_erros integer not null default 0,
  taxa_acerto numeric(8, 5) not null default 0,
  taxa_erro numeric(8, 5) not null default 0,
  dificuldade_recalculada public.dificuldade_nivel,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questao_estatisticas_total_tentativas_non_negative check (total_tentativas >= 0),
  constraint questao_estatisticas_total_respostas_non_negative check (total_respostas >= 0),
  constraint questao_estatisticas_total_acertos_non_negative check (total_acertos >= 0),
  constraint questao_estatisticas_total_erros_non_negative check (total_erros >= 0),
  constraint questao_estatisticas_taxa_acerto_range check (taxa_acerto between 0 and 1),
  constraint questao_estatisticas_taxa_erro_range check (taxa_erro between 0 and 1),
  constraint questao_estatisticas_respostas_consistentes check (total_respostas = total_acertos + total_erros)
);

create index if not exists questao_estatisticas_dificuldade_idx
  on public.questao_estatisticas (dificuldade_recalculada, taxa_acerto);

create table if not exists public.user_questao_tentativas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  questao_id uuid not null references public.questoes(id) on delete cascade,
  tentativa_numero integer not null default 1,
  alternativa_marcada_letra text,
  resultado public.tentativa_resultado not null,
  tempo_gasto_segundos integer,
  respondida_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tentativas_numero_positive check (tentativa_numero > 0),
  constraint tentativas_letra_valid check (
    alternativa_marcada_letra is null
    or (
      alternativa_marcada_letra = upper(alternativa_marcada_letra)
      and alternativa_marcada_letra ~ '^[A-F]$'
    )
  ),
  constraint tentativas_tempo_non_negative check (
    tempo_gasto_segundos is null
    or tempo_gasto_segundos >= 0
  ),
  constraint tentativas_resposta_consistente check (
    (resultado = 'skipped' and alternativa_marcada_letra is null)
    or (resultado in ('correct', 'wrong') and alternativa_marcada_letra is not null)
  ),
  constraint tentativas_unique_por_numero unique (user_id, questao_id, tentativa_numero)
);

create index if not exists user_questao_tentativas_user_idx
  on public.user_questao_tentativas (user_id, respondida_em desc);

create index if not exists user_questao_tentativas_questao_idx
  on public.user_questao_tentativas (questao_id, respondida_em desc);

create index if not exists user_questao_tentativas_user_questao_idx
  on public.user_questao_tentativas (user_id, questao_id, respondida_em desc);

create table if not exists public.user_questao_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  questao_id uuid not null references public.questoes(id) on delete cascade,
  primeira_resposta_em timestamptz,
  ultima_resposta_em timestamptz,
  total_tentativas integer not null default 0,
  total_acertos integer not null default 0,
  total_erros integer not null default 0,
  acertou_ultima boolean,
  favorita boolean not null default false,
  revisar_depois boolean not null default false,
  mastered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_questao_status_unique unique (user_id, questao_id),
  constraint user_questao_status_total_tentativas_non_negative check (total_tentativas >= 0),
  constraint user_questao_status_total_acertos_non_negative check (total_acertos >= 0),
  constraint user_questao_status_total_erros_non_negative check (total_erros >= 0),
  constraint user_questao_status_totals_consistentes check (
    total_acertos + total_erros <= total_tentativas
  )
);

create index if not exists user_questao_status_user_idx
  on public.user_questao_status (user_id, ultima_resposta_em desc nulls last);

create index if not exists user_questao_status_user_flags_idx
  on public.user_questao_status (user_id, favorita, revisar_depois, mastered);

create index if not exists user_questao_status_user_questao_idx
  on public.user_questao_status (user_id, questao_id);

create or replace function public.ensure_question_stats_row()
returns trigger
language plpgsql
as $$
begin
  insert into public.questao_estatisticas (questao_id)
  values (new.id)
  on conflict (questao_id) do nothing;

  return new;
end;
$$;

create or replace function public.recalculate_question_stats(p_questao_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.questao_estatisticas (
    questao_id,
    total_tentativas,
    total_respostas,
    total_acertos,
    total_erros,
    taxa_acerto,
    taxa_erro,
    dificuldade_recalculada,
    updated_at
  )
  select
    p_questao_id,
    count(*)::integer as total_tentativas,
    count(*) filter (where t.resultado <> 'skipped')::integer as total_respostas,
    count(*) filter (where t.resultado = 'correct')::integer as total_acertos,
    count(*) filter (where t.resultado = 'wrong')::integer as total_erros,
    case
      when count(*) filter (where t.resultado <> 'skipped') = 0 then 0
      else round(
        (count(*) filter (where t.resultado = 'correct'))::numeric
        / (count(*) filter (where t.resultado <> 'skipped'))::numeric,
        5
      )
    end as taxa_acerto,
    case
      when count(*) filter (where t.resultado <> 'skipped') = 0 then 0
      else round(
        (count(*) filter (where t.resultado = 'wrong'))::numeric
        / (count(*) filter (where t.resultado <> 'skipped'))::numeric,
        5
      )
    end as taxa_erro,
    case
      when count(*) filter (where t.resultado <> 'skipped') = 0 then null
      when (
        (count(*) filter (where t.resultado = 'correct'))::numeric
        / (count(*) filter (where t.resultado <> 'skipped'))::numeric
      ) >= 0.75 then 'easy'::public.dificuldade_nivel
      when (
        (count(*) filter (where t.resultado = 'correct'))::numeric
        / (count(*) filter (where t.resultado <> 'skipped'))::numeric
      ) >= 0.45 then 'medium'::public.dificuldade_nivel
      else 'hard'::public.dificuldade_nivel
    end as dificuldade_recalculada,
    now()
  from public.user_questao_tentativas t
  where t.questao_id = p_questao_id
  on conflict (questao_id) do update
    set total_tentativas = excluded.total_tentativas,
        total_respostas = excluded.total_respostas,
        total_acertos = excluded.total_acertos,
        total_erros = excluded.total_erros,
        taxa_acerto = excluded.taxa_acerto,
        taxa_erro = excluded.taxa_erro,
        dificuldade_recalculada = excluded.dificuldade_recalculada,
        updated_at = now();
end;
$$;

create or replace function public.recalculate_user_question_status(
  p_user_id uuid,
  p_questao_id uuid
)
returns void
language plpgsql
as $$
declare
  v_total_tentativas integer;
  v_total_acertos integer;
  v_total_erros integer;
  v_primeira_resposta_em timestamptz;
  v_ultima_resposta_em timestamptz;
  v_acertou_ultima boolean;
begin
  select
    count(*)::integer,
    count(*) filter (where t.resultado = 'correct')::integer,
    count(*) filter (where t.resultado = 'wrong')::integer,
    min(t.respondida_em),
    max(t.respondida_em)
  into
    v_total_tentativas,
    v_total_acertos,
    v_total_erros,
    v_primeira_resposta_em,
    v_ultima_resposta_em
  from public.user_questao_tentativas t
  where t.user_id = p_user_id
    and t.questao_id = p_questao_id;

  if coalesce(v_total_tentativas, 0) = 0 then
    delete from public.user_questao_status
    where user_id = p_user_id
      and questao_id = p_questao_id;
    return;
  end if;

  select
    case
      when t.resultado = 'correct' then true
      when t.resultado = 'wrong' then false
      else null
    end
  into v_acertou_ultima
  from public.user_questao_tentativas t
  where t.user_id = p_user_id
    and t.questao_id = p_questao_id
  order by t.respondida_em desc, t.created_at desc, t.tentativa_numero desc
  limit 1;

  insert into public.user_questao_status (
    user_id,
    questao_id,
    primeira_resposta_em,
    ultima_resposta_em,
    total_tentativas,
    total_acertos,
    total_erros,
    acertou_ultima
  )
  values (
    p_user_id,
    p_questao_id,
    v_primeira_resposta_em,
    v_ultima_resposta_em,
    v_total_tentativas,
    v_total_acertos,
    v_total_erros,
    v_acertou_ultima
  )
  on conflict (user_id, questao_id) do update
    set primeira_resposta_em = excluded.primeira_resposta_em,
        ultima_resposta_em = excluded.ultima_resposta_em,
        total_tentativas = excluded.total_tentativas,
        total_acertos = excluded.total_acertos,
        total_erros = excluded.total_erros,
        acertou_ultima = excluded.acertou_ultima,
        updated_at = now();
end;
$$;

create or replace function public.sync_question_attempt_rollups()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.recalculate_question_stats(old.questao_id);
    perform public.recalculate_user_question_status(old.user_id, old.questao_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    if tg_op = 'INSERT'
      or old.questao_id is distinct from new.questao_id
      or old.user_id is distinct from new.user_id
      or old.resultado is distinct from new.resultado
      or old.alternativa_marcada_letra is distinct from new.alternativa_marcada_letra
      or old.respondida_em is distinct from new.respondida_em then
      perform public.recalculate_question_stats(new.questao_id);
      perform public.recalculate_user_question_status(new.user_id, new.questao_id);
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists vestibulares_set_updated_at on public.vestibulares;
create trigger vestibulares_set_updated_at
before update on public.vestibulares
for each row
execute function public.set_updated_at();

drop trigger if exists materias_set_updated_at on public.materias;
create trigger materias_set_updated_at
before update on public.materias
for each row
execute function public.set_updated_at();

drop trigger if exists temas_set_updated_at on public.temas;
create trigger temas_set_updated_at
before update on public.temas
for each row
execute function public.set_updated_at();

drop trigger if exists provas_set_updated_at on public.provas;
create trigger provas_set_updated_at
before update on public.provas
for each row
execute function public.set_updated_at();

drop trigger if exists provas_sync_lifecycle_timestamps on public.provas;
create trigger provas_sync_lifecycle_timestamps
before insert or update on public.provas
for each row
execute function public.sync_prova_lifecycle_timestamps();

drop trigger if exists questoes_set_updated_at on public.questoes;
create trigger questoes_set_updated_at
before update on public.questoes
for each row
execute function public.set_updated_at();

drop trigger if exists questoes_sync_publication_timestamp on public.questoes;
create trigger questoes_sync_publication_timestamp
before insert or update on public.questoes
for each row
execute function public.sync_questao_publication_timestamp();

drop trigger if exists questoes_ensure_stats_row on public.questoes;
create trigger questoes_ensure_stats_row
after insert on public.questoes
for each row
execute function public.ensure_question_stats_row();

drop trigger if exists alternativas_set_updated_at on public.alternativas;
create trigger alternativas_set_updated_at
before update on public.alternativas
for each row
execute function public.set_updated_at();

drop trigger if exists questao_estatisticas_set_updated_at on public.questao_estatisticas;
create trigger questao_estatisticas_set_updated_at
before update on public.questao_estatisticas
for each row
execute function public.set_updated_at();

drop trigger if exists user_questao_tentativas_set_updated_at on public.user_questao_tentativas;
create trigger user_questao_tentativas_set_updated_at
before update on public.user_questao_tentativas
for each row
execute function public.set_updated_at();

drop trigger if exists user_questao_tentativas_set_number on public.user_questao_tentativas;
create trigger user_questao_tentativas_set_number
before insert on public.user_questao_tentativas
for each row
execute function public.set_question_attempt_number();

drop trigger if exists user_questao_tentativas_sync_rollups on public.user_questao_tentativas;
create trigger user_questao_tentativas_sync_rollups
after insert or update or delete on public.user_questao_tentativas
for each row
execute function public.sync_question_attempt_rollups();

drop trigger if exists user_questao_status_set_updated_at on public.user_questao_status;
create trigger user_questao_status_set_updated_at
before update on public.user_questao_status
for each row
execute function public.set_updated_at();

alter table public.user_questao_tentativas enable row level security;
alter table public.user_questao_status enable row level security;
