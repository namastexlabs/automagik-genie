# Product Mission

## Pitch

Genie is a template-first agent framework that installs into any repository. It provides unified agents (plan, wish, forge, review, commit, specialist) and a CLI to orchestrate evidence-first workflows. Replace project-specific content with placeholders like `{{PROJECT_NAME}}`, `{{DOMAIN}}`, `{{TECH_STACK}}`, `{{METRICS}}`, `{{APIS}}`.

## Users

### Primary Customers

- **Developers**: Install Genie templates into any repo and orchestrate planning → implementation with evidence-first workflows.
- **Enterprise teams**: Standardize agentic workflows (plan/wish/forge/review/commit) with auditability and guardrails across multiple projects.

### User Personas

**Independent Developer**
- **Role:** Developer / technical lead
- **Context:** Building and maintaining {{DOMAIN}} applications
- **Pain Points:** Fragmented workflows, inconsistent code quality, lack of evidence trails
- **Goals:** Streamlined development, consistent quality, trackable decisions

**Enterprise Team Lead**
- **Role:** Engineering manager or architect
- **Context:** Managing multiple {{PROJECT_NAME}} codebases with compliance requirements
- **Pain Points:** Inconsistent practices across teams, difficult auditing, knowledge silos
- **Goals:** Standardized workflows, evidence-based decisions, clear accountability

## The Problem

### Fragmented Agent Workflows
Teams duplicate prompt scaffolding and orchestration patterns across repos, causing drift and inconsistent results.

**Our Solution:** A shared, installable template that unifies prompts, guardrails, and evidence capture without imposing domain specifics.

### Hard-to-Audit Changes
Lack of consistent evidence and report structures slows review and erodes trust.

**Our Solution:** Death/Done Testaments, standardized logs, and validation hooks across all agents.

### No Unified Testing & Experimentation
Teams lack a consistent framework to test strategies, measure outcomes, and iterate systematically.

**Our Solution:** An experiment framework with plug-and-play strategies, A/B testing support, and evaluator metrics for {{METRICS}}.

## Differentiators

### Framework-Agnostic Design
Works with any {{TECH_STACK}}, any {{DOMAIN}}, any repository structure - just copy and customize.

### Evidence-First Orchestration
Every decision, implementation, and validation captured with full audit trail.

### Flexible Performance Options
Supports multiple runtime strategies via {{TECH_STACK}} with configurable validation and metrics.

## Key Features

### Core Features

- **Agent Orchestration:** Plan → Wish → Forge → Review → Commit workflow with full evidence trail
- **Specialist Agents:** Template implementor, QA, quality, tests, self-learn, bug-reporter
- **CLI Management:** Background execution, session persistence, log viewing
- **Evidence Capture:** Done/Death Testaments, validation hooks, metrics tracking
- **Flexible Storage:** Wish-defined evidence paths, no hardcoded structure
- **Safety Guardrails:** Approval gates, non-destructive defaults, blocker protocols

### Collaboration/Operations Features

- **Experiment Framework:** A/B testing support for {{DOMAIN}}-specific strategies
- **Evaluator Integration:** Pluggable metrics and scoring for {{METRICS}}
- **Observability:** Structured logs, session tracking, command history
- **Templates:** Installable into any {{TECH_STACK}} codebase with placeholders
