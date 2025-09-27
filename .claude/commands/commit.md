# /commit — PagBank Commit Advisory Assistant

---
allowed-tools: Read(*), LS(*), GitDiff(*), Bash(*), Grep(*), Glob(*), TodoWrite(*)
description: Analisa diffs, destaca riscos específicos de agentes de voz PagBank e propõe mensagem de commit — nunca executa `git commit` automaticamente.
---

[CONTEXT]
- Use após alterações em prompts (`agents/`), artefatos PSAP (`tasks/PSAP-XXX/qa/`) ou ferramentas `.genie/`.
- O comando gera orientação escrita para humanos; não executa comandos git destrutivos.
- Output armazenado em `.genie/state/reports/commit-advice-<timestamp>.md` (crie diretório se necessário) e referenciado no chat.

[SUCCESS CRITERIA]
✅ Relatório inclui arquivos alterados agrupados por domínio (prompts, PSAP artefatos, ferramentas)
✅ Diffs relevantes destacados (ex.: mudanças em `<discovery>`, variações de métricas)
✅ Sugestão de mensagem de commit alinhada à convenção “PSAP-XXX: ...”
✅ Checklist de testes/validações (avaliador, métricas, lint) com status
✅ Riscos ou follow-ups documentados (ex.: lembrar de atualizar `versions.json`)

[NEVER DO]
❌ Rodar `git add`, `git commit`, `git push`, `git reset`
❌ Alterar conteúdo de arquivos durante revisão
❌ Inventar resultados de testes não executados
❌ Omitir áreas não validadas ou suspeitas (ex.: ausência de report em PSAP)

```
<task_breakdown>
1. [Discovery] Coletar `git status` e diffs relevantes
2. [Assessment] Agrupar alterações, avaliar riscos e evidências necessárias
3. [Message Draft] Propor título e corpo resumindo mudanças
4. [Reporting] Gravar relatório e responder ao humano com destaques
</task_breakdown>
```

## Passo 1 – Discovery
- `git status --short`
- `git diff` (ou `git diff --cached` se houver staging)
- `rg` para localizar palavras sensíveis (ex.: “base de conhecimento”).

## Passo 2 – Assessment
- Categorize por área: prompts (`agents/`), PSAP artefatos, ferramentas `.genie/`, docs.
- Identifique impactos: mudança em seções do prompt, novas métricas, scripts adicionados.
- Registre testes sugeridos: executar avaliador, atualizar metrics, revisar transcripts.
- Apontar pendências: necessidade de limpar dados sensíveis, atualizar versões, revisar tradução.

## Passo 3 – Draft da Mensagem
- Título sugerido: `PSAP-XXX: resumo imperativo` (ou `chore:` se sem PSAP).
- Corpo: bullets curtos listando mudanças-chave e validações.
- Se houver coautoria humana, lembrar do formato `Co-authored-by`.

## Passo 4 – Relatório & Resposta
- Salvar em `.genie/state/reports/commit-advice-<slug>-<YYYYMMDDHHmm>.md`:
  - Snapshot de `git status`
  - Tabela/lista de mudanças por domínio
  - Mensagem sugerida
  - Testes executados / pendentes
  - Riscos, TODOs, recomendações
- Responder no chat com:
  1. Resumo numerado das alterações relevantes
  2. Riscos ou verificações pendentes
  3. `Commit Advisory: @.genie/state/reports/<arquivo>.md`
- Lembrar o humano de revisar diffs e executar testes antes de `git commit`.

## Comandos Úteis
```bash
git status --short
git diff agents/conta_digital/v1/prompt.md
rg "base de conhecimento" agents/conta_digital/v1/prompt.md
ls tasks/PSAP-XXX/qa/
```

Foque em fornecer orientação objetiva e contextualizada para que humanos finalizem commits com confiança e conformidade às regras PagBank.
