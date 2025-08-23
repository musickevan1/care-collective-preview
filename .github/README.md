# GitHub Configuration for Care Collective

This directory contains all GitHub-specific configuration files for the Care Collective project, including CI/CD workflows, issue templates, and repository settings.

## 📁 Directory Structure

```
.github/
├── workflows/              # GitHub Actions CI/CD workflows
│   ├── code-quality.yml    # Code quality, linting, TypeScript
│   ├── test.yml           # Testing with Vitest and coverage
│   ├── security.yml       # Security scanning and auditing
│   ├── deploy.yml         # Vercel deployment pipeline
│   ├── performance.yml    # Lighthouse CI and performance
│   └── prp-validation.yml # PRP methodology validation
├── ISSUE_TEMPLATE/         # Issue templates for better reporting
│   ├── bug_report.yml     # Bug report template
│   ├── feature_request.yml # Feature request template
│   └── prp_request.yml    # PRP request template
├── CODEOWNERS             # Code review assignments
├── pull_request_template.md # PR template
├── branch-protection-rules.md # Branch protection setup
├── CI-CD-SETUP.md         # Comprehensive pipeline docs
└── README.md              # This file
```

## 🚀 CI/CD Pipeline Overview

### Workflow Summary

| Workflow | Trigger | Purpose | Quality Gates |
|----------|---------|---------|---------------|
| **Code Quality** | Push/PR to main/develop | Linting, TypeScript, formatting | ESLint, Prettier, bundle analysis |
| **Testing** | Push/PR to main/develop | Unit tests and coverage | 80% coverage threshold |
| **Security** | Push/PR + daily | Security scanning | Dependency audit, code scan |
| **Deploy** | Push to main | Vercel deployment | All checks must pass |
| **Performance** | Push/PR to main + daily | Lighthouse CI | Performance thresholds |
| **PRP Validation** | PRP file changes | Methodology compliance | Structure, content quality |

### Status Badges

Add these to your main README.md:

```markdown
![Code Quality](https://github.com/username/care-collective-preview/workflows/Code%20Quality/badge.svg)
![Tests](https://github.com/username/care-collective-preview/workflows/Testing/badge.svg)
![Security](https://github.com/username/care-collective-preview/workflows/Security/badge.svg)
![Deploy](https://github.com/username/care-collective-preview/workflows/Deploy/badge.svg)
![Performance](https://github.com/username/care-collective-preview/workflows/Performance/badge.svg)
![PRP Validation](https://github.com/username/care-collective-preview/workflows/PRP%20Validation/badge.svg)
```

## 🔧 Setup Requirements

### 1. Repository Secrets

Configure these secrets in **Settings** → **Secrets and variables** → **Actions**:

#### Required for Deployment
- `VERCEL_TOKEN` - Your Vercel deployment token
- `VERCEL_ORG_ID` - Vercel organization ID  
- `VERCEL_PROJECT_ID` - Vercel project ID

#### Optional for Enhanced Features
- `SUPABASE_URL` - For database integration testing
- `SUPABASE_ANON_KEY` - For API testing

### 2. Branch Protection Rules

Run the branch protection setup:

```bash
# Using GitHub CLI (recommended)
gh auth login
# Then run the commands in branch-protection-rules.md

# Or configure manually via GitHub web interface
# Settings → Branches → Add rule
```

### 3. Environment Variables

