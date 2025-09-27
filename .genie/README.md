# 🧞 GENIE Framework

**The Universal Agent Orchestration Framework**

GENIE is a self-contained framework for managing AI agent conversations, wishes, and orchestration. It works with any AI system (Claude, Cursor, etc.) and provides consistent tooling for agent management.

## Structure

```
.genie/
├── agents/          # Agent personalities (forge-coder, forge-tests, etc.)
├── wishes/          # Structured development wishes
├── reports/         # Death Testaments and execution reports
├── cli/            # Command-line tools
│   └── agent.js    # Universal agent conversation manager
├── templates/      # Wish and report templates
└── knowledge/      # Shared knowledge base
```

## Quick Start

### Using the Agent CLI

Start a conversation with any agent:
```bash
./.genie/cli/agent.js chat forge-coder "implement authentication"
```

Continue the conversation:
```bash
./.genie/cli/agent.js continue forge-coder "add OAuth support"
```

List active sessions:
```bash
./.genie/cli/agent.js list
```

### Available Agents

- **forge-coder** - Feature implementation specialist
- **forge-tests** - Test writing expert
- **forge-master** - Task creation and orchestration
- **forge-quality** - Code quality enforcement
- **forge-hooks** - Hook configuration specialist
- **forge-qa-tester** - QA and testing coordinator
- **forge-self-learn** - Behavioral learning and improvement

#### Local agents in this repo
- **evaluator** – Voice evaluation rubric and scoring prompt (`.genie/agents/evaluator.md`)
- **refactorer** – Prompt refactoring specialist (`.genie/agents/refactorer.md`)
- **rules-integrator** – Minimal, non-destructive rules updater (`.genie/agents/rules-integrator.md`)

### For AI Agents (Claude, etc.)

Instead of using one-shot Task tools, use the CLI for full conversations:

```bash
# Start implementing a wish
./.genie/cli/agent.js chat forge-coder "@.genie/wishes/auth-wish.md implement Group A"

# Continue with error handling
./.genie/cli/agent.js continue forge-coder "tests failing, debug the issue"
```

## Conventions

### Wishes
- Stored in `.genie/wishes/`
- Named as `<feature>-wish.md`
- Contain structured implementation plans

### Reports
- Death Testaments in `.genie/reports/`
- Named as `<agent>-<slug>-<YYYYMMDDHHmm>.md`
- Document execution evidence and risks

### Agents
- Defined in `.genie/agents/`
- Markdown files with structured prompts
- Loaded as Codex base instructions

## Configuration

The agent CLI uses presets for different scenarios:
- **default** - Standard execution mode
- **careful** - Read-only, careful execution
- **fast** - Quick execution mode
- **debug** - Debug mode with search enabled

## Integration

### With Claude
Claude continues to use its specific configuration in `.claude/` but leverages GENIE for agent orchestration.

### With Other Systems
Copy the `.genie/` directory to any project to enable GENIE orchestration.

## Future Extensions

- Session history and search
- Background execution monitoring
- Multi-session per agent support
- Conversation export and analysis

---

*GENIE: Making agent orchestration magical* 🧞✨
