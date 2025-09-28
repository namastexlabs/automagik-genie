# Template Roadmap (Customize Per Project)

This roadmap is a canvas. Replace phases with goals relevant to your project after installing the template.

## Phase 0: Install & Configure
- Copy `.genie/` and `.claude/commands/` into your repo
- Run `./genie help` and a `/plan` smoke
- Customize `.genie/product/*` placeholders

## Phase 1: Plan → Wish → Forge
- Capture a first wish and define evidence paths
- Add validation hooks (tests, scripts) per project

## Phase 2: Implementation & Review
- Use template-implementor/tests/qa/quality agents
- Record Done/Death Testaments

## Phase 3: Iterate
- Expand agents or prompts as needed
- Keep AGENTS.md and wrappers in sync
## Optional Extensions
- [ ] Custom evaluation metrics for {{DOMAIN}}
- [ ] Project-specific agent specializations
- [ ] Integration with {{APIS}}

## Success Metrics (Customize)
- Task completion rates
- Code quality improvements
- Time to deployment
- {{METRICS}} targets achieved
- Team adoption rate

### Key Milestones Timeline
- Milestone 1: First successful agent workflow executed
- Milestone 2: Core workflow complete with evidence capture
- Milestone 3: 100+ successful executions documented
- Milestone 4: Enterprise deployment guide published
- Milestone 5: Community adoption milestone reached
- Milestone 6: Framework maturity benchmarks met

## Phase 6: Advanced Features (Post-GA)

Goal: Extend framework with advanced capabilities based on {{DOMAIN}} requirements.

Success Criteria:
- Custom integrations with {{APIS}}
- Performance metrics meeting {{METRICS}} targets
- Full compatibility with {{TECH_STACK}}

Tasks
- [ ] Design integration architecture `[M]`
- [ ] Implement core connectors `[L]`
- [ ] Build monitoring dashboard `[M]`
- [ ] Create performance benchmarks `[S]`
- [ ] Document best practices `[S]`

## Technical Effort Scale
- **XS**: < 1 day
- **S**: 2-3 days
- **M**: 1 week
- **L**: 2 weeks
- **XL**: 3+ weeks

## Dependencies by Phase

### Phase 0-1
- {{PROVIDER}} API keys
- Basic infrastructure

### Phase 2-3
- PostgreSQL, Redis
- S3-compatible storage
- CI/CD pipeline

### Phase 4-5
- Multi-region infrastructure
- CDN for edge deployment
- ML training infrastructure
