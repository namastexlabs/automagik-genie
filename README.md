# 🧞 Automagik Genie

**Mini framework for Meeseeks-like AI agents using Claude Code**

A universal AI development companion that creates specialized AI agents for your codebase. Built on Claude Code, it transforms natural language wishes into automated development workflows through intelligent agent coordination.

## 📋 Requirements

**MUST HAVE**: [Claude Code](https://claude.ai/code) installed and configured
- **Setup guide**: https://docs.anthropic.com/en/docs/claude-code/setup
- **Follow best practices**: https://www.anthropic.com/engineering/claude-code-best-practices

Transform your development workflow with specialized AI agents that understand your project context and execute complex tasks autonomously.

## 🚀 Quick Start

```bash
# Initialize in any project
npx automagik-genie init

# Start using magic
/wish "add authentication to my app"
/wish "fix all failing tests" 
/wish "create comprehensive documentation"
```

## 💡 What It Solves

- **Context-Aware AI**: Understands your codebase structure and patterns
- **Task Automation**: Handles complex development workflows autonomously  
- **Intelligent Routing**: Automatically selects the right specialist for each task
- **Learning System**: Improves over time based on your project patterns

## 🎯 Key Features

- **Zero Configuration**: Works out of the box in any codebase
- **Smart Agent System**: Specialized AI agents for different development tasks
- **Interactive Statusline**: Beautiful, contextual status display for Claude Code
- **NPX Updates**: Keep your genie updated with latest capabilities
- **Context Preservation**: Maintains understanding across complex multi-step tasks

## 🧞 Quick Tips

```bash
/wish self enhance          # Improve the genie's capabilities
/wish analyze codebase      # Get intelligent project insights  
/wish create tests          # Generate comprehensive test suites
/wish debug error          # Systematic error resolution
npx automagik-genie update  # Update to latest version
```

## ⚡ Pro Tips for Better Results

**Explicit Agent Spawning** (when you want specific expertise):
```bash
/wish "spawn genie-testing-fixer to handle all failing tests"
/wish "use genie-dev-designer to architect the payment system"
/wish "spawn genie-security for full security audit"
```

**Parallelization** (for multiple independent tasks):
```bash
/wish "parallelize: fix tests + update docs + run security scan"
/wish "spawn multiple agents: genie-testing-maker for tests, genie-dev-coder for features"
/wish "handle issues #123, #456, #789 in parallel with specialized agents"
```

**Multi-Step Workflows** (for complex coordination):
```bash
/wish "coordinate full feature: plan → design → implement → test → document"
/wish "spawn genie-clone to orchestrate API migration across multiple services"
```

## 📊 Interactive Statusline

The Genie provides a beautiful, contextual statusline for Claude Code that shows:
- Current AI model being used
- Contextual action based on time of day and git activity  
- Project name and git branch information
- Uncommitted changes count
- Version information and update notifications

**Example Output:**
```
🧞 Genie is using Sonnet 4 to manifest commit message poetry at automagik-genie | main (3 changes) | v1.2.7
```

**Statusline Features:**
- **Contextual Actions**: Changes based on time (morning energy, afternoon productivity, late night intensity)
- **Git Integration**: Shows branch, uncommitted changes, and pull indicators
- **Model Detection**: Displays current Claude model being used
- **Smart Caching**: Efficient performance with cached updates
- **Cross-Platform**: Works on Windows, Mac, and Linux

The statusline is automatically configured during `init` and integrates seamlessly with Claude Code's status display system.

## 🔧 Advanced Usage

```bash
# Backup before updates (automatic)
npx automagik-genie rollback

# Check system status
npx automagik-genie status

# Clean up old backups
npx automagik-genie cleanup

# Run statusline directly (for testing)
npx automagik-genie statusline
```

## 🌟 How It Works

1. **Initialize**: `npx automagik-genie init` sets up context understanding
2. **Make Wishes**: Use natural language to describe what you want
3. **Watch Magic**: The genie routes tasks to specialized AI agents
4. **Get Results**: Receive high-quality, context-aware solutions

## 📝 Example Wishes

- `"Add JWT authentication with proper error handling"`
- `"Optimize database queries in the user service"` 
- `"Create integration tests for the API endpoints"`
- `"Refactor this component to use modern React patterns"`
- `"Set up CI/CD pipeline with proper testing"`

## 🤝 Contributing

The genie learns and evolves. Feedback and contributions help improve the magic for everyone.

## 📜 License

MIT - Make wishes responsibly! 🧞✨