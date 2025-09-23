# Care Collective PRP (Product Requirement Prompt) System

## Overview

The PRP system provides a structured approach to implementing features in the Care Collective platform using AI-powered development. This system combines the discipline of Product Requirements Documents (PRDs) with AI prompt engineering best practices to deliver production-ready code.

## Directory Structure

```
PRPs/
├── PRP_SYSTEM_README.md          # This file - system documentation
├── README.md                     # Original PRP concept documentation
├── active/                       # PRPs currently being worked on
├── completed/                    # Finished PRPs (moved here after completion)
├── backlog/                      # PRPs waiting to be implemented
│   ├── example-from-workshop-mcp-crawl4ai-refactor-1.md
│   └── pydantic-ai-prp-creation-agent-parallel.md
├── ai_docs/                      # Context documentation for AI agents
│   ├── build_with_claude_code.md
│   ├── cc_administration.md
│   ├── getting_started.md
│   └── [other context docs]
├── scripts/
│   └── prp_runner.py            # PRP execution script
└── templates/
    ├── prp_base.md              # General PRP template
    ├── prp_care_collective_feature.md  # Care Collective specific template
    ├── prp_base_typescript.md   # TypeScript project template
    ├── prp_planning.md          # Planning-focused template
    ├── prp_poc_react.md         # React proof-of-concept template
    ├── prp_spec.md              # Specification template
    └── prp_task.md              # Task-specific template
```

## Quick Start

### 1. Create a New PRP

Choose the appropriate template based on your feature type:

```bash
# For Care Collective features (recommended)
cp PRPs/templates/prp_care_collective_feature.md PRPs/active/your-feature-name.md

# For general features
cp PRPs/templates/prp_base.md PRPs/active/your-feature-name.md

# For planning sessions
cp PRPs/templates/prp_planning.md PRPs/active/your-planning-session.md
```

### 2. Edit Your PRP

Fill out the template with:
- Clear goal and success criteria
- User persona and use case
- Complete context (files, patterns, gotchas)
- Step-by-step implementation tasks
- Validation requirements

### 3. Run Your PRP

```bash
# Interactive mode (recommended for development)
uv run PRPs/scripts/prp_runner.py --prp your-feature-name --interactive

# Non-interactive mode with text output
uv run PRPs/scripts/prp_runner.py --prp your-feature-name

# JSON output for automation
uv run PRPs/scripts/prp_runner.py --prp your-feature-name --output-format json

# Specify folder explicitly
uv run PRPs/scripts/prp_runner.py --prp your-feature-name --folder active --interactive

# Use direct path
uv run PRPs/scripts/prp_runner.py --prp-path PRPs/active/your-feature-name.md --interactive
```

### 4. Move Completed PRPs

When your PRP is successfully implemented:

```bash
mv PRPs/active/your-feature-name.md PRPs/completed/
```

## PRP Runner Options

The `prp_runner.py` script supports the following options:

- `--prp FEATURE_NAME`: Name of PRP file (without .md extension)
- `--prp-path PATH`: Direct path to PRP file
- `--folder {active,backlog,completed}`: Folder to search (default: active)
- `--interactive`: Launch interactive chat session with Claude
- `--model MODEL`: CLI executable name (default: "claude")
- `--output-format {text,json,stream-json}`: Output format for headless mode

## Care Collective Specific Features

### Template: `prp_care_collective_feature.md`

This template is specifically designed for the Care Collective platform and includes:

- **Next.js 15 App Router patterns**: Proper app directory structure
- **Supabase integration**: Authentication and database patterns
- **Design system compliance**: Tailwind CSS and component patterns
- **Accessibility requirements**: WCAG compliance checks
- **Mobile responsiveness**: Responsive design validation
- **Security considerations**: RLS policies and auth checks

### Key Technologies Covered

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Authentication**: Supabase Auth with middleware protection
- **UI Components**: Shadcn/ui component library
- **Testing**: React Testing Library (when applicable)

## Best Practices

### 1. PRP Creation

