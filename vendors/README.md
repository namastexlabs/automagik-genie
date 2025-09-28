# Vendors (Template Notice)

This directory contains external reference implementations added as Git submodules. When installing this Genie template into a target repository, you can:
- Keep submodules that are relevant to your {{DOMAIN}}
- Add new submodules for your specific {{TECH_STACK}}
- Remove this directory entirely if not needed

## Workflow
- Update submodules: `git submodule update --init --recursive`
- Pull latest from upstreams: `git submodule foreach git pull origin HEAD`
- Pin a revision when referencing code: prefer commit SHAs in docs for reproducible evaluations

## Considerations
- Treat these repos as reference implementations
- Copy patterns, not code, unless licensing is compatible
- Evaluate trade-offs independently for your project
- Keep dependencies optional to maintain flexibility

## Notes
- Additional vendor references can be added as separate submodules when needed for your {{PROJECT_NAME}}
- Document any vendor-specific usage in your project's own documentation