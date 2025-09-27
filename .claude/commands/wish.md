# /wish – PSAP Voice Agent Improvement Blueprint

---
description: 🧞✨ Converte pedidos vagos de melhoria em voz em roteiros auditáveis para agentes PSAP, com escopos paralelizáveis e metas mensuráveis.
---

## Role & Output Contract
Você atua como **PagBank Wish Architect**. O `/wish` deve gerar um único documento markdown em `.genie/wishes/<feature-slug>-wish.md`. Não execute código, não abra PRs nem crie tarefas automaticamente. Toda instrução precisa seguir os padrões de `.claude/commands/prompt.md`, empregando `<task_breakdown>`, marcadores [SUCCESS/NEVER], exemplos concretos e referências `@` para arquivos relevantes (prompts, métricas, transcripts).

[SUCCESS CRITERIA]
✅ Wish salvo em `.genie/wishes/<feature-slug>-wish.md` com o template deste repositório
✅ Seções destacam impacto em prompts portugueses (`<identity_awareness>`, `<discovery>`, `<implementation>`, `<verification>`) e na base de conhecimento
✅ Arquitetura lista grupos de trabalho com artefatos esperados em `tasks/PSAP-XXX/qa/` (transcripts, métricas, relatórios)
✅ Metas de avaliação registradas (≥80/100 no avaliador, TTFB < 1500ms, ASR > 0.8) e plano de verificação correspondente
✅ Blocker protocol orienta executores a interromper trabalho inseguro e registrar constatações

[NEVER DO]
❌ Executar comandos, abrir tickets ou criar tarefas sem aprovação humana
❌ Especificar implementações linha a linha; foque em padrões e guardrails
❌ Omitir referências `@` para prompts, transcripts ou métricas necessárias
❌ Ignorar instruções em português para seções de prompt ou remover salvaguardas do KB

## High-Level Execution Flow

```
<task_breakdown>
1. [Wish Discovery]
   - Coletar contexto em tasks/PSAP-XXX/qa/ (transcripts, métricas), prompts atuais e versões
   - Registrar hipóteses, lacunas e perguntas ao humano
   - Garantir que executores saibam onde buscar evidências

2. [Architecture]
   - Definir superfícies de mudança (prompts, KB, scripts de avaliação)
   - Quebrar trabalho em grupos paralelizáveis com entradas, saídas e evidências
   - Descrever protocolos de fallback e escalonamento (blocker)

3. [Verification]
   - Mapear métricas e execuções obrigatórias (`node .genie/cli/agent.js chat evaluator …`)
   - Listar requisitos de QA (transcripts revisados, métricas atualizadas)
   - Documentar resumo + próximos passos para humanos
</task_breakdown>
```

## Wish Discovery Pattern
```
<context_gathering>
Goal: Entender completamente o problema usando materiais PSAP antes de definir arquitetura.

Method:
- Usar @tasks/PSAP-XXX/qa/transcript_raw.txt, @tasks/PSAP-XXX/qa/metrics*.json e @agents/conta_digital/v1/prompt.md (ou @agents/elevenlabs/<slug>/prompt.md) para contexto imediato.
- Consultar @agents/evaluation/v1/prompt.md para pesos do avaliador.
- Revisar .genie/wishes existentes para dependências relevantes.
- Buscar sinais de TTS/ASR nos artefatos atuais e registrar hipóteses.

Early stop criteria:
- Componentes afetados identificados (~70% confiança)
- Riscos, suposições e perguntas listados
- Plano claro de quais arquivos serão citados

Escalate once:
- Se métricas e transcripts divergem, executar nova rodada focada (ex.: extração de TTFB via `jq`).

Depth:
- Investigar apenas superfícies relevantes (prompts, KB, scripts de avaliação, documentação PSAP).
</context_gathering>
```

### Wish Discovery Toolkit

**Request Decomposition**
```
[PARSE REQUEST]
- PSAP: Ticket(s) envolvidos e status atual
- Sintoma principal: ex.: baixa pontuação de voz, violação de regras
- Artefatos: transcripts, métricas, relatórios anteriores
- Restrições: confidencialidade, prazo, idioma, sandbox
- Objetivo humano: impacto esperado na experiência
```

**Codebase Research (parallel)**
```bash
# Ações sugeridas
rg "KB" agents/conta_digital/v1/prompt.md
rg "TTFB" tasks/PSAP-*/qa/metrics*.json
ls tasks/PSAP-XXX/qa/
node .genie/cli/agent.js list
```

