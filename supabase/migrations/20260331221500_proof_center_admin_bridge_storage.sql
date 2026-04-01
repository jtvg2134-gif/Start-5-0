alter table if exists proof_center.questoes_master
  add column if not exists created_by_legacy_id bigint,
  add column if not exists updated_by_legacy_id bigint;

alter table if exists proof_center.provas
  add column if not exists created_by_legacy_id bigint,
  add column if not exists updated_by_legacy_id bigint;

alter table if exists proof_center.prova_arquivos
  add column if not exists created_by_legacy_id bigint;

alter table if exists proof_center.importacoes_assistidas
  add column if not exists created_by_legacy_id bigint;

alter table if exists proof_center.respostas_aluno
  add column if not exists corrigido_por_legacy_id bigint;

alter table if exists proof_center.revisoes_correcao
  add column if not exists admin_legacy_id bigint;

alter table if exists proof_center.correcoes_log
  add column if not exists admin_legacy_id bigint;

create index if not exists idx_questoes_master_created_by_legacy_id
  on proof_center.questoes_master(created_by_legacy_id);

create index if not exists idx_questoes_master_updated_by_legacy_id
  on proof_center.questoes_master(updated_by_legacy_id);

create index if not exists idx_provas_created_by_legacy_id
  on proof_center.provas(created_by_legacy_id);

create index if not exists idx_provas_updated_by_legacy_id
  on proof_center.provas(updated_by_legacy_id);

create index if not exists idx_prova_arquivos_created_by_legacy_id
  on proof_center.prova_arquivos(created_by_legacy_id);

create index if not exists idx_importacoes_assistidas_created_by_legacy_id
  on proof_center.importacoes_assistidas(created_by_legacy_id);

create index if not exists idx_respostas_aluno_corrigido_por_legacy_id
  on proof_center.respostas_aluno(corrigido_por_legacy_id);

create index if not exists idx_revisoes_correcao_admin_legacy_id
  on proof_center.revisoes_correcao(admin_legacy_id);

create index if not exists idx_correcoes_log_admin_legacy_id
  on proof_center.correcoes_log(admin_legacy_id);

do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    values (
      'proof-center-files',
      'proof-center-files',
      false,
      52428800,
      array['application/pdf']
    )
    on conflict (id) do update
      set public = excluded.public,
          file_size_limit = excluded.file_size_limit,
          allowed_mime_types = excluded.allowed_mime_types;
  end if;
end
$$;
