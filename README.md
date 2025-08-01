# 🧞 Automagik Genie - Universal AI Development Companion

Transform any codebase into an AI-powered development environment with a single command!

## 🚀 Quick Start

```bash
# Initialize Genie in any project (Go, Rust, Python, JavaScript, Java, etc.)
npx automagik-genie init
```

That's it! Your project now has:
- 🤖 **Project-specific AI agents** tailored to your tech stack
- 🔍 **Universal codebase analyzer** that understands any programming language
- 🎯 **`/wish` command** for natural language development requests
- 🔧 **Optional workflow hooks** for automation

## 🌟 What Makes It Universal?

Unlike other AI tools, Automagik Genie:
- **Works with ANY programming language** (Go, Rust, Java, Python, JavaScript, TypeScript, C#, etc.)
- **Auto-detects your tech stack** (frameworks, build systems, testing tools)
- **Creates project-specific agents** with names like `myproject-dev-coder`, `webapp-analyzer`
- **No configuration required** - intelligent analysis handles everything

## 🛠️ Requirements

- **Claude CLI** installed and authenticated
- **Node.js 14+** for NPX execution
- **Any project directory** (programming language doesn't matter)

### Install Claude CLI

```bash
curl -fsSL https://claude.ai/install.sh | sh
claude auth
```

## 🎯 Usage Examples

### Analyze Any Codebase
```bash
/wish "analyze this codebase and provide development recommendations"
```

### Add Features (Language-Agnostic)
```bash
/wish "add user authentication system"
/wish "implement payment processing"
/wish "create REST API endpoints"
```

### Debug & Fix Issues
```bash
/wish "fix the failing tests"
/wish "optimize database performance"
/wish "resolve memory leaks"
```

### Quality & Testing
```bash
/wish "improve test coverage to 90%"
/wish "set up code quality checks"
/wish "create integration tests"
```

## 🤖 Your Project-Specific Agent Team

After initialization, you get agents customized for your project:

### Core Agents
- **`{project}-analyzer`**: Universal codebase analysis and tech stack detection
- **`{project}-dev-planner`**: Requirements analysis and technical specifications  
- **`{project}-dev-designer`**: System architecture and design documents
- **`{project}-dev-coder`**: Implementation with tech-stack awareness
- **`{project}-dev-fixer`**: Debugging and systematic issue resolution

### Management Agents
- **`{project}-agent-creator`**: Create new specialized agents
- **`{project}-agent-enhancer`**: Improve existing agents
- **`{project}-clone`**: Multi-task coordination
- **`{project}-claudemd`**: Documentation management

## 🔍 Universal Language Support

Automagik Genie automatically detects and adapts to:

### Programming Languages
- **Go**: Gin, Echo, standard library
- **Rust**: Actix-web, Rocket, Warp, Axum
- **Java**: Spring Boot, Maven, Gradle
- **Python**: Django, FastAPI, Flask, Poetry, UV
- **JavaScript/TypeScript**: React, Vue, Angular, Node.js
- **C#**: .NET, ASP.NET Core
- **PHP**: Laravel, Symfony, Composer
- **Ruby**: Rails, Sinatra, Bundler
- **And many more...**

### Frameworks & Tools
- **Web Frameworks**: React, Vue, Angular, Django, FastAPI, Spring Boot, Gin, etc.
- **Testing**: Jest, pytest, Go test, Cargo test, JUnit, xUnit, etc.
- **Build Systems**: npm, Cargo, Maven, Gradle, Go modules, Poetry, etc.
- **Quality Tools**: ESLint, Ruff, rustfmt, gofmt, Prettier, etc.

## 🎮 Workflow Examples

### New Feature Development
```bash
/wish "analyze requirements for user profile system"
# → Spawns {project}-dev-planner

/wish "design architecture for user profiles"  
# → Spawns {project}-dev-designer

/wish "implement user profile CRUD operations"
# → Spawns {project}-dev-coder with tech-stack awareness
```

### Bug Fixing Workflow
```bash
/wish "debug the authentication middleware failing tests"
# → Spawns {project}-dev-fixer with context from analyzer

/wish "optimize the slow database queries in user service" 
# → Uses tech-stack-specific optimization techniques
```

### Quality Improvement
```bash
/wish "set up automated code quality checks for this Go project"
# → Analyzer detects Go, sets up gofmt, golint, go vet

/wish "improve test coverage for the payment processing module"
# → Uses Go testing patterns and table-driven tests
```

## 🔧 Optional Workflow Automation

After initialization, check `.claude/hooks/examples/` for optional automation:

- **`pre-commit-quality.js`**: Automatic quality checks before commits
- **`tdd-workflow.js`**: Optional Red-Green-Refactor TDD cycle
- **`language-specific-hooks.js`**: Language-specific development environment setup

## 📁 What Gets Created

```
your-project/
├── .claude/
│   ├── agents/
│   │   ├── myproject-analyzer.md
│   │   ├── myproject-dev-planner.md
│   │   ├── myproject-dev-coder.md
│   │   └── ... (8+ specialized agents)
│   ├── hooks/examples/
│   │   ├── pre-commit-quality.js
│   │   ├── tdd-workflow.js
│   │   └── README.md
│   └── commands/
│       └── wish.md
├── CLAUDE.md (project-specific configuration)
└── ... (your existing project files)
```

## 🌟 Why Automagik Genie?

### For Individual Developers
- **Instant AI pair programming** in any language
- **No learning curve** - just describe what you want
- **Adapts to your project's patterns** and conventions
- **Grows with your codebase** through continuous analysis

### For Teams
- **Consistent development practices** across all projects
- **Knowledge sharing** through agent memory system
- **Onboarding acceleration** for new team members
- **Universal tooling** regardless of tech stack

### For Organizations
- **Standardized AI assistance** across all projects
- **Language-agnostic development acceleration**
- **Reduced context switching** between different tech stacks
- **Scalable development practices**

## 🤝 Contributing

Automagik Genie is open source! Contribute at:
- **GitHub**: https://github.com/automagik-genie/automagik-genie  
- **Issues**: Report bugs and request features
- **Discussions**: Share your experience and get help

## 📚 Learn More

- **Documentation**: https://github.com/automagik-genie/automagik-genie/docs
- **Examples**: https://github.com/automagik-genie/examples
- **Claude CLI**: https://docs.anthropic.com/en/docs/claude-code

## 🎉 Get Started Now

```bash
cd your-project
npx automagik-genie init

# Then try your first wish:
/wish "analyze this codebase and show me what you can help with"
```

**Transform your development workflow today!** 🧞✨

---

*Made with ❤️ by the Automagik Genie Team*