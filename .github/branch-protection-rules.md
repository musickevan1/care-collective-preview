# Branch Protection Rules Configuration

This document outlines the recommended branch protection rules for the Care Collective repository to ensure code quality and security.

## Main Branch Protection

### Required Settings for `main` branch:

- **Restrict pushes that create files**: ✅ Enabled
- **Require pull request reviews before merging**: ✅ Enabled
  - **Required approving reviews**: 1
  - **Dismiss stale reviews**: ✅ Enabled
  - **Require review from code owners**: ✅ Enabled (if CODEOWNERS file exists)
  - **Restrict reviews to users with write access**: ✅ Enabled

- **Require status checks to pass**: ✅ Enabled
  - **Require branches to be up to date**: ✅ Enabled
  - **Required status checks**:
    - `Code Quality Checks` (from code-quality.yml)
    - `Unit Tests` (from test.yml)
    - `Dependency Security Audit` (from security.yml)
    - `Code Security Scanning` (from security.yml)
    - `License Compliance` (from security.yml)
    - `Lighthouse CI` (from performance.yml)
    - `Pre-deployment Checks` (from deploy.yml)

- **Require conversation resolution before merging**: ✅ Enabled
- **Require signed commits**: ✅ Enabled (recommended)
- **Require linear history**: ✅ Enabled
- **Include administrators**: ✅ Enabled

### Branch Protection Enforcement

- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled

## Develop Branch Protection

### Required Settings for `develop` branch:

- **Require pull request reviews before merging**: ✅ Enabled
  - **Required approving reviews**: 1
  - **Dismiss stale reviews**: ✅ Enabled

- **Require status checks to pass**: ✅ Enabled
  - **Required status checks**:
    - `Code Quality Checks` (from code-quality.yml)
    - `Unit Tests` (from test.yml)
    - `Dependency Security Audit` (from security.yml)

- **Require conversation resolution before merging**: ✅ Enabled
- **Include administrators**: ✅ Enabled

## GitHub CLI Commands to Set Branch Protection

Use these commands to configure branch protection rules via GitHub CLI:

### Main Branch Protection

```bash
# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Code Quality Checks","Unit Tests","Dependency Security Audit","Code Security Scanning","License Compliance","Lighthouse CI","Pre-deployment Checks"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"restrict_reviews_to_users_with_write_access":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_linear_history=true \
  --field allow_auto_merge=false \
  --field required_conversation_resolution=true
```

### Develop Branch Protection

```bash
# Protect develop branch
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Code Quality Checks","Unit Tests","Dependency Security Audit"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true
```

## Automated Setup Script

You can also use this script to set up branch protection rules:

```bash
#!/bin/bash

# Set up branch protection rules for Care Collective
# Requires GitHub CLI to be installed and authenticated

OWNER="your-github-username"
REPO="care-collective-preview"

echo "Setting up branch protection rules for $OWNER/$REPO"

# Main branch protection
echo "Configuring main branch protection..."
gh api repos/$OWNER/$REPO/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Code Quality Checks","Unit Tests","Dependency Security Audit","Code Security Scanning","License Compliance","Lighthouse CI","Pre-deployment Checks"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":true,"restrict_reviews_to_users_with_write_access":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_linear_history=true \
  --field allow_auto_merge=false \
  --field required_conversation_resolution=true

if [ $? -eq 0 ]; then
    echo "✅ Main branch protection configured successfully"
else
    echo "❌ Failed to configure main branch protection"
fi

# Develop branch protection (if exists)
if gh api repos/$OWNER/$REPO/branches/develop > /dev/null 2>&1; then
    echo "Configuring develop branch protection..."
    gh api repos/$OWNER/$REPO/branches/develop/protection \
      --method PUT \
      --field required_status_checks='{"strict":true,"contexts":["Code Quality Checks","Unit Tests","Dependency Security Audit"]}' \
      --field enforce_admins=true \
      --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
      --field restrictions=null \
      --field allow_force_pushes=false \
      --field allow_deletions=false \
      --field required_conversation_resolution=true
    
    if [ $? -eq 0 ]; then
        echo "✅ Develop branch protection configured successfully"
    else
        echo "❌ Failed to configure develop branch protection"
    fi
else
    echo "ℹ️ Develop branch not found, skipping protection setup"
fi

echo "Branch protection setup complete!"
```

## Manual Configuration via GitHub Web Interface

If you prefer to configure branch protection rules manually:

1. Go to **Settings** → **Branches** in your GitHub repository
2. Click **Add rule** or edit existing rules
3. Apply the settings listed above for each branch

## Environment-Specific Considerations

### Production Environment (`main` branch)
- All security checks must pass
- Performance thresholds must be met
- Full test coverage required
- PRP validation for any methodology changes

### Development Environment (`develop` branch)
- Core quality checks required
- Security audits required
- Performance checks optional
- Allows for more experimental changes

## Monitoring and Maintenance

- Review protection rules quarterly
- Update required status checks when new workflows are added
- Monitor for any bypass attempts in audit logs
- Ensure all team members understand the protection rules

## Troubleshooting

### Common Issues:

1. **Status check not appearing**: Ensure the workflow job name exactly matches the required status check name
2. **Protection rules too strict**: Consider creating separate rules for feature branches
3. **Merge conflicts**: Use branch protection to require branches to be up to date

### Emergency Procedures:

If urgent changes need to be made:

1. Create an emergency branch from main
2. Make minimal necessary changes
3. Get expedited review from repository admin
4. Merge with admin override if necessary
5. Document the emergency procedure in incident logs