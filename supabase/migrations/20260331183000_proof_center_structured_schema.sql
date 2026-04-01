create extension if not exists pgcrypto;
create extension if not exists unaccent;

create schema if not exists proof_center;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tipo_questao_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.tipo_questao_enum as enum (
      'objetiva',
      'numerica',
      'expressao_simples',
      'discursiva_calculo'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'metodo_correcao_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.metodo_correcao_enum as enum (
      'automatica',
      'automatica_com_tolerancia',
      'semiassistida',
      'manual'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'status_prova_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.status_prova_enum as enum (
      'draft',
      'review',
      'active',
      'archived'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'status_questao_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.status_questao_enum as enum (
      'draft',
      'review',
      'active',
      'archived'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'origem_cadastro_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.origem_cadastro_enum as enum (
      'manual',
      'colar_texto',
      'pdf_assistido'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'origem_prova_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.origem_prova_enum as enum (
      'manual',
      'banco_questoes',
      'pdf_assistido'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'status_tentativa_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.status_tentativa_enum as enum (
      'em_andamento',
      'enviada',
      'em_correcao',
      'finalizada'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'status_correcao_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.status_correcao_enum as enum (
      'pendente',
      'corrigida_automatica',
      'baixa_confianca',
      'revisao_manual',
      'concluida'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tipo_gabarito_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.tipo_gabarito_enum as enum (
      'alternativa',
      'texto',
      'numero',
      'expressao'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tipo_arquivo_prova_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.tipo_arquivo_prova_enum as enum (
      'pdf_original',
      'pdf_gabarito',
      'imagem_apoio',
      'anexo'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'status_importacao_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.status_importacao_enum as enum (
      'pendente',
      'processando',
      'concluida',
      'falhou'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'area_prova_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.area_prova_enum as enum (
      'exatas',
      'linguagens',
      'humanas',
      'natureza',
      'mista'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'nivel_prova_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.nivel_prova_enum as enum (
      'fundamentos',
      'intermediario',
      'avancado',
      'misto'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'tipo_prova_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.tipo_prova_enum as enum (
      'simulado',
      'lista',
      'prova_antiga',
      'diagnostico',
      'revisao',
      'outro'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'dificuldade_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.dificuldade_enum as enum (
      'facil',
      'media',
      'dificil'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'review_decision_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.review_decision_enum as enum (
      'ajustada',
      'confirmada',
      'invalidada',
      'comentada'
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

create or replace function proof_center.normalize_text_answer(p_value text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(lower(unaccent(coalesce(p_value, ''))), '\s+', ' ', 'g'));
$$;

create or replace function proof_center.normalize_expression_answer(p_value text)
returns text
language sql
immutable
as $$
  select replace(replace(trim(regexp_replace(lower(unaccent(coalesce(p_value, ''))), '\s+', '', 'g')), ',', '.'), 'x', '*');
$$;

create or replace function proof_center.extract_numeric_answer(p_value text)
returns numeric
language plpgsql
immutable
as $$
declare
  v_compact text;
  v_match text;
begin
  v_compact := regexp_replace(replace(coalesce(p_value, ''), ',', '.'), '\s+', '', 'g');

  if v_compact = '' then
    return null;
  end if;

  begin
    return v_compact::numeric;
  exception
    when others then
      null;
  end;

  v_match := substring(v_compact from '[-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?');

  if v_match is null or v_match = '' then
    return null;
  end if;

  begin
    return v_match::numeric;
  exception
    when others then
      return null;
  end;
end;
$$;

create table if not exists proof_center.questoes_master (
  id uuid primary key default gen_random_uuid(),
  titulo_interno text,
  enunciado text not null,
  tipo_questao proof_center.tipo_questao_enum not null,
  area proof_center.area_prova_enum not null default 'exatas',
  assunto text,
  subassunto text,
  formula_principal text,
  unidade_resposta text,
  casas_decimais_esperadas integer,
  aceita_notacao_cientifica boolean not null default false,
  metodo_correcao proof_center.metodo_correcao_enum not null,
  tolerancia_absoluta numeric(14,6),
  tolerancia_percentual numeric(7,4),
  peso_padrao numeric(8,2) not null default 1.00,
  dificuldade_interna proof_center.dificuldade_enum,
  possui_imagem boolean not null default false,
  imagem_url text,
  observacoes_admin text,
  origem_cadastro proof_center.origem_cadastro_enum not null default 'manual',
  status proof_center.status_questao_enum not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questoes_master_enunciado_not_blank check (length(trim(enunciado)) > 0),
  constraint questoes_master_casas_decimais_check check (casas_decimais_esperadas is null or casas_decimais_esperadas >= 0),
  constraint questoes_master_tolerancia_absoluta_check check (tolerancia_absoluta is null or tolerancia_absoluta >= 0),
  constraint questoes_master_tolerancia_percentual_check check (tolerancia_percentual is null or (tolerancia_percentual >= 0 and tolerancia_percentual <= 100)),
  constraint questoes_master_peso_check check (peso_padrao > 0)
);

create table if not exists proof_center.questao_alternativas (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null references proof_center.questoes_master(id) on delete cascade,
  letra varchar(2) not null,
  texto text not null,
  ordem integer not null,
  is_correta boolean not null default false,
  created_at timestamptz not null default now(),
  constraint questao_alternativas_letra_check check (length(trim(letra)) >= 1),
  constraint questao_alternativas_ordem_check check (ordem > 0),
  constraint questao_alternativas_texto_not_blank check (length(trim(texto)) > 0),
  constraint questao_alternativas_letra_unique unique (questao_id, letra),
  constraint questao_alternativas_ordem_unique unique (questao_id, ordem)
);

create table if not exists proof_center.questao_gabaritos (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null references proof_center.questoes_master(id) on delete cascade,
  tipo_gabarito proof_center.tipo_gabarito_enum not null,
  resposta_bruta text,
  resposta_normalizada text,
  valor_numerico numeric(18,8),
  expressao_canonica text,
  tolerancia_absoluta numeric(14,6),
  tolerancia_percentual numeric(7,4),
  unidade text,
  principal boolean not null default false,
  observacao text,
  created_at timestamptz not null default now(),
  constraint questao_gabaritos_tolerancia_absoluta_check check (tolerancia_absoluta is null or tolerancia_absoluta >= 0),
  constraint questao_gabaritos_tolerancia_percentual_check check (tolerancia_percentual is null or (tolerancia_percentual >= 0 and tolerancia_percentual <= 100))
);

create table if not exists proof_center.provas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text,
  disciplina text,
  area proof_center.area_prova_enum not null default 'exatas',
  nivel proof_center.nivel_prova_enum not null default 'misto',
  ano integer,
  tipo_prova proof_center.tipo_prova_enum not null default 'outro',
  status proof_center.status_prova_enum not null default 'draft',
  origem proof_center.origem_prova_enum not null default 'manual',
  tempo_limite_min integer,
  observacoes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint provas_titulo_not_blank check (length(trim(titulo)) > 0),
  constraint provas_ano_check check (ano is null or (ano between 1900 and 2100)),
  constraint provas_tempo_limite_check check (tempo_limite_min is null or tempo_limite_min > 0)
);

create table if not exists proof_center.prova_questoes (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references proof_center.provas(id) on delete cascade,
  questao_id uuid not null references proof_center.questoes_master(id) on delete restrict,
  numero_na_prova integer not null,
  ordem integer not null,
  peso numeric(8,2) not null default 1.00,
  obrigatoria boolean not null default true,
  versao_enunciado text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint prova_questoes_numero_check check (numero_na_prova > 0),
  constraint prova_questoes_ordem_check check (ordem > 0),
  constraint prova_questoes_peso_check check (peso > 0),
  constraint prova_questoes_numero_unique unique (prova_id, numero_na_prova),
  constraint prova_questoes_ordem_unique unique (prova_id, ordem),
  constraint prova_questoes_questao_unique unique (prova_id, questao_id)
);

create table if not exists proof_center.prova_arquivos (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references proof_center.provas(id) on delete cascade,
  tipo_arquivo proof_center.tipo_arquivo_prova_enum not null,
  nome_original text not null,
  storage_path text,
  url text,
  mime_type text,
  tamanho_bytes bigint,
  checksum_sha256 text,
  metadados jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint prova_arquivos_nome_not_blank check (length(trim(nome_original)) > 0),
  constraint prova_arquivos_tamanho_check check (tamanho_bytes is null or tamanho_bytes >= 0)
);

create table if not exists proof_center.tentativas_prova (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references proof_center.provas(id) on delete cascade,
  aluno_id uuid not null references auth.users(id) on delete cascade,
  status proof_center.status_tentativa_enum not null default 'em_andamento',
  nota_parcial numeric(8,2),
  nota_final numeric(8,2),
  total_acertos integer not null default 0,
  total_erros integer not null default 0,
  iniciada_em timestamptz,
  enviada_em timestamptz,
  finalizada_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tentativas_prova_nota_parcial_check check (nota_parcial is null or nota_parcial >= 0),
  constraint tentativas_prova_nota_final_check check (nota_final is null or nota_final >= 0),
  constraint tentativas_prova_total_acertos_check check (total_acertos >= 0),
  constraint tentativas_prova_total_erros_check check (total_erros >= 0)
);

create table if not exists proof_center.respostas_aluno (
  id uuid primary key default gen_random_uuid(),
  tentativa_id uuid not null references proof_center.tentativas_prova(id) on delete cascade,
  prova_questao_id uuid not null references proof_center.prova_questoes(id) on delete cascade,
  questao_id uuid not null references proof_center.questoes_master(id) on delete restrict,
  resposta_bruta text,
  alternativa_marcada varchar(2),
  valor_numerico numeric(18,8),
  expressao_bruta text,
  resposta_normalizada text,
  status_correcao proof_center.status_correcao_enum not null default 'pendente',
  confianca_correcao numeric(5,2),
  nota_atribuida numeric(8,2),
  correta boolean,
  motivo_pendencia text,
  feedback text,
  corrigido_por uuid references auth.users(id) on delete set null,
  corrigido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint respostas_aluno_unica_questao_por_tentativa unique (tentativa_id, prova_questao_id),
  constraint respostas_aluno_confianca_check check (confianca_correcao is null or (confianca_correcao >= 0 and confianca_correcao <= 100)),
  constraint respostas_aluno_nota_check check (nota_atribuida is null or nota_atribuida >= 0)
);

create table if not exists proof_center.revisoes_correcao (
  id uuid primary key default gen_random_uuid(),
  resposta_aluno_id uuid not null references proof_center.respostas_aluno(id) on delete cascade,
  admin_id uuid references auth.users(id) on delete set null,
  decisao proof_center.review_decision_enum not null,
  nota_anterior numeric(8,2),
  nota_nova numeric(8,2),
  motivo text,
  comentario text,
  created_at timestamptz not null default now(),
  constraint revisoes_correcao_nota_anterior_check check (nota_anterior is null or nota_anterior >= 0),
  constraint revisoes_correcao_nota_nova_check check (nota_nova is null or nota_nova >= 0)
);

create table if not exists proof_center.correcoes_log (
  id uuid primary key default gen_random_uuid(),
  resposta_aluno_id uuid not null references proof_center.respostas_aluno(id) on delete cascade,
  acao text not null,
  valor_anterior_json jsonb,
  valor_novo_json jsonb,
  observacao text,
  admin_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists proof_center.importacoes_assistidas (
  id uuid primary key default gen_random_uuid(),
  arquivo_id uuid references proof_center.prova_arquivos(id) on delete set null,
  prova_id uuid references proof_center.provas(id) on delete cascade,
  status proof_center.status_importacao_enum not null default 'pendente',
  texto_extraido text,
  confianca_media numeric(5,2),
  total_questoes_detectadas integer,
  log_parser jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint importacoes_assistidas_confianca_check check (confianca_media is null or (confianca_media >= 0 and confianca_media <= 100)),
  constraint importacoes_assistidas_total_questoes_check check (total_questoes_detectadas is null or total_questoes_detectadas >= 0)
);

create unique index if not exists questao_gabaritos_principal_unique_idx
  on proof_center.questao_gabaritos (questao_id)
  where principal = true;

create unique index if not exists uq_tentativa_ativa_por_aluno_prova
  on proof_center.tentativas_prova (prova_id, aluno_id)
  where status in ('em_andamento', 'enviada', 'em_correcao');

create index if not exists idx_questoes_master_area on proof_center.questoes_master(area);
create index if not exists idx_questoes_master_assunto on proof_center.questoes_master(assunto);
create index if not exists idx_questoes_master_tipo on proof_center.questoes_master(tipo_questao);
create index if not exists idx_questoes_master_metodo on proof_center.questoes_master(metodo_correcao);
create index if not exists idx_questoes_master_status on proof_center.questoes_master(status);
create index if not exists idx_questoes_master_created_by on proof_center.questoes_master(created_by);
create index if not exists idx_questoes_master_fts
  on proof_center.questoes_master
  using gin (to_tsvector('portuguese', coalesce(titulo_interno, '') || ' ' || coalesce(enunciado, '') || ' ' || coalesce(assunto, '') || ' ' || coalesce(subassunto, '')));

create index if not exists idx_questao_alternativas_questao on proof_center.questao_alternativas(questao_id);
create index if not exists idx_questao_gabaritos_questao on proof_center.questao_gabaritos(questao_id);
create index if not exists idx_questao_gabaritos_tipo on proof_center.questao_gabaritos(tipo_gabarito);

create index if not exists idx_provas_area on proof_center.provas(area);
create index if not exists idx_provas_status on proof_center.provas(status);
create index if not exists idx_provas_ano on proof_center.provas(ano);
create index if not exists idx_provas_tipo on proof_center.provas(tipo_prova);
create index if not exists idx_provas_updated_at on proof_center.provas(updated_at desc);

create index if not exists idx_prova_questoes_prova on proof_center.prova_questoes(prova_id);
create index if not exists idx_prova_questoes_questao on proof_center.prova_questoes(questao_id);

create index if not exists idx_prova_arquivos_prova on proof_center.prova_arquivos(prova_id);
create index if not exists idx_prova_arquivos_tipo on proof_center.prova_arquivos(tipo_arquivo);

create index if not exists idx_tentativas_prova_prova on proof_center.tentativas_prova(prova_id);
create index if not exists idx_tentativas_prova_aluno on proof_center.tentativas_prova(aluno_id);
create index if not exists idx_tentativas_prova_status on proof_center.tentativas_prova(status);
create index if not exists idx_tentativas_prova_updated_at on proof_center.tentativas_prova(updated_at desc);

create index if not exists idx_respostas_aluno_tentativa on proof_center.respostas_aluno(tentativa_id);
create index if not exists idx_respostas_aluno_questao on proof_center.respostas_aluno(questao_id);
create index if not exists idx_respostas_aluno_prova_questao on proof_center.respostas_aluno(prova_questao_id);
create index if not exists idx_respostas_aluno_status on proof_center.respostas_aluno(status_correcao);
create index if not exists idx_respostas_aluno_corrigido_por on proof_center.respostas_aluno(corrigido_por);

create index if not exists idx_revisoes_correcao_resposta on proof_center.revisoes_correcao(resposta_aluno_id);
create index if not exists idx_revisoes_correcao_admin on proof_center.revisoes_correcao(admin_id);

create index if not exists idx_correcoes_log_resposta on proof_center.correcoes_log(resposta_aluno_id);
create index if not exists idx_correcoes_log_admin on proof_center.correcoes_log(admin_id);
create index if not exists idx_correcoes_log_acao on proof_center.correcoes_log(acao);

create index if not exists idx_importacoes_assistidas_prova on proof_center.importacoes_assistidas(prova_id);
create index if not exists idx_importacoes_assistidas_status on proof_center.importacoes_assistidas(status);

drop trigger if exists trg_questoes_master_updated_at on proof_center.questoes_master;
create trigger trg_questoes_master_updated_at
before update on proof_center.questoes_master
for each row execute function public.set_updated_at();

drop trigger if exists trg_provas_updated_at on proof_center.provas;
create trigger trg_provas_updated_at
before update on proof_center.provas
for each row execute function public.set_updated_at();

drop trigger if exists trg_prova_questoes_updated_at on proof_center.prova_questoes;
create trigger trg_prova_questoes_updated_at
before update on proof_center.prova_questoes
for each row execute function public.set_updated_at();

drop trigger if exists trg_tentativas_prova_updated_at on proof_center.tentativas_prova;
create trigger trg_tentativas_prova_updated_at
before update on proof_center.tentativas_prova
for each row execute function public.set_updated_at();

drop trigger if exists trg_respostas_aluno_updated_at on proof_center.respostas_aluno;
create trigger trg_respostas_aluno_updated_at
before update on proof_center.respostas_aluno
for each row execute function public.set_updated_at();

create or replace function proof_center.touch_parent_prova()
returns trigger
language plpgsql
as $$
declare
  v_prova_id uuid;
begin
  v_prova_id := coalesce(new.prova_id, old.prova_id);

  if v_prova_id is not null then
    update proof_center.provas
    set updated_at = now()
    where id = v_prova_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_prova_questoes_touch_parent on proof_center.prova_questoes;
create trigger trg_prova_questoes_touch_parent
after insert or update or delete on proof_center.prova_questoes
for each row execute function proof_center.touch_parent_prova();

drop trigger if exists trg_prova_arquivos_touch_parent on proof_center.prova_arquivos;
create trigger trg_prova_arquivos_touch_parent
after insert or update or delete on proof_center.prova_arquivos
for each row execute function proof_center.touch_parent_prova();

create or replace function proof_center.recalculate_tentativa_totals(p_tentativa_id uuid)
returns void
language plpgsql
as $$
declare
  v_total_nota numeric(8,2);
  v_total_acertos integer;
  v_total_erros integer;
begin
  if p_tentativa_id is null then
    return;
  end if;

  select
    coalesce(sum(coalesce(ra.nota_atribuida, 0)), 0),
    count(*) filter (where ra.correta is true),
    count(*) filter (where ra.correta is false)
  into
    v_total_nota,
    v_total_acertos,
    v_total_erros
  from proof_center.respostas_aluno ra
  where ra.tentativa_id = p_tentativa_id;

  update proof_center.tentativas_prova
  set
    nota_parcial = v_total_nota,
    total_acertos = coalesce(v_total_acertos, 0),
    total_erros = coalesce(v_total_erros, 0),
    updated_at = now()
  where id = p_tentativa_id;
end;
$$;

create or replace function proof_center.sync_resposta_tentativa_totals()
returns trigger
language plpgsql
as $$
declare
  v_tentativa_id uuid;
begin
  v_tentativa_id := coalesce(new.tentativa_id, old.tentativa_id);
  perform proof_center.recalculate_tentativa_totals(v_tentativa_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_respostas_aluno_sync_totals on proof_center.respostas_aluno;
create trigger trg_respostas_aluno_sync_totals
after insert or update or delete on proof_center.respostas_aluno
for each row execute function proof_center.sync_resposta_tentativa_totals();

create or replace function proof_center.corrigir_objetiva(p_resposta_id uuid)
returns void
language plpgsql
as $$
declare
  v_questao_id uuid;
  v_alternativa varchar(2);
  v_peso numeric(8,2);
  v_correta boolean;
  v_has_key boolean;
begin
  select
    ra.questao_id,
    upper(trim(coalesce(ra.alternativa_marcada, ''))),
    pq.peso
  into
    v_questao_id,
    v_alternativa,
    v_peso
  from proof_center.respostas_aluno ra
  join proof_center.prova_questoes pq on pq.id = ra.prova_questao_id
  where ra.id = p_resposta_id;

  if v_questao_id is null then
    return;
  end if;

  if v_alternativa is null or v_alternativa = '' then
    update proof_center.respostas_aluno
    set
      correta = false,
      nota_atribuida = 0,
      status_correcao = 'baixa_confianca',
      confianca_correcao = 20,
      motivo_pendencia = 'Nenhuma alternativa valida foi enviada.',
      corrigido_em = now()
    where id = p_resposta_id;
    return;
  end if;

  select exists (
    select 1
    from proof_center.questao_gabaritos qg
    where qg.questao_id = v_questao_id
      and qg.tipo_gabarito = 'alternativa'
      and upper(trim(coalesce(qg.resposta_bruta, qg.resposta_normalizada, ''))) = v_alternativa
  ) into v_correta;

  select exists (
    select 1
    from proof_center.questao_gabaritos qg
    where qg.questao_id = v_questao_id
      and qg.tipo_gabarito = 'alternativa'
  ) into v_has_key;

  if not v_has_key then
    update proof_center.respostas_aluno
    set
      correta = null,
      nota_atribuida = null,
      status_correcao = 'baixa_confianca',
      confianca_correcao = 10,
      motivo_pendencia = 'A questao ainda nao possui gabarito objetivo estruturado.',
      corrigido_em = now()
    where id = p_resposta_id;
    return;
  end if;

  update proof_center.respostas_aluno
  set
    correta = v_correta,
    nota_atribuida = case when v_correta then coalesce(v_peso, 1) else 0 end,
    status_correcao = 'corrigida_automatica',
    confianca_correcao = 100,
    motivo_pendencia = null,
    corrigido_em = now()
  where id = p_resposta_id;
end;
$$;

create or replace function proof_center.corrigir_numerica(p_resposta_id uuid)
returns void
language plpgsql
as $$
declare
  v_questao_id uuid;
  v_peso numeric(8,2);
  v_resposta numeric;
  v_match boolean := false;
  v_has_key boolean := false;
  v_expected numeric;
  v_tolerancia_abs numeric;
  v_tolerancia_pct numeric;
  v_variacao numeric;
begin
  select
    ra.questao_id,
    pq.peso,
    coalesce(
      ra.valor_numerico,
      proof_center.extract_numeric_answer(coalesce(ra.resposta_normalizada, ra.resposta_bruta))
    )
  into
    v_questao_id,
    v_peso,
    v_resposta
  from proof_center.respostas_aluno ra
  join proof_center.prova_questoes pq on pq.id = ra.prova_questao_id
  where ra.id = p_resposta_id;

  if v_questao_id is null then
    return;
  end if;

  if v_resposta is null then
    update proof_center.respostas_aluno
    set
      correta = null,
      nota_atribuida = null,
      status_correcao = 'baixa_confianca',
      confianca_correcao = 25,
      motivo_pendencia = 'A resposta numerica nao pode ser normalizada com seguranca.',
      corrigido_em = now()
    where id = p_resposta_id;
    return;
  end if;

  for v_expected, v_tolerancia_abs, v_tolerancia_pct in
    select
      coalesce(qg.valor_numerico, proof_center.extract_numeric_answer(coalesce(qg.resposta_normalizada, qg.resposta_bruta))),
      coalesce(qg.tolerancia_absoluta, qm.tolerancia_absoluta, 0),
      coalesce(qg.tolerancia_percentual, qm.tolerancia_percentual, 0)
    from proof_center.questao_gabaritos qg
    join proof_center.questoes_master qm on qm.id = qg.questao_id
    where qg.questao_id = v_questao_id
      and qg.tipo_gabarito = 'numero'
  loop
    v_has_key := true;

    if v_expected is null then
      continue;
    end if;

    v_variacao := greatest(
      coalesce(v_tolerancia_abs, 0),
      abs(v_expected) * coalesce(v_tolerancia_pct, 0) / 100.0
    );

    if abs(v_resposta - v_expected) <= v_variacao then
      v_match := true;
      exit;
    end if;
  end loop;

  if not v_has_key then
    update proof_center.respostas_aluno
    set
      correta = null,
      nota_atribuida = null,
      status_correcao = 'baixa_confianca',
      confianca_correcao = 10,
      motivo_pendencia = 'A questao numerica ainda nao possui gabarito estruturado.',
      corrigido_em = now()
    where id = p_resposta_id;
    return;
  end if;

  update proof_center.respostas_aluno
  set
    correta = v_match,
    nota_atribuida = case when v_match then coalesce(v_peso, 1) else 0 end,
    status_correcao = 'corrigida_automatica',
    confianca_correcao = case when v_match then 97 else 92 end,
    motivo_pendencia = null,
    corrigido_em = now()
  where id = p_resposta_id;
end;
$$;

create or replace function proof_center.executar_correcao_base(p_resposta_id uuid)
returns void
language plpgsql
as $$
declare
  v_tipo_questao proof_center.tipo_questao_enum;
  v_metodo proof_center.metodo_correcao_enum;
begin
  select
    qm.tipo_questao,
    qm.metodo_correcao
  into
    v_tipo_questao,
    v_metodo
  from proof_center.respostas_aluno ra
  join proof_center.questoes_master qm on qm.id = ra.questao_id
  where ra.id = p_resposta_id;

  if v_tipo_questao is null then
    return;
  end if;

  if v_metodo = 'manual' or v_tipo_questao = 'discursiva_calculo' then
    update proof_center.respostas_aluno
    set
      correta = null,
      nota_atribuida = null,
      status_correcao = 'revisao_manual',
      confianca_correcao = 0,
      motivo_pendencia = 'Questao depende de revisao manual.',
      corrigido_em = now()
    where id = p_resposta_id;
    return;
  end if;

  if v_metodo = 'semiassistida' or v_tipo_questao = 'expressao_simples' then
    update proof_center.respostas_aluno
    set
      correta = null,
      nota_atribuida = null,
      status_correcao = 'revisao_manual',
      confianca_correcao = 35,
      motivo_pendencia = 'Questao marcada para revisao semiassistida.',
      corrigido_em = now()
    where id = p_resposta_id;
    return;
  end if;

  if v_tipo_questao = 'objetiva' then
    perform proof_center.corrigir_objetiva(p_resposta_id);
    return;
  end if;

  if v_tipo_questao = 'numerica' then
    perform proof_center.corrigir_numerica(p_resposta_id);
    return;
  end if;

  update proof_center.respostas_aluno
  set
    correta = null,
    nota_atribuida = null,
    status_correcao = 'revisao_manual',
    confianca_correcao = 15,
    motivo_pendencia = 'Questao enviada para revisao manual.',
    corrigido_em = now()
  where id = p_resposta_id;
end;
$$;

create or replace function proof_center.reprocessar_tentativa(p_tentativa_id uuid)
returns void
language plpgsql
as $$
declare
  v_resposta record;
begin
  for v_resposta in
    select id
    from proof_center.respostas_aluno
    where tentativa_id = p_tentativa_id
    order by created_at asc
  loop
    perform proof_center.executar_correcao_base(v_resposta.id);
  end loop;
end;
$$;

create or replace view proof_center.vw_provas_catalogo as
select
  p.id,
  p.titulo,
  p.descricao,
  p.disciplina,
  p.area,
  p.nivel,
  p.ano,
  p.tipo_prova,
  p.status,
  p.origem,
  p.tempo_limite_min,
  p.observacoes,
  p.created_by,
  p.updated_by,
  p.created_at,
  p.updated_at,
  count(distinct pq.id) as total_questoes,
  count(distinct pa.id) as total_arquivos
from proof_center.provas p
left join proof_center.prova_questoes pq on pq.prova_id = p.id
left join proof_center.prova_arquivos pa on pa.prova_id = p.id
group by
  p.id,
  p.titulo,
  p.descricao,
  p.disciplina,
  p.area,
  p.nivel,
  p.ano,
  p.tipo_prova,
  p.status,
  p.origem,
  p.tempo_limite_min,
  p.observacoes,
  p.created_by,
  p.updated_by,
  p.created_at,
  p.updated_at;

create or replace view proof_center.vw_questoes_master_catalogo as
select
  qm.id,
  qm.titulo_interno,
  qm.enunciado,
  qm.tipo_questao,
  qm.area,
  qm.assunto,
  qm.subassunto,
  qm.formula_principal,
  qm.unidade_resposta,
  qm.casas_decimais_esperadas,
  qm.aceita_notacao_cientifica,
  qm.metodo_correcao,
  qm.tolerancia_absoluta,
  qm.tolerancia_percentual,
  qm.peso_padrao,
  qm.dificuldade_interna,
  qm.possui_imagem,
  qm.imagem_url,
  qm.observacoes_admin,
  qm.origem_cadastro,
  qm.status,
  qm.created_by,
  qm.updated_by,
  qm.created_at,
  qm.updated_at,
  count(distinct pq.id) as usage_count,
  count(distinct qa.id) as total_alternativas,
  count(distinct qg.id) as total_gabaritos
from proof_center.questoes_master qm
left join proof_center.prova_questoes pq on pq.questao_id = qm.id
left join proof_center.questao_alternativas qa on qa.questao_id = qm.id
left join proof_center.questao_gabaritos qg on qg.questao_id = qm.id
group by
  qm.id,
  qm.titulo_interno,
  qm.enunciado,
  qm.tipo_questao,
  qm.area,
  qm.assunto,
  qm.subassunto,
  qm.formula_principal,
  qm.unidade_resposta,
  qm.casas_decimais_esperadas,
  qm.aceita_notacao_cientifica,
  qm.metodo_correcao,
  qm.tolerancia_absoluta,
  qm.tolerancia_percentual,
  qm.peso_padrao,
  qm.dificuldade_interna,
  qm.possui_imagem,
  qm.imagem_url,
  qm.observacoes_admin,
  qm.origem_cadastro,
  qm.status,
  qm.created_by,
  qm.updated_by,
  qm.created_at,
  qm.updated_at;

create or replace view proof_center.vw_fila_correcao as
select
  ra.id as resposta_id,
  ra.tentativa_id,
  ra.prova_questao_id,
  ra.questao_id,
  tp.prova_id,
  p.titulo as prova_titulo,
  p.disciplina,
  tp.aluno_id,
  coalesce(au.raw_user_meta_data ->> 'name', au.email, 'Aluno') as aluno_nome,
  au.email as aluno_email,
  pq.numero_na_prova,
  qm.titulo_interno,
  qm.enunciado,
  qm.tipo_questao,
  qm.metodo_correcao,
  qm.assunto,
  qm.subassunto,
  ra.resposta_bruta,
  ra.resposta_normalizada,
  ra.alternativa_marcada,
  ra.valor_numerico,
  ra.expressao_bruta,
  ra.status_correcao,
  ra.confianca_correcao,
  ra.nota_atribuida,
  ra.correta,
  ra.motivo_pendencia,
  ra.feedback,
  ra.created_at,
  ra.updated_at
from proof_center.respostas_aluno ra
join proof_center.tentativas_prova tp on tp.id = ra.tentativa_id
join proof_center.provas p on p.id = tp.prova_id
join proof_center.prova_questoes pq on pq.id = ra.prova_questao_id
join proof_center.questoes_master qm on qm.id = ra.questao_id
left join auth.users au on au.id = tp.aluno_id;

create or replace view proof_center.vw_resultados_tentativa as
select
  tp.id as tentativa_id,
  tp.prova_id,
  p.titulo as prova_titulo,
  p.disciplina,
  tp.aluno_id,
  coalesce(au.raw_user_meta_data ->> 'name', au.email, 'Aluno') as aluno_nome,
  au.email as aluno_email,
  tp.status,
  tp.created_at,
  tp.updated_at,
  count(ra.id) as total_respondidas,
  count(*) filter (where ra.correta is true) as total_corretas,
  count(*) filter (where ra.correta is false) as total_incorretas,
  count(*) filter (where ra.status_correcao in ('pendente', 'baixa_confianca', 'revisao_manual')) as total_pendentes,
  coalesce(sum(ra.nota_atribuida), 0) as soma_notas,
  tp.nota_parcial,
  tp.nota_final,
  tp.total_acertos,
  tp.total_erros
from proof_center.tentativas_prova tp
join proof_center.provas p on p.id = tp.prova_id
left join auth.users au on au.id = tp.aluno_id
left join proof_center.respostas_aluno ra on ra.tentativa_id = tp.id
group by
  tp.id,
  tp.prova_id,
  p.titulo,
  p.disciplina,
  tp.aluno_id,
  au.raw_user_meta_data,
  au.email,
  tp.status,
  tp.created_at,
  tp.updated_at,
  tp.nota_parcial,
  tp.nota_final,
  tp.total_acertos,
  tp.total_erros;
