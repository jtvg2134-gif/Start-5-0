# Start-5 Handoff para Outro Codex

Data de referencia: 2026-04-01
Projeto: Start-5
Workspace: `C:\Users\Teste\Downloads\Start-5`

## 1. Visao geral do projeto

O Start-5 e um sistema com foco em constancia de estudo, onboarding leve, rotina, painel, pratica e modulos administrativos.

A direcao geral do produto que foi consolidada neste projeto:
- interface escura, premium, limpa e sem excesso de ruido
- experiencia leve e funcional
- fluxo de estudo centrado em constancia e progresso visivel
- admin modular, com hubs e paginas separadas
- evitar dashboards genericos e blocos sem funcao real

## 2. Onde paramos no projeto

Ultimo marco grande identificado no historico local:
- commit `75f79b0`
- data: 2026-03-26
- mensagem: `Atualiza onboarding e ajustes do projeto`

Esse pacote envolveu principalmente:
- onboarding novo
- motor de objetivo
- telas de onboarding
- logica forte no servidor principal

Arquivos importantes desse ponto:
- [server.js](C:/Users/Teste/Downloads/Start-5/server.js)
- [backend/start5_goal/app.js](C:/Users/Teste/Downloads/Start-5/backend/start5_goal/app.js)
- [public/js/onboarding.js](C:/Users/Teste/Downloads/Start-5/public/js/onboarding.js)
- [public/onboarding-curso.html](C:/Users/Teste/Downloads/Start-5/public/onboarding-curso.html)
- [public/onboarding-prioridades.html](C:/Users/Teste/Downloads/Start-5/public/onboarding-prioridades.html)
- [public/onboarding-semana.html](C:/Users/Teste/Downloads/Start-5/public/onboarding-semana.html)

Tambem havia rastros locais antigos:
- `scripts/generate-enem-manifest.js` removido
- [public/admin.html](C:/Users/Teste/Downloads/Start-5/public/admin.html) com ajuste semantico/visual

## 3. Mudancas grandes ja feitas nesta fase recente

### 3.1. Carregamento visual das imagens

Foi corrigido o problema dos SVGs aparecendo antes dos JPGs.

Objetivo atingido:
- SVGs de placeholder nao aparecem mais como fundo visivel
- JPGs principais sao revelados com carregamento mais controlado
- fundo neutro e transicao suave no carregamento

Arquivos principais envolvidos:
- [public/js/main.js](C:/Users/Teste/Downloads/Start-5/public/js/main.js)
- [public/css/global.css](C:/Users/Teste/Downloads/Start-5/public/css/global.css)
- [public/css/dashboard.css](C:/Users/Teste/Downloads/Start-5/public/css/dashboard.css)
- [public/css/redacao.css](C:/Users/Teste/Downloads/Start-5/public/css/redacao.css)
- [public/css/rotina.css](C:/Users/Teste/Downloads/Start-5/public/css/rotina.css)
- [public/index.html](C:/Users/Teste/Downloads/Start-5/public/index.html)
- [public/dashboard.html](C:/Users/Teste/Downloads/Start-5/public/dashboard.html)
- [public/questoes.html](C:/Users/Teste/Downloads/Start-5/public/questoes.html)
- [public/redacao.html](C:/Users/Teste/Downloads/Start-5/public/redacao.html)
- [public/rotina.html](C:/Users/Teste/Downloads/Start-5/public/rotina.html)

### 3.2. Admin de usuarios e perfis

Foi criada uma gestao de perfis no admin com:
- selecao de multiplos perfis
- exclusao em lote
- concessao e remocao de permissao
- confirmacao de seguranca
- protecoes contra autoexclusao, autorevogacao e ultimo admin

Arquivos principais:
- [public/admin.html](C:/Users/Teste/Downloads/Start-5/public/admin.html)
- [public/js/admin.js](C:/Users/Teste/Downloads/Start-5/public/js/admin.js)
- [public/css/admin.css](C:/Users/Teste/Downloads/Start-5/public/css/admin.css)
- [server.js](C:/Users/Teste/Downloads/Start-5/server.js)

### 3.3. Reorganizacao total do admin

O admin principal foi convertido em hub de navegacao, sem cards pesados de visao geral.

Entradas principais criadas:
- [public/admin.html](C:/Users/Teste/Downloads/Start-5/public/admin.html)
- [public/admin-email.html](C:/Users/Teste/Downloads/Start-5/public/admin-email.html)
- [public/admin-perfil.html](C:/Users/Teste/Downloads/Start-5/public/admin-perfil.html)
- modulo de provas foi separado e expandido

