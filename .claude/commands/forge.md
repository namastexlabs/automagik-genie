# /forge – Wish Breakdown & PSAP Planning

---
description: Analisa um wish aprovado, propõe grupos de execução para voz PagBank, coleta aprovação humana e registra plano detalhado ligado a tasks/PSAP-XXX.
---

[CONTEXT]
- Utilize após o wish em `.genie/wishes/<slug>-wish.md` receber sinal verde (`Status: APPROVED`).
- Objetivo: transformar arquitetura em grupos executáveis, apontando artefatos `tasks/PSAP-XXX/qa/` e responsáveis.
- Não cria branches automaticamente; pode opcionalmente acionar integrações (vibe-kanban, automagik) após aprovação explícita.

[SUCCESS CRITERIA]
✅ Plano salvo em `.genie/state/reports/forge-plan-<wish-slug>-<timestamp>.md`
✅ Cada grupo referencia entradas (`@`), entregáveis e evidências esperadas (avaliador, métricas, relatórios)
✅ Dependências e bloqueios documentados com caminhos PSAP
✅ Aprovação humana registrada antes de qualquer integração externa
✅ Chat final lista grupos aprovados, responsáveis e link para o plano

[NEVER DO]
❌ Criar tarefas sem aprovação clara
❌ Fragmentar grupos além do necessário ou ignorar dependências
❌ Omitir protocolos de validação (avaliador, métricas)
❌ Alterar wish original durante o processo

```
<task_breakdown>
1. [Discovery] Ler wish, resumir objetivos, restrições e PSAPs envolvidos
2. [Planning] Propor grupos com escopo, entregáveis, validações e responsáveis
3. [Approval] Apresentar plano; iterar até receber confirmação humana
4. [Execution Hooks] Opcionalmente acionar integrações (vibe-kanban/automagik) e registrar IDs
</task_breakdown>
```

## Passo 1 – Discovery
- Ler wish (`.genie/wishes/...`), capturar status, metas, grupos sugeridos.
- Revisar artefatos relevantes: `@agents/conta_digital/v1/prompt.md`, `@tasks/PSAP-XXX/qa/metrics.json`, `@tasks/PSAP-XXX/qa/report.md`.
- Registrar pressupostos e bloqueios existentes.

## Passo 2 – Plano Inicial
- Para cada grupo proposto inclua:
  - **Slug:** curto, kebab-case (ex.: `prompt-adjustments`)
  - **Escopo:** resumo do trabalho
  - **Entradas `@`:** arquivos a consultar antes de editar
  - **Deliverables:** arquivos a alterar/criar (prompt, metrics, report)
  - **Evidence:** comandos (`node .genie/...`), métricas esperadas, QA requerido
  - **Responsible:** agente humano/automático sugerido
  - **Dependencies:** grupos ou aprovações obrigatórias
- Registrar no relatório e compartilhar resumo no chat pedindo aprovação (Sim/Não/Ajustar).

## Passo 3 – Loop de Aprovação
- Atualize o relatório a cada ajuste solicitado pelo humano.
- Após aprovação, registre linha na seção “Approval Log” com timestamp e iniciais.

## Passo 4 – Integrações (Opcional)
- Se humano solicitar, acione ferramentas:
  - `vibe_kanban__create_task` para abrir cartões (um por grupo)
  - `automagik-forge__create_task` caso a stack esteja configurada
- Documente IDs, links e status na seção “Execution Hooks”.
- Se nenhuma integração for usada, apenas liste próximos passos manuais.

## Template de Relatório
```
# Forge Plan – {Wish Slug}
**Gerado em:** 2024-..Z | **Wish:** @.genie/wishes/{slug}.md | **PSAP:** tasks/PSAP-XXX

## Summary
- Objetivo principal, metas métricas, principais riscos

## Proposed Groups
### Group A – prompt-adjustments
- **Scope:** Atualizar `<discovery>` e `<implementation>` para sanar lacunas X
- **Inputs:** @agents/conta_digital/v1/prompt.md, @tasks/PSAP-XXX/qa/transcript_raw.txt
- **Deliverables:** prompt.md atualizado, @agents/conta_digital/versions.json
- **Evidence:** Diff + simulação; avaliador ≥ 80/100
- **Responsible:** humano/agent indicado
- **Dependencies:** nenhuma

### Group B – qa-validation
- ...

## Approval Log
- [timestamp] Aprovado por {inicial}

## Execution Hooks
- (Opcional) Task criada: vibe-kanban #{id}

## Follow-up
- Checklist de próximos passos, riscos remanescentes, decisões a revisitar
```

## Comunicação Final
- Responder com lista numerada de grupos e status (aprovado/pendente).
- Incluir resumo curto dos principais riscos e verificações obrigatórias.
- Referenciar plano: `Forge Plan: @.genie/state/reports/forge-plan-...md`.

Mantenha o plano enxuto, focado em orientar executores PagBank a cumprir o wish com segurança, métricas auditáveis e excelente experiência de voz.
