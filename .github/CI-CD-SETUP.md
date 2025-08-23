# CI/CD Pipeline Setup for Care Collective

This document provides a comprehensive guide to the CI/CD pipeline setup for the Care Collective project, including all workflows, configuration, and maintenance procedures.

## 🚀 Pipeline Overview

The Care Collective CI/CD pipeline consists of 6 main workflows designed to ensure code quality, security, and reliable deployments:

1. **Code Quality** - ESLint, TypeScript, Prettier, and bundle analysis
2. **Testing** - Unit tests with Vitest and 80% coverage requirement
3. **Security** - Dependency auditing, code scanning, and license compliance
4. **Deployment** - Automated Vercel deployment with rollback capabilities
5. **Performance** - Lighthouse CI and bundle size monitoring
6. **PRP Validation** - Care Collective methodology compliance checking

## 📁 Workflow Files

```
.github/workflows/
├── code-quality.yml    # Code quality and linting
├── test.yml           # Testing and coverage
├── security.yml       # Security scanning
├── deploy.yml         # Deployment pipeline
├── performance.yml    # Performance monitoring
└── prp-validation.yml # PRP methodology validation
```

## 🔧 Required Secrets

Configure these secrets in your GitHub repository settings:

### Vercel Deployment Secrets
- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project identifier

### Optional Secrets
- `SUPABASE_URL` - For database integration testing
- `SUPABASE_ANON_KEY` - For API testing

### How to Add Secrets

1. Go to repository **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add each required secret with its corresponding value

## 🔄 Workflow Triggers

### Code Quality Workflow
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

### Testing Workflow
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

### Security Workflow
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Deployment Workflow
```yaml
on:
  push:
    branches: [ main ]  # Only main branch
  workflow_dispatch:    # Manual trigger
```

### Performance Workflow
```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
```

### PRP Validation Workflow
```yaml
on:
  push:
    paths: [ 'PRPs/**', 'PRPs-agentic-eng/**' ]
  pull_request:
    paths: [ 'PRPs/**', 'PRPs-agentic-eng/**' ]
  workflow_dispatch:
```

## 📊 Pipeline Stages and Quality Gates

### 1. Code Quality Gates

| Check | Threshold | Blocking |
|-------|-----------|----------|
| TypeScript Compilation | No errors | ✅ Yes |
| ESLint | No errors | ✅ Yes |
| Prettier Formatting | Properly formatted | ✅ Yes |
| Bundle Size | < 500KB per file | ⚠️ Warning |
| Security Patterns | No hardcoded secrets | ✅ Yes |

### 2. Testing Gates

| Check | Threshold | Blocking |
|-------|-----------|----------|
| Unit Tests | All pass | ✅ Yes |
| Line Coverage | ≥ 80% | ✅ Yes |
| Function Coverage | ≥ 80% | ✅ Yes |
| Branch Coverage | ≥ 80% | ✅ Yes |
| Statement Coverage | ≥ 80% | ✅ Yes |

### 3. Security Gates

| Check | Threshold | Blocking |
|-------|-----------|----------|
| Dependency Vulnerabilities | No moderate+ | ✅ Yes |
| License Compliance | No copyleft | ✅ Yes |
| Code Security Scan | No critical issues | ✅ Yes |
| Hardcoded Secrets | None detected | ✅ Yes |

### 4. Performance Gates

| Check | Threshold | Blocking |
|-------|-----------|----------|
| Performance Score | ≥ 80% | ✅ Yes |
| Accessibility Score | ≥ 90% | ✅ Yes |
| Best Practices Score | ≥ 90% | ✅ Yes |
| SEO Score | ≥ 80% | ✅ Yes |
| Bundle Size | < 2MB total | ⚠️ Warning |

### 5. PRP Validation Gates

| Check | Threshold | Blocking |
|-------|-----------|----------|
| Structure Validation | Required sections | ✅ Yes |
| Content Quality | Min 50 words, actionable | ✅ Yes |
| Technical Specificity | Code examples/references | ✅ Yes |
| Markdown Formatting | Valid markdown | ✅ Yes |

## 🎯 Deployment Strategy

### Environment Flow
```
feature-branch → develop → main → production
```

### Deployment Conditions

#### Automatic Deployment (Main Branch)
- All quality gates pass
- All tests pass with 80% coverage
- Security scans pass
- No [skip deploy] in commit message