### 3.4. Padrao visual de selects e campos escuros

Foi aplicado visual escuro consistente globalmente:
- remoção de setinhas nativas de campos numericos
- `select`, `option`, dropdowns e campos no tema escuro
- sem fundo branco destoando do sistema

Arquivos principais:
- [public/css/global.css](C:/Users/Teste/Downloads/Start-5/public/css/global.css)
- [public/css/onboarding.css](C:/Users/Teste/Downloads/Start-5/public/css/onboarding.css)
- [public/css/rotina.css](C:/Users/Teste/Downloads/Start-5/public/css/rotina.css)

## 4. Estado atual do modulo de provas

Este e o ponto mais importante do handoff.

### 4.1. Decisao estrutural

O modulo novo de provas NAO usa PDF como base principal.

A arquitetura correta consolidada foi:
- base real em dados estruturados
- PDF como apoio opcional
- banco novo isolado em schema `proof_center`
- sem colidir com as tabelas legadas `public.provas` e `public.questoes`
- UUID como padrao em todo o fluxo novo
- fallback para backend antigo preservado quando a API dedicada nao estiver configurada

### 4.2. Banco / schema novo

Migration estrutural principal:
- [20260331183000_proof_center_structured_schema.sql](C:/Users/Teste/Downloads/Start-5/supabase/migrations/20260331183000_proof_center_structured_schema.sql)

Migration de ponte admin + storage:
- [20260331221500_proof_center_admin_bridge_storage.sql](C:/Users/Teste/Downloads/Start-5/supabase/migrations/20260331221500_proof_center_admin_bridge_storage.sql)

Migration nova de identidade forte da prova + gabarito mestre + matching:
- [20260331233000_proof_center_answer_keys_matching.sql](C:/Users/Teste/Downloads/Start-5/supabase/migrations/20260331233000_proof_center_answer_keys_matching.sql)

### 4.3. Nova logica de produto do modulo de provas

A prova reconhecida pelo sistema agora deve nascer assim:
- o gabarito cadastrado pelo admin e o registro mestre da identidade da prova
- essa identidade inclui metadados fortes para reconhecimento automatico do PDF
- o PDF enviado e analisado com base nesses metadados
- o sistema sugere ou confirma a prova correta
- depois disso ele segmenta/importa questoes e prepara a correcao

### 4.4. Identidade forte da prova

A prova agora tem campos como:
- `proof_code`
- `exam_provider`
- `exam_name`
- `exam_year`
- `exam_day`
- `application_date`
- `subject_group`
- `booklet_color`
- `exam_version`
- `exam_language`
- `expected_question_count`
- `parser_profile`
- `alias_keywords`
- `identification_notes`

Exemplo esperado:
- `ENEM-2025-D1-LINGUAGENS-AZUL`

### 4.5. Gabarito mestre

Foram criadas estruturas novas em `proof_center` para:
- `gabaritos`
- `gabarito_itens`
- `import_questoes_detectadas`
- `import_process_logs`

O gabarito agora separa:
- identidade da prova
- registro do gabarito
- itens do gabarito
- regras de validacao
- resposta esperada
- base para correcao futura

Tipos preparados:
- `multipla_escolha`
- `verdadeiro_falso`
- `numerica_exata`
- `numerica_com_tolerancia`
- `discursiva_manual`
- `hibrida`

### 4.6. Matching de PDF

Foi implementada uma base real para:
- upload de PDF
- extracao de texto com `pdf-parse`
- deteccao de sinais como ano, dia, area, cor do caderno e total de questoes
- score de compatibilidade entre PDF e prova cadastrada
- niveis de matching:
  - `automatic`
  - `suggested`
  - `manual`

Servico principal:
- [pdfAnalysis.service.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/services/pdfAnalysis.service.js)

### 4.7. Upload real de arquivos

O upload deixou de ser placeholder.

Ha integracao real planejada/implementada com Supabase Storage via:
- [storage.service.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/services/storage.service.js)

Arquivos e downloads passam pela API dedicada, nao por link cru solto.

### 4.8. Backend dedicado do proof_center

