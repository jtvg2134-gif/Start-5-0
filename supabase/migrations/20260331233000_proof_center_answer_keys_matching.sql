do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'gabarito_tipo_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.gabarito_tipo_enum as enum (
      'oficial',
      'ajustado',
      'provisorio'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'gabarito_status_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.gabarito_status_enum as enum (
      'draft',
      'active',
      'archived'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'gabarito_fonte_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.gabarito_fonte_enum as enum (
      'manual',
      'importado',
      'revisado'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'answer_key_question_type_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.answer_key_question_type_enum as enum (
      'multipla_escolha',
      'verdadeiro_falso',
      'numerica_exata',
      'numerica_com_tolerancia',
      'discursiva_manual',
      'hibrida'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'matching_level_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.matching_level_enum as enum (
      'automatic',
      'suggested',
      'manual'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'import_processing_status_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.import_processing_status_enum as enum (
      'uploaded',
      'extracting_text',
      'ocr_required',
      'matching_proof',
      'matched_automatic',
      'matched_suggested',
      'manual_review_required',
      'parsed_questions',
      'questions_imported',
      'ready_for_correction',
      'failed'
    );
  end if;

  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where t.typname = 'parsed_question_review_status_enum'
      and n.nspname = 'proof_center'
  ) then
    create type proof_center.parsed_question_review_status_enum as enum (
      'pending',
      'reviewed',
      'imported',
      'ignored'
    );
  end if;
end
$$;

alter table if exists proof_center.provas
  add column if not exists proof_code text,
  add column if not exists exam_provider text,
  add column if not exists exam_name text,
  add column if not exists exam_year integer,
  add column if not exists exam_edition text,
  add column if not exists exam_day text,
  add column if not exists application_date date,
  add column if not exists subject_group text,
  add column if not exists booklet_color text,
  add column if not exists exam_version text,
  add column if not exists exam_language text,
  add column if not exists expected_question_count integer,
  add column if not exists parser_profile text,
  add column if not exists alias_keywords jsonb not null default '[]'::jsonb,
  add column if not exists identification_notes text;

alter table if exists proof_center.provas
  add constraint provas_expected_question_count_check
  check (expected_question_count is null or expected_question_count > 0) not valid;

alter table proof_center.provas validate constraint provas_expected_question_count_check;

create unique index if not exists uq_provas_proof_code
  on proof_center.provas(proof_code)
  where proof_code is not null and length(trim(proof_code)) > 0;

create index if not exists idx_provas_exam_provider on proof_center.provas(exam_provider);
create index if not exists idx_provas_exam_year on proof_center.provas(exam_year);
create index if not exists idx_provas_booklet_color on proof_center.provas(booklet_color);
create index if not exists idx_provas_alias_keywords
  on proof_center.provas using gin (alias_keywords);

create table if not exists proof_center.gabaritos (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references proof_center.provas(id) on delete cascade,
  answer_key_type proof_center.gabarito_tipo_enum not null default 'oficial',
  source proof_center.gabarito_fonte_enum not null default 'manual',
  status proof_center.gabarito_status_enum not null default 'draft',
  confidence numeric(5,2),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_by_legacy_id bigint,
  updated_by_legacy_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gabaritos_confidence_check
    check (confidence is null or (confidence >= 0 and confidence <= 100))
);

create trigger trg_gabaritos_updated_at
before update on proof_center.gabaritos
for each row execute function public.set_updated_at();

create index if not exists idx_gabaritos_proof_id on proof_center.gabaritos(proof_id);
create index if not exists idx_gabaritos_status on proof_center.gabaritos(status);

create table if not exists proof_center.gabarito_itens (
  id uuid primary key default gen_random_uuid(),
  answer_key_id uuid not null references proof_center.gabaritos(id) on delete cascade,
  question_number integer not null,
  question_type proof_center.answer_key_question_type_enum not null,
  expected_answer text,
  validation_rule jsonb not null default '{}'::jsonb,
  numeric_tolerance numeric(14,6),
  weight numeric(8,2) not null default 1.00,
  metadata jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gabarito_itens_question_number_check check (question_number > 0),
  constraint gabarito_itens_weight_check check (weight > 0),
  constraint gabarito_itens_numeric_tolerance_check check (numeric_tolerance is null or numeric_tolerance >= 0),
  constraint gabarito_itens_question_unique unique (answer_key_id, question_number)
);

create trigger trg_gabarito_itens_updated_at
before update on proof_center.gabarito_itens
for each row execute function public.set_updated_at();

create index if not exists idx_gabarito_itens_answer_key_id on proof_center.gabarito_itens(answer_key_id);
create index if not exists idx_gabarito_itens_question_type on proof_center.gabarito_itens(question_type);

alter table if exists proof_center.importacoes_assistidas
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists processamento_status proof_center.import_processing_status_enum not null default 'uploaded',
  add column if not exists matching_level proof_center.matching_level_enum,
  add column if not exists matching_confidence numeric(5,2),
  add column if not exists recognized_proof_id uuid references proof_center.provas(id) on delete set null,
  add column if not exists recognized_answer_key_id uuid references proof_center.gabaritos(id) on delete set null,
  add column if not exists detected_metadata jsonb not null default '{}'::jsonb,
  add column if not exists processing_summary jsonb not null default '{}'::jsonb,
  add column if not exists review_required boolean not null default false,
  add column if not exists ocr_required boolean not null default false,
  add column if not exists parsed_question_count integer,
  add column if not exists error_message text;

create trigger trg_importacoes_assistidas_updated_at
before update on proof_center.importacoes_assistidas
for each row execute function public.set_updated_at();

create index if not exists idx_importacoes_processamento_status
  on proof_center.importacoes_assistidas(processamento_status);
create index if not exists idx_importacoes_matching_level
  on proof_center.importacoes_assistidas(matching_level);
create index if not exists idx_importacoes_recognized_proof_id
  on proof_center.importacoes_assistidas(recognized_proof_id);

create table if not exists proof_center.import_questoes_detectadas (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid not null references proof_center.importacoes_assistidas(id) on delete cascade,
  question_number integer not null,
  raw_block text,
  stem text,
  alternatives jsonb not null default '[]'::jsonb,
  parsing_confidence numeric(5,2),
  review_status proof_center.parsed_question_review_status_enum not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  linked_question_id uuid references proof_center.questoes_master(id) on delete set null,
  linked_proof_item_id uuid references proof_center.prova_questoes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint import_questoes_detectadas_question_number_check check (question_number > 0),
  constraint import_questoes_detectadas_confidence_check
    check (parsing_confidence is null or (parsing_confidence >= 0 and parsing_confidence <= 100))
);

create trigger trg_import_questoes_detectadas_updated_at
before update on proof_center.import_questoes_detectadas
for each row execute function public.set_updated_at();

create index if not exists idx_import_questoes_detectadas_importacao_id
  on proof_center.import_questoes_detectadas(importacao_id);
create index if not exists idx_import_questoes_detectadas_review_status
  on proof_center.import_questoes_detectadas(review_status);

create table if not exists proof_center.import_process_logs (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid not null references proof_center.importacoes_assistidas(id) on delete cascade,
  status proof_center.import_processing_status_enum not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_process_logs_importacao_id
  on proof_center.import_process_logs(importacao_id, created_at desc);
