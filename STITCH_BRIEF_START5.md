# Start-5 Stitch Brief

Este arquivo existe para servir de briefing para ferramentas de design como Google Stitch.

Objetivo:
- redesenhar as telas do Start-5
- melhorar hierarquia visual
- melhorar ritmo, espacamento e acabamento
- manter a identidade premium/escura
- NAO alterar logica, funcoes, IDs, fluxos, payloads ou integracoes

---

## 1. Regra principal

O Stitch deve atuar como:
- designer visual
- organizador de layout
- refinador de componentes

O Stitch NAO deve atuar como:
- reescritor de backend
- mudador de regras de negocio
- alterador de rotas
- alterador de nomes de campos
- alterador de IDs usados pelo JavaScript

---

## 2. Estilo base do produto

O Start-5 segue esta direcao:
- tema escuro
- visual premium
- pouco ruido
- foco em acao pratica
- menos dashboard generico
- menos blocos pesados
- cards mais discretos
- mais respiracao entre elementos
- tipografia forte e elegante
- contraste controlado
- bordas suaves
- foco em operacao e clareza

Palavras-chave:
- dark premium
- minimalista
- operacional
- elegante
- moderno
- sem excesso de descricoes
- sem visual escolar
- sem visual genérico de admin template

---

## 3. O que pode ser redesenhado

Pode mudar:
- composicao visual
- distribuicao de blocos
- hierarquia tipografica
- espacamento
- tamanho e estilo de cards
- aparencia dos botoes
- aparencia de listas
- aparencia de tabelas
- aparencia de filtros
- aparencia de estados de loading/vazio/erro
- organizacao visual de formularios
- barras de acao
- navegacao secundaria

---

## 4. O que NAO pode ser mudado

Nao mudar:
- nomes de arquivos HTML
- nomes de endpoints `/api/...`
- `id=""` usados nos formularios
- `data-*` usados pelo JS
- nomes de campos que o JS le
- sequencia logica das operacoes
- validacoes do backend
- nomes de rotas do admin
- integracao com Supabase/PostgreSQL
- UUIDs como padrao
- fallback do backend antigo

Se precisar mexer em markup:
- manter os `id`
- manter os `name` quando existirem
- manter os pontos de hook do JavaScript

---

## 5. Arquitetura geral de telas

O sistema tem 2 grandes grupos:

### 5.1. Produto principal

Telas principais:
- `login.html`
- `index.html`
- `dashboard.html`
- `questoes.html`
- `redacao.html`
- `rotina.html`
- `profile.html`
- onboarding em telas separadas

### 5.2. Admin

O admin principal e um hub.

Entradas administrativas:
- `admin.html`
- `admin-email.html`
- `admin-perfil.html`
- modulo de provas em paginas separadas

---

## 6. Estrutura visual esperada do produto principal

### 6.1. Inicio

Arquivo:
- `public/index.html`

Papel:
- area operacional do dia
- foco em pratica, continuidade e proximo passo

Componentes esperados:
- cabecalho com conta
- area central leve
- card principal de acao
- blocos de continuidade
- CTA objetivo

Tom:
- acolhedor
- leve
- sem excesso de metricas

### 6.2. Painel

Arquivo:
- `public/dashboard.html`

Papel:
- visao de progresso
- historico
- entendimento do caminho

Componentes esperados:
- cards de progresso
- listas/resumos
- secoes de historico

Tom:
- analitico, mas limpo

### 6.3. Questoes

Arquivo:
- `public/questoes.html`

Papel:
- resolucao e exploracao de questoes

Componentes esperados:
- filtros
- cards/listas de questoes
- area de interacao

### 6.4. Redacao

Arquivo:
- `public/redacao.html`

Papel:
- operacao de redacao
- temas
- producao
- biblioteca

### 6.5. Rotina

Arquivo:
- `public/rotina.html`

Papel:
- configuracao e acompanhamento da rotina de estudo

Componentes esperados:
- selecao de materias
- prioridades
- plano semanal

### 6.6. Perfil

Arquivo:
- `public/profile.html`

Papel:
- configuracoes e informacoes da conta

---

## 7. Estrutura visual esperada do admin

### 7.1. Admin principal

Arquivo:
- `public/admin.html`

Papel:
- hub limpo de navegacao

Nao deve parecer:
- dashboard cheio
- painel com muitos cards de resumo

Deve parecer:
- central premium de acesso

### 7.2. Email

Arquivo:
- `public/admin-email.html`

Papel:
- gestao de perfis
- permissoes
- selecao de usuarios
- acoes seguras

### 7.3. Perfil

Arquivo:
- `public/admin-perfil.html`

Papel:
- area administrativa de perfil/configuracoes futuras

---

## 8. Estrutura visual esperada do modulo de provas

Este e o modulo mais importante hoje.

### Conceito central

O modulo de provas nao e um gerenciador de PDF.

Ele e:
- banco estruturado de provas
- gabaritos mestres
- reconhecimento de PDF
- parsing de questoes
- correcao assistida

PDF e apoio.
Dados estruturados sao o centro.

### 8.1. Central de Provas

Arquivo:
- `public/admin-provas.html`

Papel:
- central operacional

Deve mostrar:
- acoes principais
- mapa das provas
- fila de processamento

Nao deve mostrar:
- hub generico
- card “Hub”
- card “Resultados”
- excesso de resumo inutil

Tom visual:
- operacional
- premium
- limpo
- direto

### 8.2. Lista de Provas

Arquivo:
- `public/admin-provas-lista.html`

Papel:
- localizar prova rapidamente
- abrir gabarito, PDF, montagem e correcao

