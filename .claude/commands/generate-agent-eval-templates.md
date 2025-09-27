# Prompt: Gerar Templates de Avaliação por Agente (ElevenLabs)

<identity_awareness>
Você é um avaliador/gerador de templates para agentes de voz PagBank. Sua tarefa é criar, para CADA pasta em `agents/elevenlabs/<slug>/`, dois arquivos padronizados:
- `evaluation-template-v1.md`
- `qa-call-script-v1.md`

Use como base e inspiração:
- @.claude/commands/prompt.md (framework de prompting e critérios)
- @templates/task-eval-objectives.md (template completo de objetivos, métricas e critérios)
</identity_awareness>

<task_breakdown>
1) [Discovery]
   - Enumerar todas as pastas em `agents/elevenlabs/` (exceto `versions.json`).
   - Para cada `<slug>`, verificar se existem `prompt.md` e `knowledge_base/` com conteúdo.
   - Classificar domínio pelo slug: acquisition | cards | digital-account | investments | pagbank-agent | fallback | transferencia | encerramento | test-resume-steps | prod | qa | prompt | deprecated.

2) [Implementation]
   - Gerar `evaluation-template-v1.md` contendo:
     - Referências de auto-contexto: `@prompt.md`, `@knowledge_base/*` (se ausente, registrar MISSING e instruções de correção).
     - Cabeçalho com `<slug>` e tags do domínio.
     - Seções mínimas: Contexto do Agente; Checklist de Contexto; Metas Específicas (derivadas do domínio); Rubrica (regras 40 / voz 25 / técnica 20 / fluxo 15 ±10); Métricas (jq/awk úteis); Success/Failure; Saída JSON; Recomendações de prompt.
     - Incluir referência explícita a `@templates/task-eval-objectives.md` como baseline para metas.
   - Gerar `qa-call-script-v1.md` contendo:
     - Referências `@prompt.md`, `@knowledge_base/*` e `@.genie/agents/evaluator.md`.
     - Roteiro de 8–10 passos em PT‑BR, com: saudação e objetivo, 2–3 tópicos de domínio, interrupção/barge-in, erro controlado, teste PII/segurança, teste de protocolo (quando aplicável), encerramento.
     - Observações de métricas (TTFB, ASR) e artefatos a salvar em `tasks/PSAP-XXX/qa/`.

3) [Verification]
   - Confirmar criação dos arquivos em todas as pastas.
   - Para agentes sem KB/prompt, marcar claramente em `evaluation-template-v1.md` a necessidade de adicionar contexto e refazer a avaliação.
   - Não alterar prompts dos agentes; apenas criar templates.
</task_breakdown>

<success_criteria>
✅ Cada agente em `agents/elevenlabs/*/` possui `evaluation-template-v1.md` e `qa-call-script-v1.md`.
✅ Templates em PT‑BR, com referências `@` e rubrica padronizada.
✅ Domínio/variante inferidos do slug e refletidos nas metas.
✅ Gaps de contexto sinalizados como MISSING com instruções objetivas.
✅ Nenhum vazamento de fontes/KB nos exemplos.
</success_criteria>

<never_do>
❌ Deletar ou editar `prompt.md` dos agentes.
❌ Incluir segredos ou PII.
❌ Sair do padrão de nomes de arquivo.
</never_do>

<output_format>
- Criar/atualizar arquivos: `agents/elevenlabs/<slug>/evaluation-template-v1.md` e `agents/elevenlabs/<slug>/qa-call-script-v1.md`.
- Padrão de conteúdo:
  - Títulos e bullets concisos.
  - Referências `@` para auto-carregamento.
  - Rubrica com pesos definidos e JSON de resumo.
  - Comandos `jq/awk` para métricas quando disponíveis.
</output_format>

<domain_guidance>
- acquisition: captação de lead, próximos passos, sem coletar PII sensível por voz.
- cards: ativação/limites/2ª via/segurança; nunca pedir nº de cartão; canal seguro.
- digital-account: saldo/extrato/Pix/limites; protocolo apenas ao final e por e‑mail; insistência → tipificação/transferência.
- investments: % do CDI, liquidez, riscos, adequação; sem aconselhar valores.
- fallback/transferencia/encerramento/test-resume-steps: priorizar handoff, encerramento correto e retomada após interrupções.
- pagbank-agent: generalista; manter regras universais e boa experiência.
</domain_guidance>

<run>
- Remover templates legados em `templates/voice-eval/` (se existirem).
- Executar geração para todos os agentes.
- Listar sumário final com contagem e gaps de contexto por agente.
</run>
