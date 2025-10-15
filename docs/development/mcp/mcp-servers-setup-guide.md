# MCP Servers Setup Guide for Care Collective

This guide provides step-by-step instructions for setting up Model Context Protocol (MCP) servers to enhance Claude Code's capabilities when developing the Care Collective platform.

## Prerequisites

- **Node.js**: Version 18+ (current project uses v24.8.0)
- **npm**: Version 8+ (current project uses v11.6.0)
- **Claude Code**: Latest version with MCP support
- **Care Collective Project**: Local clone of the repository

## Phase 1: Essential MCP Servers

### 1. GitHub MCP Server

The GitHub MCP server enables direct repository management, issue tracking, and PR creation.

#### Step 1: Create GitHub Personal Access Token

1. Visit: https://github.com/settings/tokens?type=beta
2. Click "Generate new token" → "Fine-grained personal access token"
3. Configure token:
   - **Token name**: "Care Collective MCP Server"
   - **Expiration**: 90 days (recommended)
   - **Resource owner**: Your GitHub account
   - **Repository access**: Select repositories → `musickevan1/care-collective-preview`
   - **Repository permissions**:
     - ✅ **Contents**: Read and write
     - ✅ **Issues**: Read and write
     - ✅ **Pull requests**: Read and write
     - ✅ **Metadata**: Read
4. Click "Generate token"
5. **Copy the token** (starts with `github_pat_`)

#### Step 2: Configure GitHub MCP in Claude

Add this configuration to your `~/.claude.json` file:

```json
{
  "projects": {
    "/home/evan/Projects/Care-Collective/care-collective-preview": {
      "mcpServers": {
        "github": {
          "type": "http",
          "url": "https://api.githubcopilot.com/mcp/",
          "headers": {
            "Authorization": "Bearer YOUR_GITHUB_TOKEN_HERE"
          }
        }
      }
    }
  }
}
```

**Replace `YOUR_GITHUB_TOKEN_HERE` with your actual token.**

### 2. Supabase MCP Server

The Supabase MCP server provides direct database access and management capabilities.

#### Step 1: Generate Supabase Access Token

1. Visit: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Configure token:
   - **Name**: "Care Collective MCP Server"
   - **Scopes**: Select appropriate permissions for your organization
4. Click "Create token"
5. **Copy the token**

#### Step 2: Configure Supabase MCP in Claude

Add the Supabase MCP server to your `~/.claude.json` configuration:

```json
{
  "projects": {
    "/home/evan/Projects/Care-Collective/care-collective-preview": {
      "mcpServers": {
        "github": {
          "type": "http",
          "url": "https://api.githubcopilot.com/mcp/",
          "headers": {
            "Authorization": "Bearer YOUR_GITHUB_TOKEN_HERE"
          }
        },
        "supabase": {
          "type": "stdio",
          "command": "npx",
          "args": [
            "-y",
            "@supabase/mcp-server-supabase@latest",
            "--read-only",
            "--project-ref=kecureoyekeqhrxkmjuh",
            "--access-token=YOUR_SUPABASE_TOKEN_HERE"
          ]
        },
        "playwright": {
          "type": "stdio",
          "command": "npx",
          "args": ["@playwright/mcp@latest"]
        }
      }
    }
  }
}
```

**Replace `YOUR_SUPABASE_TOKEN_HERE` with your actual Supabase token.**

## Complete Configuration Example

Here's the complete `~/.claude.json` configuration for the Care Collective project:

```json
{
  "projects": {
    "/home/evan/Projects/Care-Collective/care-collective-preview": {
      "allowedTools": [],
      "mcpServers": {
        "github": {
          "type": "http",
          "url": "https://api.githubcopilot.com/mcp/",
          "headers": {
            "Authorization": "Bearer github_pat_YOUR_TOKEN_HERE"
          }
        },
        "supabase": {
          "type": "stdio",
          "command": "npx",
          "args": [
            "-y",
            "@supabase/mcp-server-supabase@latest",
            "--read-only",
            "--project-ref=kecureoyekeqhrxkmjuh",
            "--access-token=YOUR_SUPABASE_TOKEN_HERE"
          ]
        },
        "playwright": {
          "type": "stdio",
          "command": "npx",
          "args": ["@playwright/mcp@latest"]
        }
      },
      "mcpContextUris": [],
      "enabledMcpjsonServers": [],
      "disabledMcpjsonServers": [],
      "hasTrustDialogAccepted": true
    }
  }
}
```