### 8.3. Criar Prova

Arquivo:
- `public/admin-provas-criar.html`

Papel:
- cadastro do cabecalho da prova
- metadados principais

### 8.4. Montagem

Arquivo:
- `public/admin-provas-montagem.html`

Papel:
- montar prova a partir do banco de questoes

### 8.5. Banco de Questoes

Arquivo:
- `public/admin-banco-questoes.html`

Papel:
- base mestre das questoes

### 8.6. Editor de Questao

Arquivo:
- `public/admin-questao-editar.html`

Papel:
- editar questao mestre

### 8.7. Gabaritos

Arquivo:
- `public/admin-gabaritos.html`

Papel:
- cadastro mestre da prova
- identidade forte da prova
- gabarito por questao
- configuracao de correcao

Secoes principais esperadas:
- A. Identificacao da prova
- B. Configuracao da correcao
- C. Itens do gabarito

### 8.8. Importacao

Arquivo:
- `public/admin-importacao.html`

Papel:
- upload real do PDF
- analise
- matching da prova
- sugestao de vinculo
- parsing de questoes
- confirmacao manual

Secoes principais esperadas:
- upload
- fila de importacoes
- detalhe da importacao
- sinais detectados
- match candidates
- texto extraido
- questoes parseadas
- logs

### 8.9. Correcao

Arquivo:
- `public/admin-correcao.html`

Papel:
- fila operacional de correcao

### 8.10. Detalhe da Correcao

Arquivo:
- `public/admin-correcao-detalhe.html`

Papel:
- revisar resposta
- confirmar nota
- registrar decisao

### 8.11. Resultados

Arquivo:
- `public/admin-resultados.html`

Papel:
- historico e consolidado de resultados

Observacao:
- essa tela existe, mas nao deve ser o foco visual da central

---

## 9. Componentes recorrentes que o Stitch deve respeitar

Componentes padrao do sistema:
- header com conta conectada
- menu lateral/painel de menu
- hero de pagina com titulo forte
- nav secundaria do modulo
- panels escuros
- cards discretos
- listas operacionais
- formularios com visual escuro
- status badges
- pills
- inline actions
- estados de feedback

---

## 10. Molde de design que o Stitch deve seguir

Use esta estrutura:

### Header
- fino
- elegante
- com conta e menu

### Hero
- titulo forte
- subtitulo curto
- CTA principal quando fizer sentido

### Navegacao secundaria
- compacta
- horizontal
- visual de subnav premium

### Corpo principal
- listas operacionais em vez de muitos cards
- quando houver card, que seja compacto
- menos descricoes longas
- mais leitura por layout

### Formularios
- agrupados por secao
- labels claros
- grid respirado
- campos escuros
- botoes bem separados

### Estados
- loading elegante
- vazio elegante
- erro claro
- sucesso sutil

---

## 11. Prompt-base para colar no Stitch

```text
Quero redesenhar todas as telas do sistema Start-5 mantendo a logica existente.

Importante:
- redesenhar somente a interface
- nao alterar funcoes
- nao alterar IDs
- nao alterar data-attributes
- nao alterar endpoints
- nao alterar nomes de campos usados pelo JavaScript
- nao alterar backend

Direcao visual:
- dark premium
- moderno
- elegante
- limpo
- menos cards genericos
- menos cara de dashboard template
- mais composicao editorial e operacional
- melhor hierarquia tipografica
- melhor espacamento
- bordas suaves
- contraste refinado

Estrutura:
- produto principal com Inicio, Painel, Questoes, Redacao, Rotina e Perfil
- admin principal como hub
- modulo de provas separado em varias paginas

No modulo de provas:
- Central de Provas deve ser operacional, nao um dashboard generico
- gabarito e o registro mestre da identidade da prova
- PDF e apoio, nao base principal
- importacao deve parecer fluxo real de operacao
- gabaritos e importacao devem ter secoes claras e profissionais

Quero propostas de layout e design system visual para essas telas, preservando toda a estrutura funcional existente.
```

---

## 12. Como usar com seguranca

O melhor fluxo e:

1. Passar para o Stitch este arquivo.
2. Passar screenshots atuais das telas.
3. Passar os HTMLs das telas principais.
4. Passar o CSS base visual.
5. Dizer explicitamente que ele nao deve mudar IDs nem estrutura funcional.
6. Receber de volta apenas proposta visual/layout.
7. Aplicar manualmente no projeto com cuidado.

---

## 13. Arquivos mais importantes para mandar como contexto

Produto principal:
- `public/index.html`
- `public/dashboard.html`
- `public/questoes.html`
- `public/redacao.html`
- `public/rotina.html`
- `public/profile.html`

Admin:
- `public/admin.html`
- `public/admin-email.html`
- `public/admin-perfil.html`

Modulo de provas:
- `public/admin-provas.html`
- `public/admin-provas-lista.html`
- `public/admin-provas-criar.html`
- `public/admin-provas-montagem.html`
- `public/admin-banco-questoes.html`
- `public/admin-questao-editar.html`
- `public/admin-gabaritos.html`
- `public/admin-importacao.html`
- `public/admin-correcao.html`
- `public/admin-correcao-detalhe.html`
- `public/admin-resultados.html`

CSS principal:
- `public/css/global.css`
- `public/css/admin.css`
- `public/css/admin-proof-center.css`
- `public/css/dashboard.css`
- `public/css/redacao.css`
- `public/css/rotina.css`

Nao mandar como base para redesign funcional:
- `server.js`
- `backend/proof_center/*`
- lógicas de API