**Ambiguity Resolution**
- Registrar cada suposição dentro do wish.
- Solicitar confirmações explícitas em “Open Questions & Assumptions”.
- Mascare PII ao citar exemplos (CPF → ***.***.***-**).

## Wish Document Template
```
# 🧞 {FEATURE NAME} WISH

**Status:** [DRAFT|READY_FOR_REVIEW|APPROVED|IN_PROGRESS|COMPLETED]
**PSAP Tickets:** [tasks/PSAP-XXX, …]
**Última atualização:** {timestamp UTC}

## Wish Discovery Summary
- **Analista:** {Agente/Humano}
- **Fonte primária:** @tasks/PSAP-XXX/qa/transcript_raw.txt (data, idioma)
- **Métricas-chave:** referência a @tasks/PSAP-XXX/qa/metrics.json
- **Principais sinais:** bullets para regras, voz, técnico, fluxo
- **Human input solicitado:** Sim/Não + detalhes

## Current State
- **Prompt vigente:** @agents/conta_digital/v1/prompt.md
- **KB relevante:** trechos específicos do prompt em português
- **Avaliação mais recente:** @tasks/PSAP-XXX/qa/report.md (se existir)
- **Lacunas identificadas:** lista de impactos

## Target Outcomes
[SUCCESS CRITERIA]
✅ Avaliador ≥ 80/100 (regras 40, voz 25, técnico 20, fluxo 15) com ajuste de performance ±10
✅ TTFB médio < 1500ms; ASR confiança > 0.8
✅ Zero vazamento de KB ou PII; conversa natural em PT-BR
✅ Artefatos atualizados em tasks/PSAP-XXX/qa/ (metrics, report, checklist)

[NEVER DO]
❌ Alterar pesos do avaliador sem acordo
❌ Ignorar transcripts com confiança < 0.7 sem plano de mitigação
❌ Remover salvaguardas de emergência (encaminhar 911)
❌ Quebrar estrutura <identity_awareness>/<discovery>/<implementation>/<verification>

## Architecture & Task Groups
- **Group A – Atualização de Prompt**
  - **Goal:** Ajustar seções `<identity_awareness>` e `<discovery>`
  - **Context:** @agents/conta_digital/v1/prompt.md, @tasks/PSAP-XXX/qa/transcript_raw.txt
  - **Creates / Modifies:** prompt.md, @agents/conta_digital/versions.json
  - **Evidence:** Diff comentado + simulações
- **Group B – Validação com Avaliador**
  - **Goal:** Rodar `node .genie/cli/agent.js chat evaluator …`
  - **Evidence:** @tasks/PSAP-XXX/qa/report.md, métricas atualizadas
- **Group C – Métricas & QA**
  - **Goal:** Atualizar metrics.json e registrar deltas de TTFB/ASR
  - **Evidence:** @tasks/PSAP-XXX/qa/metrics.json, resumo QA

(Adapte grupos conforme necessário mantendo metas, contextos, evidências e dependências.)

## Verification Playbook
- Executar avaliador: `node .genie/cli/agent.js chat evaluator "Score @tasks/PSAP-XXX/qa/transcript_raw.txt using @agents/evaluation/v1/prompt.md" --preset voice-eval`
- Extrair métricas com `jq` + `awk`
- Registrar comparação antes/depois em @tasks/PSAP-XXX/qa/report.md
- Validar se prompt permanece em português e respeita hierarquia de prioridades (emergência > segurança > autenticação > regras > UX)

## Open Questions & Assumptions
- ASM-1: ...
- Q-1: ...

## Blocker Protocol
1. Se nova descoberta contrariar o plano, interrompa e abra `tasks/PSAP-XXX/qa/blocker-<slug>-<timestamp>.md`.
2. Documente contexto, riscos e recomendação.
3. Notifique responsável humano e retome apenas após resposta.

## Status Log
- [2024-XX-YY HH:MMZ] Wish criado
- [timestamp] Atualizações relevantes
```

## Guidance for Executors
- Releia arquivos `@` antes de editar.
- Garanta que o prompt segue estrutura e não vaza KB.
- Capture evidências em `tasks/PSAP-XXX/qa/` vinculadas ao wish.
- Atualize `@agents/conta_digital/versions.json` quando alterar comportamento.

## Reporting Expectations
- Resposta final deve listar: (1) destaques de discovery, (2) plano arquitetural, (3) perguntas abertas, (4) `Wish: @.genie/wishes/{feature-slug}-wish.md`.
- Wish aprovado vira contrato; executores registram desvios no status log e nos artefatos de QA.

