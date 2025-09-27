# /wish-review – PSAP Wish Completion Audit

---
description: Valida se um wish de voz PagBank foi cumprido, consolidando evidências PSAP, reexecutando avaliações e produzindo relatório com score e próximos passos.
---

[CONTEXT]
- Usado quando um wish em `.genie/wishes/` aparenta concluído e há artefatos em `tasks/PSAP-XXX/qa/` para conferir.
- Deve cruzar resultados do avaliador, métricas (TTFB/ASR/TTS) e diffs de prompt/KB.
- Opera no repositório `pags-11labs`; não cria tarefas nem altera git.

[SUCCESS CRITERIA]
✅ Analisa wish informado, recupera PSAP(s) mencionados e seus artefatos `qa/`
✅ Consolida Death Testaments ou relatórios existentes (quando presentes)
✅ Executa (ou reusa via `--score-only`) comandos padrão de avaliação e métricas
✅ Emite relatório markdown em `tasks/PSAP-XXX/qa/wish-review-<timestamp>.md` com score 0–100, achados e gaps
✅ Chat final destaca pontos críticos e link para relatório; sugere follow-up quando score < 100

[NEVER DO]
❌ Alterar prompts, métricas ou arquivos QA durante auditoria
❌ Ignorar categorias da rubrica (regras, voz, técnico, fluxo)
❌ Atribuir score > 100 ou < 0
❌ Omitir evidências citadas (linhas de transcript, métricas)

[COMMAND SIGNATURE]
```
/wish-review @.genie/wishes/<slug>-wish.md \
    [--psap tasks/PSAP-XXX] \
    [--tests "<cmd>"]... \
    [--score-only]
```
- Primeiro argumento obrigatório: wish com `@`.
- `--psap` restringe auditoria a uma pasta PSAP específica (senão usar todas listadas no wish).
- `--tests` adiciona ou substitui comandos de validação.
- `--score-only` reaproveita resultados pré-existentes (não roda comandos, apenas recompõe score).

[DEFAULT TEST MATRIX]
- `node .genie/cli/agent.js chat evaluator "Score @tasks/PSAP-XXX/qa/transcript_raw.txt using @agents/evaluation/v1/prompt.md; produzir relatório completo" --preset voice-eval`
- `jq '.metrics.ttfb[]' tasks/PSAP-XXX/qa/metrics.json | awk '{sum+=$1; n++} END {print "TTFB médio:", sum/n}'`
- `jq '.metrics.asr.low_confidence' tasks/PSAP-XXX/qa/metrics.json`
- `jq '.metrics.tts.artifacts' tasks/PSAP-XXX/qa/metrics.json`

[PROCESS BREAKDOWN]
1. **Discovery** – Ler wish, identificar PSAP, status e grupos concluídos. Coletar artefatos `@tasks/PSAP-XXX/qa/*`, diffs de prompt e versões.
2. **Validation** – Executar comandos padrão ou fornecidos, armazenar logs sob `tasks/PSAP-XXX/qa/validations/` (criar diretório se necessário).
3. **Scoring** – Aplicar rubrica (40/25/20/15) ajustada por performance (±10). Considerar deduções por voz (artifact, latência), regras, técnica, fluxo.
4. **Recommendation** – Listar gaps, blockers, sugestões (ex.: re-rodar avaliador, ajustar prompt, coletar nova amostra).
5. **Report** – Gerar markdown `tasks/PSAP-XXX/qa/wish-review-<timestamp>.md` com:
   - Wish metadata (status, objetivos)
   - Resumo de mudanças (prompt, KB, versão)
   - Tabela de testes (comandos, resultado, evidência)
   - Score detalhado por categoria + ajuste performance
   - Recomendações e próximos passos necessários antes de marcar wish como COMPLETED

[REPORT TEMPLATE]
```
# Wish Review – {Wish Slug}
**Data:** 2024-..Z | **PSAP:** tasks/PSAP-XXX | **Status do wish:** {status}

## Resultados dos Testes
| Comando | Resultado | Evidência |
| --- | --- | --- |
| `node .genie/...` | ✅ | @tasks/PSAP-XXX/qa/report.md |

## Scoring
- Regras: 32/40 (evidências linha XX)
- Voz: 18/25 (TTFB médio 1620ms – acima do alvo)
- Técnico: 17/20
- Fluxo: 14/15
- Ajuste de performance: -5 (TTFB >1500ms)
- **Score final:** 76/100

## Achados
- ...

## Recomendações
1. ...

## Evidências Registradas
- @tasks/PSAP-XXX/qa/metrics.json
- @tasks/PSAP-XXX/qa/report.md
- Diff: @agents/conta_digital/v1/prompt.md
```

[NOTES]
- Sempre use `node .genie/cli/agent.js ... --preset voice-eval` para avaliações rápidas.
- Se múltiplos PSAP forem afetados, gere seção por PSAP e score agregado.
- Quando faltarem artefatos essenciais, atribua bloqueio e peça geração antes de concluir.
- Lembre o humano de atualizar `@agents/conta_digital/versions.json` caso o wish implique nova versão.