#### Manual Deployment
- Available via `workflow_dispatch`
- Can skip tests with flag
- Supports staging and production environments

### Rollback Procedures

1. **Automatic Detection**: Failed deployments trigger rollback info
2. **Manual Rollback Options**:
   - Vercel Dashboard: Promote previous deployment
   - Git Revert: Create revert commit and redeploy
   - Emergency Deploy: Use workflow_dispatch with previous commit

## 📈 Monitoring and Reporting

### GitHub Actions Dashboard
- Workflow run history
- Success/failure rates
- Performance trends

### PR Comments
Automated comments provide:
- Test coverage reports
- Performance metrics
- Bundle size analysis
- Security scan results
- PRP validation results

### Status Badges

Add these badges to your README.md:

```markdown
![Code Quality](https://github.com/username/care-collective-preview/workflows/Code%20Quality/badge.svg)
![Tests](https://github.com/username/care-collective-preview/workflows/Testing/badge.svg)
![Security](https://github.com/username/care-collective-preview/workflows/Security/badge.svg)
![Deploy](https://github.com/username/care-collective-preview/workflows/Deploy/badge.svg)
![Performance](https://github.com/username/care-collective-preview/workflows/Performance/badge.svg)
```

## 🛠 Local Development

### Running Checks Locally

```bash
# Code quality
npm run lint
npm run type-check
npx prettier --check .

# Testing
npm run test:coverage

# Build verification
npm run build

# Security audit
npm audit --audit-level=moderate
```

### Pre-commit Setup

Install pre-commit hooks to run checks locally:

```bash
# Install husky
npm install --save-dev husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check && npm run test:run"

# Set up pre-push hook
npx husky add .husky/pre-push "npm run build"
```

## 🔍 Troubleshooting Common Issues

### Workflow Failures

#### Code Quality Issues
```bash
# Fix ESLint issues
npm run lint -- --fix

# Fix Prettier formatting
npx prettier --write .

# Check TypeScript
npm run type-check
```

#### Test Failures
```bash
# Run tests with verbose output
npm run test -- --verbose

# Check coverage report
npm run test:coverage
open coverage/index.html
```

#### Security Issues
```bash
# Fix dependency vulnerabilities
npm audit fix

# Check for hardcoded secrets
grep -r "password\|secret\|key" --include="*.ts" --include="*.tsx" .
```

#### Deployment Issues
```bash
# Check build locally
npm run build

# Test production build
npm run start
```

### Environment Variables

Ensure these are properly configured:

```bash
# Required for build
NODE_ENV=production

# Required for deployment
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# Optional for testing
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

## 📋 Maintenance Checklist

### Weekly
- [ ] Review failed workflow runs
- [ ] Check security scan results
- [ ] Monitor performance trends
- [ ] Review coverage reports

### Monthly
- [ ] Update dependencies
- [ ] Review and update quality gates
- [ ] Check for new security vulnerabilities
- [ ] Optimize bundle sizes
- [ ] Review PRP validation rules

### Quarterly
- [ ] Update Node.js version in workflows
- [ ] Review branch protection rules
- [ ] Update security scanning tools
- [ ] Performance baseline review
- [ ] CI/CD pipeline optimization

## 🚨 Emergency Procedures

### Critical Security Vulnerability
1. Create hotfix branch from main
2. Apply security fix
3. Run security workflow manually
4. Get emergency review
5. Deploy with admin override
6. Post-incident review

### Production Outage
1. Check deployment status
2. Rollback via Vercel dashboard
3. Investigate root cause
4. Create incident report
5. Implement fixes
6. Redeploy with verification

### Workflow System Issues
1. Check GitHub Status
2. Use manual deployment if needed
3. Monitor for resolution
4. Resume normal operations
5. Review any missed checks

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs/deployments)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Semgrep Security Rules](https://semgrep.dev/explore)
- [PRP Methodology Guide](./PRPs/README.md)

## 🤝 Contributing

When contributing to the CI/CD pipeline:

1. Test changes in a fork first
2. Update documentation for any new checks
3. Ensure backward compatibility
4. Add appropriate error handling
5. Update this documentation

For questions or issues with the CI/CD pipeline, please create an issue with the `ci-cd` label.