Arquivos centrais:
- [app.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/app.js)
- [proofCenterAdmin.repository.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/repositories/proofCenterAdmin.repository.js)
- [proofCenterAdmin.controller.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/controllers/proofCenterAdmin.controller.js)
- [proofCenter.routes.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/routes/proofCenter.routes.js)
- [proofCenter.reference.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/contracts/proofCenter.reference.js)
- [proofCenter.types.d.ts](C:/Users/Teste/Downloads/Start-5/backend/proof_center/contracts/proofCenter.types.d.ts)
- [adminAuth.service.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/services/adminAuth.service.js)

Responsabilidades importantes ja implementadas:
- referencia de enums
- CRUD de provas do novo schema
- CRUD/base de banco de questoes
- gabarito mestre
- importacoes assistidas
- analise de PDF
- confirmacao manual de vinculo
- importacao de questoes parseadas
- fila de correcao
- resultados
- ponte de autenticacao admin com o sistema legado

### 4.9. Front do proof_center

Cliente dedicado:
- [admin-proof-center-api.js](C:/Users/Teste/Downloads/Start-5/public/js/admin-proof-center-api.js)

Script legado/compartilhado do modulo:
- [admin-proof-center.js](C:/Users/Teste/Downloads/Start-5/public/js/admin-proof-center.js)

Nova camada operacional das telas novas:
- [admin-proof-center-operations.js](C:/Users/Teste/Downloads/Start-5/public/js/admin-proof-center-operations.js)

Estilo compartilhado:
- [admin-proof-center.css](C:/Users/Teste/Downloads/Start-5/public/css/admin-proof-center.css)

### 4.10. Telas do modulo de provas

Telas existentes/importantes:
- [admin-provas.html](C:/Users/Teste/Downloads/Start-5/public/admin-provas.html)
- [admin-provas-lista.html](C:/Users/Teste/Downloads/Start-5/public/admin-provas-lista.html)
- [admin-provas-criar.html](C:/Users/Teste/Downloads/Start-5/public/admin-provas-criar.html)
- [admin-provas-montagem.html](C:/Users/Teste/Downloads/Start-5/public/admin-provas-montagem.html)
- [admin-banco-questoes.html](C:/Users/Teste/Downloads/Start-5/public/admin-banco-questoes.html)
- [admin-questao-editar.html](C:/Users/Teste/Downloads/Start-5/public/admin-questao-editar.html)
- [admin-gabaritos.html](C:/Users/Teste/Downloads/Start-5/public/admin-gabaritos.html)
- [admin-importacao.html](C:/Users/Teste/Downloads/Start-5/public/admin-importacao.html)
- [admin-correcao.html](C:/Users/Teste/Downloads/Start-5/public/admin-correcao.html)
- [admin-correcao-detalhe.html](C:/Users/Teste/Downloads/Start-5/public/admin-correcao-detalhe.html)
- [admin-resultados.html](C:/Users/Teste/Downloads/Start-5/public/admin-resultados.html)

## 5. Redesenho atual da Central de Provas

A central foi redesenhada com este objetivo:
- menos cara de dashboard
- menos cards genericos
- foco operacional
- remover `Hub` e `Resultados` como entradas centrais
- priorizar:
  - novo gabarito
  - nova prova
  - enviar PDF
  - analisar PDF
  - revisar questoes
  - corrigir

Estado atual da central:
- [admin-provas.html](C:/Users/Teste/Downloads/Start-5/public/admin-provas.html) agora e um hub operacional
- mostra resumo enxuto
- mostra mapa de provas
- mostra fila recente de processamento

## 6. O que esta pronto hoje no fluxo de provas

Pronto ou bastante adiantado:
- schema `proof_center`
- backend dedicado
- API dedicada
- suporte a UUID
- fallback legado preservado
- upload real para storage preparado
- gabarito mestre com identidade forte
- matching inicial por metadados/texto
- parsing inicial de questoes
- tela nova de gabaritos
- tela nova de importacao
- central operacional refeita

## 7. O que ainda depende de configuracao externa

Ainda depende do ambiente real:
- aplicar migrations no Supabase real
- configurar:
  - `START5_PROOF_CENTER_DATABASE_URL`
  - `START5_PROOF_CENTER_SUPABASE_URL`
  - `START5_PROOF_CENTER_SUPABASE_SERVICE_ROLE_KEY`
  - bucket do storage
  - origem da API dedicada
- se quiser OCR real para PDF escaneado, ainda falta integrar um motor OCR de verdade

## 8. O que ainda vale revisar ou aprofundar

