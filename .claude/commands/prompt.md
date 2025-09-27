# Advanced Prompting Framework – PagBank Voice Agents

## Task Decomposition Pattern
Adote sempre o padrão Discovery → Implementation → Verification alinhado às necessidades de voz PagBank:

```
<task_breakdown>
1. [Discovery] Identificar componentes afetados
   - Prompts importados em `agents/elevenlabs/<slug>/prompt.md` (produção: `digital-account-dale`)
   - Rubricas em `.genie/agents/evaluator.md`
   - Artefatos em `tasks/PSAP-XXX/qa/`

2. [Implementation] Planejar alterações
   - Atualizações em prompts portugueses (respeitar seções `<identity_awareness>`, `<discovery>`, `<implementation>`, `<verification>`)
   - Ajustes em KB ou versões (quando aplicável)
   - Scripts ou ferramentas em `.genie/cli/`

3. [Verification] Definir validações
   - `node .genie/cli/agent.js chat evaluator ...`
   - Métricas TTFB/ASR/TTS em `tasks/PSAP-XXX/qa/metrics*.json`
   - Relatórios atualizados `tasks/PSAP-XXX/qa/report.md`
</task_breakdown>
```

## Auto-Context Loading com `@`
Utilize referências `@` para carregar contexto automaticamente:

```
[TASK]
Ajustar prompt para melhorar autenticação
  @agents/elevenlabs/digital-account-dale/prompt.md
@tasks/PSAP-990/qa/transcript_raw.txt
@tasks/PSAP-990/qa/metrics.json
```

Casos frequentes:
- `@.genie/agents/evaluator.md` – pesos e formato do avaliador
- `@tasks/PSAP-*/qa/transcript_raw.txt` – múltiplos transcripts para comparação
- `@.genie/wishes/*.md` – histórico de wishes anteriores

## Success / Failure Boundaries

```
[SUCCESS CRITERIA]
✅ Respeitar pesos: regras 40, voz 25, técnico 20, fluxo 15 (±10 performance)
✅ Prompts em português natural, sem citar “base de conhecimento”
✅ TTFB médio < 1500ms, ASR > 0.8 nas métricas
✅ Artefatos PSAP atualizados (metrics, report, transcripts simulados)

[NEVER DO]
❌ Expor trechos ou nomes da KB
❌ Ignorar protocolos de emergência/segurança
❌ Remover a estrutura `<identity_awareness>` ... `<verification>`
❌ Aceitar transcripts com confiança < 0.7 sem plano de mitigação
```

## Exemplos Concretos (Português)

**Inadequado:**
```
"Segundo nossa base de conhecimento, você deve resetar sua senha..."
```

**Adequado:**
```markdown
<implementation>
Para orientações de senha:
- Confirme se é acesso ao app PagBank
- Instrua a abrir o app e tocar em “Esqueci minha senha”
- Ofereça ajuda adicional sem citar fontes internas
</implementation>
```

**Trecho de verificação:**
```markdown
<verification>
- Nunca mencione "base", "KB" ou "conhecimento"
- Se TTFB > 1500ms, informe equipe e registre em tasks/PSAP-XXX/qa/metrics.json
- Se ASR < 0.6, peça para repetir com educação e anote em relatório
</verification>
```

## Extração de Métricas

```bash
# Média de TTFB para respostas do agente
jq '.transcript[] | select(.type=="agent") | .ttfb' tasks/PSAP-990/qa/conversation.json |
  awk '{sum+=$1; n++} END {print "TTFB médio:", sum/n, "ms"}'

# Contar turns com ASR baixa
jq '.transcript[] | select(.type=="user") | .asr_confidence' tasks/PSAP-990/qa/conversation.json |
  awk '{if($1<0.7) low++} END {print "Low-confidence turns:", low}'
```

## Reasoning Effort Levels (Voice Agents)

```
low:
  use_for: "Revisões simples de transcript ou métricas"
  tool_budget: 2-3
  prompt: |
    <context_gathering>
    - Buscar contexto mínimo
    - Responder rápido com o que tiver
    - Declarar incerteza se necessário
    </context_gathering>

medium:
  use_for: "Avaliação padrão, ajustes de prompt" (default)
  tool_budget: 5-10
  prompt: |
    <context_gathering>
    - Abrir com visão geral
    - Focar em trechos relevantes do prompt e transcript
    - Parar ao atingir ~70% de confiança
    </context_gathering>

high:
  use_for: "Depuração complexa, múltiplos PSAPs"
  prompt: |
    <persistence>
    - Investigar até fechar todos os gaps
    - Documentar suposições e validar
    - Registrar métricas antes/depois
    </persistence>
```

## Context Gathering Optimization
```
<maximize_context_understanding>
Goal: Reunir contexto suficiente para agir sem desperdiçar tempo.

Método:
- Inicie com @agents/elevenlabs/*/prompt.md e @tasks/PSAP-XXX/qa/*
- Paralelize buscas com `rg` focando termos (ex.: "emergência", "latência")
- Pare quando puder nomear a seção do prompt a alterar ou a métrica a corrigir

Depth Control:
- Analise apenas símbolos/trechos diretamente afetados
- Evite expandir para prompts que não serão tocados
</maximize_context_understanding>
```

## Tool Preambles
- Antes de sequências de comandos, avise: “Vou revisar transcript e métricas, depois comparar prompt.”
- Agrupe ações relacionadas em uma única mensagem curta.
- Atualize progresso (“Transcripts lidos, agora ajustando plano de teste”).

## Regras de Edição
```
<code_editing_rules>
- Clareza e simplicidade primeiro
- Prompts sempre em PT-BR com seções padrão
- Comentários apenas quando evitam ambiguidade relevante
- Mantenha estrutura existente; minimize churn
</code_editing_rules>
```

## Checklist do Agente de Produção
- [ ] Instruções sem contradições; hierarquia (emergência > segurança > autenticação > regras > UX)
- [ ] Exemplos concretos em PT-BR para cada cenário crítico
- [ ] `@` referências para transcripts, métricas, relatórios
- [ ] TTFB < 1500ms e ASR > 0.8 monitorados
- [ ] Sem vazamento de KB ou PII
- [ ] Wish/planos atualizados em `.genie/wishes/` e `tasks/PSAP-XXX/qa/`

## Padrão de Relatório
- Respostas com bullets curtos, listando achados → riscos → próximos passos
- Referencie caminhos com backticks (`tasks/PSAP-990/qa/metrics.json`)
- Sugira próximos passos somente quando houver opções claras, numeradas

Use este framework para manter consistência, segurança e velocidade ao projetar melhorias para o ecossistema de voz PagBank.
