# Care Collective - MCP Server Documentation

Model Context Protocol (MCP) servers integration documentation for Care Collective development workflow.

## Overview

MCP servers provide enhanced development capabilities by connecting Claude Code to external services and tools. This directory contains configuration guides and documentation for all MCP servers used in Care Collective development.

## Available MCP Servers

### Core Development Tools

#### GitHub MCP Server
**Configuration:** [`github-mcp-config.md`](./github-mcp-config.md)

Provides repository management, issue tracking, pull request creation, and code analysis capabilities.

**Key Features:**
- Repository file access and management
- Issue and PR creation/management
- Commit history and branch operations
- Code search and analysis

---

#### Supabase MCP Server
**Configuration:** [`supabase-mcp-config.md`](./supabase-mcp-config.md)

Enables direct database schema inspection and read-only query execution for Care Collective's PostgreSQL database.

**Key Features:**
- Table and schema inspection
- Read-only SQL execution
- RLS policy review
- Database migration analysis

**⚠️ Security Note:** Configured in read-only mode for safety

---

#### ESLint MCP Server
Official ESLint integration for TypeScript/JavaScript code quality enforcement.

**Key Features:**
- Real-time linting
- TypeScript error detection
- Code quality checks
- Auto-fix suggestions

---

### Quality Assurance Tools

#### A11y MCP Server
Axe-core accessibility testing for WCAG 2.1 AA compliance verification.

**Key Features:**
- Automated accessibility scanning
- WCAG compliance checking
- Aria attribute validation
- Color contrast analysis

**Care Collective Requirement:** WCAG 2.1 AA compliance is mandatory

---

#### Lighthouse MCP Server
Comprehensive performance monitoring and Core Web Vitals analysis.

**Key Features:**
- Performance score analysis
- Core Web Vitals (LCP, FID, CLS)
- SEO analysis
- Progressive Web App readiness

**Care Collective Target:** 90+ performance score

---

#### Playwright MCP Server
Browser automation and UI testing capabilities.

**Key Features:**
- Page navigation and interaction
- Screenshot capture
- Form testing
- Real-time interaction testing

**Note:** Requires browser installation with `npx playwright install chrome`

---

## Setup Guide

### Complete Setup Instructions
**See:** [`mcp-servers-setup-guide.md`](./mcp-servers-setup-guide.md)

This comprehensive guide includes:
1. Token generation for GitHub and Supabase
2. Claude configuration file setup
3. MCP server installation
4. Testing and verification procedures
5. Troubleshooting common issues

---

## Testing Guide

### MCP Server Testing
**See:** [`mcp-testing-guide.md`](./mcp-testing-guide.md)

Includes test scenarios for:
- GitHub repository operations
- Supabase database queries
- Accessibility compliance testing
- Performance monitoring
- UI automation workflows

---

## Recommended MCP Servers

### Additional Servers for Consideration
**See:** [`mcp-servers-recommendations.md`](./mcp-servers-recommendations.md)

Contains curated list of beneficial MCP servers for:
- Code quality and analysis
- Documentation generation
- Testing automation
- Development workflow optimization

---

## Care Collective Specific Workflows

### Enhanced Development Workflows

#### 1. Help Request Workflow Testing
```typescript
// Use Playwright MCP to test help request creation
// Use A11y MCP to verify WCAG compliance
// Use Supabase MCP to verify database state
```

#### 2. Database Schema Validation
```typescript
// Use Supabase MCP to inspect schema
// Verify RLS policies
// Check migration status
```

#### 3. Accessibility Compliance
```typescript
// Use A11y MCP for automated WCAG testing
// Verify touch target sizes (44px minimum)
// Check color contrast ratios
```

#### 4. Performance Monitoring
```typescript
// Use Lighthouse MCP for Core Web Vitals
// Monitor mobile performance
// Check bundle size optimization
```

---

## Configuration Files

All MCP servers are configured in `~/.claude.json` under the project-specific settings:

```json
"/home/evan/Projects/Care-Collective/care-collective-preview": {
  "mcpServers": {
    "github": { /* GitHub config */ },
    "supabase": { /* Supabase config */ },
    "playwright": { /* Playwright config */ },
    "a11y": { /* A11y config */ },
    "eslint": { /* ESLint config */ },
    "lighthouse": { /* Lighthouse config */ }
  }
}
```

---

## Security Considerations

### Token Management
- **Never commit tokens** to repository
- **Rotate tokens regularly** (recommended: 90 days)
- **Use read-only access** where possible (Supabase)
- **Limit token scopes** to minimum required permissions

### Privacy Protection
- **Read-only Supabase access** prevents data modification
- **GitHub tokens scoped** to Care Collective repository only
- **No access to user data** through MCP servers

---

## Troubleshooting

### Common Issues

**MCP servers not connecting:**
1. Verify Claude Code has been restarted
2. Check token validity and permissions
3. Review Claude Code logs for errors

**Supabase MCP connection failed:**
```bash
# Test connection manually:
npx @supabase/mcp-server-supabase@latest \
  --read-only \
  --project-ref=kecureoyekeqhrxkmjuh \
  --access-token=YOUR_TOKEN
```

**Playwright browser not found:**
```bash
# Install Chrome browser:
npx playwright install chrome
```

---

## Additional Resources

- **MCP Protocol Documentation**: https://modelcontextprotocol.io/
- **Supabase MCP Server**: https://github.com/supabase/mcp-server-supabase
- **Playwright MCP Server**: https://github.com/playwright/mcp
- **A11y Testing Guide**: https://www.deque.com/axe/

---

*For questions or issues with MCP server configuration, refer to the comprehensive setup guide or consult the Care Collective development team.*

**Last Updated:** 2025-10-12
**Maintained By:** Development Team