Ensure your repository has these environment variables configured for local development:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
VERCEL_ENV=development
```

## 🔍 Quality Gates & Thresholds

### Code Quality Standards
- ✅ TypeScript compilation must pass
- ✅ ESLint rules must pass
- ✅ Prettier formatting enforced
- ⚠️ Bundle size warnings for files >500KB
- ❌ Hardcoded secrets block pipeline

### Testing Requirements
- ✅ All unit tests must pass
- ✅ Minimum 80% code coverage across all metrics
- ✅ End-to-end health checks for deployments

### Security Standards
- ✅ No moderate+ severity vulnerabilities
- ✅ License compliance (no copyleft licenses)
- ✅ Code security scan must pass
- ✅ No hardcoded secrets detected

### Performance Benchmarks
- ✅ Lighthouse Performance Score ≥ 80%
- ✅ Accessibility Score ≥ 90%
- ✅ Best Practices Score ≥ 90%
- ✅ SEO Score ≥ 80%
- ⚠️ Total bundle size warnings for >2MB

### PRP Methodology Compliance
- ✅ Required sections present (Context, Implementation, Validation)
- ✅ Minimum content quality (50+ words, actionable language)
- ✅ Technical specificity (code examples, file references)
- ✅ Valid markdown formatting

## 📋 Using Issue Templates

### Bug Reports (`bug_report.yml`)
- Structured bug reporting with severity levels
- Environment and reproduction details
- Console error capture
- User impact assessment

### Feature Requests (`feature_request.yml`)
- User story format requirements
- Care Collective mission alignment
- Acceptance criteria definition
- Technical considerations

### PRP Requests (`prp_request.yml`)
- Full PRP methodology compliance
- Technical context and implementation strategy
- Validation gates and success criteria
- File references and dependencies

## 🎯 Pull Request Process

### PR Template Features
- Type of change categorization
- Testing requirements checklist
- Security considerations
- Accessibility compliance
- Performance impact assessment
- PRP methodology alignment (when applicable)

### Automated PR Comments
The CI/CD pipeline automatically adds comments with:
- 📊 Test coverage reports
- 🚦 Lighthouse performance scores
- 📦 Bundle size analysis
- 🔒 Security scan results
- 📋 PRP validation results (for PRP changes)

## 👥 Code Review Process

### CODEOWNERS Configuration
The `CODEOWNERS` file automatically assigns reviewers based on:
- File type and location
- Component ownership
- Security sensitivity
- PRP methodology requirements

### Review Requirements
- Main branch: 1+ approvals required
- All status checks must pass
- Conversation resolution required
- Branch must be up to date

## 🚨 Emergency Procedures

### Critical Security Issues
1. Create hotfix branch from main
2. Apply security fix
3. Run security workflow manually
4. Get emergency review approval
5. Deploy with admin override if needed
6. Post-incident review required

### Production Outages
1. Check deployment status in Vercel
2. Rollback via Vercel dashboard if needed
3. Investigate root cause
4. Document incident
5. Implement fixes and redeploy

### Pipeline Failures
1. Check GitHub Actions status
2. Review specific workflow logs
3. Fix issues and re-run
4. Use manual deployment if urgent
5. Monitor for resolution

## 📈 Monitoring & Maintenance

### Daily Monitoring
- Review failed workflow runs
- Check security scan results
- Monitor performance trends

### Weekly Reviews
- Coverage report analysis
- Bundle size optimization
- Security vulnerability assessment

### Monthly Maintenance
- Update dependencies
- Review and adjust quality gates
- Optimize CI/CD performance
- Update documentation

## 🔗 Related Documentation

- [Complete CI/CD Setup Guide](./CI-CD-SETUP.md)
- [Branch Protection Configuration](./branch-protection-rules.md)
- [PRP Methodology Guide](../PRPs/README.md)
- [Security Implementation Guide](../SECURITY.md)

## 🤝 Contributing to CI/CD

### Making Changes
1. Test changes in a fork first
2. Update relevant documentation
3. Ensure backward compatibility
4. Add appropriate error handling
5. Submit PR with detailed description

### Adding New Workflows
1. Follow existing naming conventions
2. Include comprehensive error handling
3. Add appropriate quality gates
4. Update branch protection rules
5. Document in CI-CD-SETUP.md

### Modifying Quality Gates
1. Discuss changes with team first
2. Consider impact on development velocity
3. Provide migration path if needed
4. Update documentation
5. Monitor after implementation

## 💡 Best Practices

### Workflow Design
- Keep workflows focused and modular
- Use appropriate caching strategies
- Implement proper error handling
- Provide clear failure messages
- Use secure secret management

### Quality Gates
- Set realistic but meaningful thresholds
- Provide clear guidance on failures
- Allow for reasonable exceptions
- Monitor effectiveness over time
- Adjust based on team feedback

### Documentation
- Keep documentation up to date
- Provide examples and troubleshooting
- Include rationale for decisions
- Make it accessible to all team members
- Review and update regularly

## 📞 Support

For questions about the CI/CD pipeline:
- Create an issue with the `ci-cd` label
- Review the comprehensive setup guide
- Check workflow logs for specific errors
- Consult with the DevOps team via CODEOWNERS

---

**Last Updated**: August 2025  
**Maintained By**: Care Collective DevOps Team