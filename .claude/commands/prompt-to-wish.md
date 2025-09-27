# /prompt-to-wish – PSAP Living Document Workflow

---
description: 🎯 Constrói documento vivo a partir de pedidos informais para chegar a wishes PagBank completos alinhados a PSAP.
---

## 🚀 Fluxo Geral

```
<task_breakdown>
1. [Criação] Iniciar documento de preparação com dados fornecidos
2. [Investigação] Registrar achados (transcripts, métricas, prompts)
3. [Diálogo] Capturar decisões com o humano em tempo real
4. [Consolidação] Validar checklist e converter em wish definitivo
</task_breakdown>
```

## Fase 1 – Criação do Documento
- Ao receber pedido (ex.: “Melhorar tom do agente no PSAP-990”), criar `.genie/prep/wish-prep-<slug>.md`.
- Preencher seções iniciais usando referências `@` para artefatos relevantes.

### Estrutura Inicial
```
# Wish Preparation: {Feature}
**Status:** INVESTIGATING
**Criado:** {timestamp UTC}
**Última atualização:** {timestamp UTC}

<task_breakdown>
1. [Analysis] Entender sintomas
2. [Discovery] Mapear arquivos relevantes
3. [Planning] Listar decisões pendentes
</task_breakdown>

@tasks/PSAP-XXX/qa/transcript_raw.txt
@tasks/PSAP-XXX/qa/metrics.json
@agents/conta_digital/v1/prompt.md

## STATED REQUIREMENTS
- REQ-1: (extraído da solicitação)

## SUCCESS TARGETS
- ≥80/100 no avaliador
- TTFB < 1500ms | ASR > 0.8

## NEVER DO
- ❌ Citar base de conhecimento
- ❌ Ignorar protocolos de emergência

## INVESTIGATION LOG
- [{timestamp}] Documento criado
```

## Fase 2 – Investigação Contínua
- Marcar buscas em listas de verificação e inserir insights com `@`.
- Exemplo:
```
<context_gathering>
Goal: Encontrar trechos com voz robótica
Status: IN_PROGRESS

Searches:
- [x] rg "robô" @tasks/PSAP-990/qa/transcript_raw.txt
- [ ] Ler métricas TTS em @tasks/PSAP-990/qa/metrics.json

Found patterns:
- Linha 45 – resposta mecânica

Early stop: Não atingido
</context_gathering>
```
- Documentar decisões emergentes como DEC-1, ASM-1.

## Fase 3 – Diálogo com Humano
- Quando perguntas surgirem, registre e, após resposta, mova para “CONFIRMED DECISIONS”.
- Utilize checklist para garantir fechamento:
```
## OPEN QUESTIONS
- Q-1: Ajustar `<implementation>` ou `<discovery>` primeiro?

## CONFIRMED DECISIONS
- DEC-1: Ajustar `<discovery>` com perguntas sobre app (confirmado 12:03Z)
- ASM-1: Manter respostas com 1–2 frases (confirmado 12:05Z)
```

## Fase 4 – Pronto para Wish
- Atualizar status para `READY_FOR_WISH` quando checklist abaixo for satisfeito:
```
[CHECKLIST]
- [x] Todas DEC-* resolvidas
- [x] Sucessos e Never-do definidos
- [x] Referências `@` validadas
- [x] Artefatos PSAP confirmados
- [x] Plano de verificação descrito
```
- Registrar log: `[{timestamp}] Checklist completo, pronto para wish.`

### Conversão
- Ao comando do humano, gerar wish com `/wish` usando conteúdo consolidado.
- Atualizar documento para `Status: WISH_CREATED` e linkar o wish (`Wish: @.genie/wishes/<slug>-wish.md`).

## Benefícios
- Mantém trilha de decisões, facilitando auditoria PSAP.
- Permite pausar/resumir sem perder contexto.
- Garante alinhamento com limites de voz PagBank (PT-BR, sem vazamento KB, metas mensuráveis).

## Boas Práticas
- Atualize sempre a seção “INVESTIGATION LOG” com timestamp + ação.
- Destaque trechos críticos do prompt com bloco de código para revisão.
- Use máscaras em exemplos (CPF → ***.***.***-**).
- Se faltar artefato essencial (metrics, transcript, report), marque blocker e informe humano.

## Ciclo de Status
1. **INVESTIGATING** – coleta inicial
2. **NEEDS_DECISIONS** – perguntas abertas pendentes
3. **CONFIRMING** – aguardando confirmações finais
4. **READY_FOR_WISH** – pronto para gerar wish
5. **WISH_CREATED** – wish gerado, documento serve como histórico

Mantenha o documento vivo até que o wish seja aprovado e executores possam consultá-lo como referência histórica.