Proximos passos recomendados:
- testar fluxo real no navegador com Supabase configurado
- validar upload de PDF real ponta a ponta
- validar matching automatico com PDFs reais de prova
- revisar qualidade do parsing de questoes
- evoluir heuristicas por banca/parser profile
- fortalecer correcao numerica e hibrida
- adicionar reprocessamento auditavel mais refinado
- cobrir com testes de integracao do proof_center

## 9. Como rodar localmente

Comandos principais:

```bash
npm start
npm run start:proof-center-api
```

Links locais usuais:
- `http://localhost:3000/login.html`
- `http://localhost:3000/admin.html`
- `http://localhost:3000/admin-provas.html`
- `http://localhost:3030/health`

## 10. Validacoes que ja foram feitas

Ja foram validados com `node --check` em momentos recentes:
- [backend/proof_center/app.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/app.js)
- [backend/proof_center/controllers/proofCenterAdmin.controller.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/controllers/proofCenterAdmin.controller.js)
- [backend/proof_center/repositories/proofCenterAdmin.repository.js](C:/Users/Teste/Downloads/Start-5/backend/proof_center/repositories/proofCenterAdmin.repository.js)
- [public/js/admin-proof-center.js](C:/Users/Teste/Downloads/Start-5/public/js/admin-proof-center.js)
- [public/js/admin-proof-center-operations.js](C:/Users/Teste/Downloads/Start-5/public/js/admin-proof-center-operations.js)

Tambem houve smoke test da API dedicada:
- `/health` respondeu OK
- `/proof-center/summary` sem sessao respondeu `401`, como esperado

## 11. Regras importantes para outro Codex nao quebrar o projeto

Nao fazer:
- nao mover nada do schema novo para `public`
- nao voltar a depender de IDs numericos no fluxo novo
- nao quebrar o fallback para o backend antigo
- nao remover compatibilidade com o admin atual
- nao transformar o PDF novamente em base principal
- nao apagar mudancas legadas fora do escopo

Fazer:
- manter tudo incremental
- preservar `proof_center` isolado
- manter UUID
- tratar a identidade da prova via gabarito mestre
- preferir evolucao real a placeholder visual

## 12. Resumo curto para colar em outro Codex

Use isto como prompt de contexto:

```text
Projeto: Start-5, em C:\Users\Teste\Downloads\Start-5.
Existe sistema legado e novo modulo isolado em schema proof_center.
Nao quebrar legado. Nao mover nada para public schema. Nao assumir IDs numericos. UUID e padrao no modulo novo.

O modulo de provas foi redesenhado para ser centrado em dados estruturados, nao em PDF.
O gabarito agora e o registro mestre da identidade da prova.
Campos fortes da prova: proof_code, exam_provider, exam_name, exam_year, exam_day, application_date, subject_group, booklet_color, exam_version, exam_language, expected_question_count, parser_profile, alias_keywords, identification_notes.

PDF entra como apoio real:
- upload para storage
- extracao de texto com pdf-parse
- matching da prova por score
- sugestao ou confirmacao manual
- parsing de questoes
- importacao das questoes para o banco estruturado

Arquivos principais:
- backend/proof_center/app.js
- backend/proof_center/repositories/proofCenterAdmin.repository.js
- backend/proof_center/controllers/proofCenterAdmin.controller.js
- backend/proof_center/routes/proofCenter.routes.js
- backend/proof_center/services/adminAuth.service.js
- backend/proof_center/services/storage.service.js
- backend/proof_center/services/pdfAnalysis.service.js
- backend/proof_center/contracts/proofCenter.reference.js
- backend/proof_center/contracts/proofCenter.types.d.ts
- public/js/admin-proof-center-api.js
- public/js/admin-proof-center.js
- public/js/admin-proof-center-operations.js
- public/css/admin-proof-center.css
- public/admin-provas.html
- public/admin-gabaritos.html
- public/admin-importacao.html

Migrations:
- supabase/migrations/20260331183000_proof_center_structured_schema.sql
- supabase/migrations/20260331221500_proof_center_admin_bridge_storage.sql
- supabase/migrations/20260331233000_proof_center_answer_keys_matching.sql

Estado atual:
- central de provas refeita para fluxo operacional
- gabarito mestre implementado no front/back
- importacao com analise e matching implementada no front/back
- fallback legado preservado
- storage preparado
- ainda depende de configuracao real do Supabase e aplicacao das migrations
```