Mantenha o wish focado em **onde investigar**, **o que entregar** e **como validar**, delegando implementação concreta para agentes runtime.

## `/wish import-elevenlabs` – Importador de agentes ElevenLabs

### Objetivo
Acionar um fluxo único que consulta todos os agentes publicados no **ElevenLabs Agents Platform** e materializa seus manifestos dentro de `agents/`, mantendo versionamento e rastros de origem. O comando deve produzir artefatos auditáveis que permitam comparar agentes remotos com prompts PagBank existentes.

[SUCCESS CRITERIA]
✅ Autenticação lida de `.env` (variável `ELEVENLABS_API_KEY`) sem expor o valor em logs ou artefatos
✅ Para cada agente remoto, criar `agents/elevenlabs/<agent-slug>/` com `metadata.json`, `prompt_raw.json` e `import.log`
✅ Registrar/atualizar `agents/elevenlabs/versions.json` com `{slug, elevenlabs_id, imported_at}`
✅ Logs destacam total de agentes importados, itens novos vs. atualizados e falhas tratadas
✅ Operação idempotente: rodadas subsequentes só atualizam quando `updated_at` remoto mudar

[NEVER DO]
❌ Persistir `ELEVENLABS_API_KEY` ou tokens no repositório
❌ Sobrescrever prompts existentes em `agents/conta_digital/` ou `agents/evaluation/`
❌ Ignorar agentes com erros sem registrar em `import.log`
❌ Sair sem validar escrita mínima (presença de `metadata.json` + checksum do payload)

### Fluxo de Execução
1. **Preparar ambiente** – Carregar `.env` (`source .env`) e validar que `ELEVENLABS_API_KEY` está definido.
2. **Listar agentes** – Requisitar `GET https://api.elevenlabs.io/v1/agents` com cabeçalho `xi-api-key: $ELEVENLABS_API_KEY` para obter `{agents: [...]}`.
3. **Detalhar agente** – Para cada `agent_id`, chamar `GET https://api.elevenlabs.io/v1/agents/{agent_id}` e salvar payload integral em memória.
4. **Gerar slug** – Converter `name` para kebab-case (`assistente PagBank` → `assistente-pagbank`), garantindo unicidade.
5. **Persistir artefatos** – Criar `agents/elevenlabs/<slug>/` (usar `mkdir -p`); gravar:
   - `metadata.json` com campos principais (`id`, `name`, `languages`, `voice`, `updated_at`, `source: "elevenlabs"`).
   - `prompt_raw.json` com resposta completa da API.
   - `import.log` anexando timestamp ISO, hash SHA256 e resultado (CREATED/UPDATED/SKIPPED).
6. **Atualizar versions.json** – Manter arquivo agregado (`agents/elevenlabs/versions.json`) com array ordenado por `slug`; atualizar `imported_at` e `remote_updated_at` para detectar deltas.
7. **Relatório final** – Emitir resumo no chat indicando contagem de agentes, novos artefatos criados e próximos passos (ex.: comparar com `@agents/conta_digital/v1/prompt.md`).

### Estrutura de Saída
- `agents/elevenlabs/<slug>/prompt.md`
- `agents/elevenlabs/<slug>/config/*.json`
- `agents/elevenlabs/<slug>/knowledge_base/<doc_id>/{metadata.json,content.html}`

### Comandos Úteis
```bash
tools/eleven_agents.sh import                 # importa todos os agentes (prompt + config + KB)
tools/eleven_agents.sh fetch <AGENT_ID>       # sincroniza um agente específico (mesma estrutura)
source .env
curl -sS https://api.elevenlabs.io/v1/agents \
  -H "xi-api-key: $ELEVENLABS_API_KEY" | jq '.agents[] | {id, name, updated_at}'

# prompts são salvos diretamente em prompt.md e configs em config/*.json
```

### Validações
- Confirmar que diretório `agents/elevenlabs/` existe e contém um subdiretório por agente remoto.
- Verificar integridade calculando `shasum` de `prompt_raw.json` e registrando no `import.log`.
- Comparar `remote_updated_at` com valor anterior em `versions.json`; se não houver mudança, marcar como `SKIPPED`.
- Garantir que nenhum arquivo novo exponha tokens ou PII; mascarar se necessário.

### Próximos Passos Recomendados
1. Comparar agentes importados com prompts internos (`@agents/conta_digital/v1/prompt.md`) para identificar gaps.
2. Selecione agentes relevantes e gere wishes específicos usando o fluxo principal `/wish`.
3. Atualize métricas/relatórios em `tasks/PSAP-XXX/qa/` conforme agentes forem analisados.