- **Be specific**: Vague requirements lead to poor implementations
- **Include context**: Reference existing files and patterns
- **Define success**: Clear, measurable completion criteria
- **Plan validation**: How will you know it works correctly?

### 2. Implementation Workflow

1. **Planning Phase**: Use TodoWrite to break down tasks
2. **Implementation Phase**: Follow existing code patterns
3. **Testing Phase**: Validate each component as you build
4. **Integration Phase**: Ensure everything works together

### 3. Context Management

- **ai_docs/**: Keep updated with library and framework docs
- **File references**: Always include exact file paths in PRPs
- **Pattern examples**: Show code snippets of patterns to follow
- **Gotchas**: Document known issues and constraints

### 4. Validation Levels

All PRPs should include these validation levels:

1. **Syntax & Style**: Linting, type checking, formatting
2. **Unit Testing**: Component and function testing
3. **Integration Testing**: System-level validation
4. **Domain-Specific**: Care Collective user journey testing

## Common Commands

### Development Workflow

```bash
# Check if PRP exists in any folder
find PRPs/ -name "feature-name.md" -type f

# List all active PRPs
ls PRPs/active/

# List all completed PRPs
ls PRPs/completed/

# Search for PRPs containing specific text
grep -r "search-term" PRPs/active/

# Validate TypeScript and build
npm run type-check && npm run build
```

### PRP Management

```bash
# Move PRP from backlog to active
mv PRPs/backlog/feature.md PRPs/active/

# Move completed PRP
mv PRPs/active/feature.md PRPs/completed/

# Copy template for new feature
cp PRPs/templates/prp_care_collective_feature.md PRPs/active/new-feature.md
```

## Troubleshooting

### Common Issues

1. **PRP not found**: Check if file exists and is in the expected folder
2. **Script fails**: Ensure you're in the project root directory
3. **Context missing**: Make sure all referenced files exist
4. **Validation failures**: Read error messages and fix issues before proceeding

### Debug Mode

Run with verbose output to troubleshoot:

```bash
# Add debugging to see what's happening
python -v PRPs/scripts/prp_runner.py --prp your-feature --interactive
```

### Getting Help

1. Check the original PRP documentation: `PRPs/README.md`
2. Review successful examples in `PRPs/completed/`
3. Examine context docs in `PRPs/ai_docs/`
4. Look at existing code patterns in the codebase

## Contributing to the PRP System

### Adding New Templates

1. Create template in `PRPs/templates/`
2. Follow existing template structure
3. Include Care Collective specific patterns
4. Add validation requirements
5. Update this README with new template info

### Updating Context Docs

1. Add new docs to `PRPs/ai_docs/`
2. Reference them in PRP templates
3. Keep docs focused and practical
4. Include code examples and gotchas

### Improving the Runner

1. Edit `PRPs/scripts/prp_runner.py`
2. Test changes thoroughly
3. Update help text and documentation
4. Maintain backward compatibility

## Examples

### Simple Feature PRP

```bash
# Create a new component
cp PRPs/templates/prp_care_collective_feature.md PRPs/active/status-badge-component.md

# Edit the PRP with specific requirements
# Run interactively
uv run PRPs/scripts/prp_runner.py --prp status-badge-component --interactive

# Move to completed when done
mv PRPs/active/status-badge-component.md PRPs/completed/
```

### Complex Feature with Database Changes

```bash
# Create comprehensive PRP
cp PRPs/templates/prp_care_collective_feature.md PRPs/active/user-notification-system.md

# Include database migration tasks
# Include API route creation
# Include component development
# Include testing requirements

# Run with JSON output for automation
uv run PRPs/scripts/prp_runner.py --prp user-notification-system --output-format json > results.json
```

## Success Metrics

A successful PRP implementation should:

- ✅ Meet all defined success criteria
- ✅ Pass all validation levels (syntax, testing, integration, domain)
- ✅ Follow existing code patterns and conventions
- ✅ Work correctly in the Care Collective platform
- ✅ Be ready for production deployment

---

For more information about the PRP concept and methodology, see `PRPs/README.md`.