## Testing Your MCP Setup

### Test GitHub MCP
Once configured, you can test GitHub operations:
- Create issues for Care Collective features
- Manage pull requests for development branches
- Browse repository files and history
- Analyze code patterns and structure

### Test Supabase MCP
Test database operations:
- Inspect Care Collective database schema
- Query help_requests table (read-only)
- Review RLS policies for security
- Analyze user data and profiles

### Test Playwright MCP
Test UI automation:
- Take screenshots of Care Collective pages
- Automate accessibility testing
- Test user flows and interactions
- Validate responsive design

## Security Best Practices

### Token Management
- **Never commit tokens** to any repository
- **Use environment variables** for sensitive data
- **Rotate tokens regularly** (every 90 days recommended)
- **Limit token scopes** to minimum required permissions

### MCP Server Security
- **Use read-only mode** for Supabase in development
- **Scope GitHub tokens** to specific repositories only
- **Monitor MCP server logs** for unusual activity
- **Test in development** before production use

### Care Collective Specific
- **Protect user data** in all MCP operations
- **Validate privacy compliance** in database queries
- **Monitor contact exchanges** for community safety
- **Ensure WCAG compliance** in automated testing

## Troubleshooting

### Common Issues

#### GitHub MCP Connection Failed
```bash
# Verify token permissions
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user

# Check repository access
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/repos/musickevan1/care-collective-preview
```

#### Supabase MCP Authentication Error
```bash
# Test Supabase token
npx @supabase/mcp-server-supabase@latest --read-only --project-ref=kecureoyekeqhrxkmjuh --access-token=YOUR_TOKEN

# Verify project access
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.supabase.com/v1/projects/kecureoyekeqhrxkmjuh
```

#### Playwright MCP Issues
```bash
# Reinstall Playwright browsers
npx playwright install

# Test Playwright MCP
npx @playwright/mcp@latest
```

### Debug Commands

```bash
# Check Node.js and npm versions
node --version && npm --version

# List installed MCP packages
npm list | grep mcp

# Verify npx can find MCP servers
npx @supabase/mcp-server-supabase@latest --version
npx @playwright/mcp@latest --version
```

## Advanced MCP Features

### GitHub Integration Features
- **Automated PR creation** from feature branches
- **Issue management** for Care Collective development
- **Code analysis** and security scanning
- **Release management** and deployment tracking

### Supabase Database Features
- **Schema inspection** and relationship mapping
- **Query optimization** and performance analysis
- **RLS policy validation** for security
- **Data quality monitoring** and reporting

### Playwright Testing Features
- **Automated accessibility testing** (WCAG compliance)
- **Cross-browser compatibility** testing
- **Mobile responsiveness** validation
- **User journey testing** for mutual aid workflows

## Development Workflow Integration

### Daily Development
1. **Start session**: Check MCP server status
2. **Feature development**: Use GitHub MCP for repository management
3. **Database work**: Use Supabase MCP for schema inspection
4. **Testing**: Use Playwright MCP for automated testing
5. **End session**: Review and commit changes via GitHub MCP

### Care Collective Specific Workflows
1. **Help Request Features**: Test database schema and UI flows
2. **Contact Exchange**: Validate privacy and security measures
3. **Admin Dashboard**: Test user management and moderation
4. **Accessibility**: Ensure WCAG compliance across all features
5. **Mobile Experience**: Validate responsive design and touch interactions

## Support and Resources

### Documentation
- [MCP Specification](https://modelcontextprotocol.io/)
- [GitHub MCP Server](https://github.com/github/github-mcp-server)
- [Supabase MCP Server](https://supabase.com/docs/guides/getting-started/mcp)
- [Playwright MCP](https://playwright.dev/docs/intro)

### Care Collective Resources
- [Care Collective Documentation](../README.md)
- [Development Guidelines](../CLAUDE.md)
- [Database Schema](../database/README.md)
- [Security Guidelines](../security/README.md)

### Community Support
- [MCP Discord Community](https://discord.gg/mcp)
- [Care Collective GitHub Issues](https://github.com/musickevan1/care-collective-preview/issues)
- [Supabase Community](https://supabase.com/docs/guides/getting-started/support)

---

*This guide is specific to the Care Collective mutual aid platform. Always prioritize community safety, privacy, and accessibility in all MCP operations.*

**Last Updated**: January 2025
**Version**: 1.0.0