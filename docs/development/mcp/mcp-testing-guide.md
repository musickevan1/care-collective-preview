# MCP Servers Testing Guide - Care Collective

## 🎯 Overview

This guide provides comprehensive testing instructions for all 6 MCP servers configured for the Care Collective project. After restarting Claude Code, you can use these commands to test each server.

## 🔧 Core Development Tools

### GitHub MCP Server
**Purpose**: Repository management, code analysis, and collaboration

**Test Commands:**
```bash
# Repository Operations
"List the Care Collective repository files"
"Show me recent commits in the repository"
"Check for any open issues in the repository"
"What pull requests are currently open?"

# Code Analysis
"Show me the project structure"
"Find all TypeScript files in the components directory"
"What's the latest commit message?"
"Are there any recent changes to the database files?"
```

**Expected Results:**
- File listings from `musickevan1/care-collective-preview`
- Commit history and messages
- Issue and PR status
- Repository structure analysis

### Supabase MCP Server
**Purpose**: Database operations and schema analysis

**Test Commands:**
```bash
# Database Schema
"Show me all tables in the Supabase database"
"Describe the help_requests table structure"
"What are the relationships between tables?"
"Show me the RLS policies for the profiles table"

# Data Analysis
"How many rows are in each table?"
"What columns does the messages table have?"
"Show me the foreign key relationships"
"What indexes exist on the help_requests table?"
```

**Expected Results:**
- Complete database schema listings
- Table structures with columns and types
- RLS policy information
- Database relationships and constraints

### ESLint MCP Server
**Purpose**: Code quality and TypeScript enforcement

**Test Commands:**
```bash
# Code Quality Analysis
"Run ESLint on the Care Collective codebase"
"Check for TypeScript errors in the components directory"
"Analyze code quality issues in the app directory"
"What ESLint rules are currently configured?"

# Specific File Analysis
"Lint the app/requests/page.tsx file"
"Check accessibility rules in components/ui/"
"Validate TypeScript strict mode compliance"
"Find any unused imports or variables"
```

**Expected Results:**
- ESLint warnings and errors
- TypeScript type checking results
- Code quality recommendations
- Accessibility rule violations

## 🎯 Quality Assurance Tools

### A11y MCP Server (Axe-Core)
**Purpose**: Accessibility testing and WCAG compliance

**Test Commands:**
```bash
# Accessibility Audits
"Check https://care-collective-preview.vercel.app/ for accessibility issues"
"Audit the Care Collective homepage for WCAG 2.1 AA compliance"
"Test the login page for screen reader compatibility"
"Check accessibility of the help requests form"

# Specific WCAG Testing
"Test color contrast ratios on the main site"
"Check keyboard navigation accessibility"
"Validate alt text for all images"
"Test form accessibility and labels"
```

**Expected Results:**
- Accessibility violation reports
- WCAG compliance scores
- Screen reader compatibility issues
- Keyboard navigation problems

### Lighthouse MCP Server
**Purpose**: Performance monitoring and Core Web Vitals

**Test Commands:**
```bash
# Performance Analysis
"Run a Lighthouse audit on https://care-collective-preview.vercel.app/"
"Check Core Web Vitals for the Care Collective homepage"
"Test mobile performance of the help requests page"
"Analyze SEO score for the main site"

# Specific Metrics
"Get performance score for the dashboard page"
"Check Largest Contentful Paint (LCP) metrics"
"Test Cumulative Layout Shift (CLS) scores"
"Analyze First Input Delay (FID) performance"
```

**Expected Results:**
- Performance scores (0-100)
- Core Web Vitals metrics
- SEO and accessibility scores
- Optimization recommendations

### Playwright MCP Server
**Purpose**: UI automation and browser testing

**Test Commands:**
```bash
# UI Testing (requires browser installation)
"Take a screenshot of the Care Collective homepage"
"Navigate to the login page and capture it"
"Test the signup form interaction"
"Check responsive design on mobile viewport"

# Automation Testing
"Fill out the help request form with test data"
"Test the login flow with test credentials"
"Check navigation between pages"
"Validate form error handling"
```

**Expected Results:**
- Screenshots of pages
- UI interaction automation
- Form testing results
- Navigation flow validation

## 🧪 Comprehensive Testing Workflow

### 1. **Quick Status Check**
```bash
"What MCP resources are available?"
"List all connected MCP servers"
```

### 2. **Care Collective Specific Tests**
```bash
# Full Site Analysis
"Run a complete accessibility audit on the Care Collective site"
"Perform a comprehensive performance analysis"
"Check code quality across the entire project"
"Validate database schema for the mutual aid platform"

# Feature-Specific Testing
"Test the help request creation flow for accessibility and performance"
"Analyze the contact exchange feature for privacy compliance"
"Check the admin dashboard for code quality and performance"
"Validate the messaging system database structure"
```

### 3. **Integration Testing**
```bash
# Cross-Server Analysis
"Analyze the help requests page for performance, accessibility, and code quality"
"Check database queries and frontend implementation for the dashboard"
"Validate the entire user signup flow from code to database to UI"
"Test the admin panel for compliance, performance, and code standards"
```

## 🔍 Expected Benefits for Care Collective

### **Community Safety & Accessibility**
- WCAG 2.1 AA compliance validation
- Screen reader compatibility testing
- Mobile-first performance optimization
- Inclusive design verification

### **Development Quality**
- TypeScript strict mode enforcement
- Accessibility rule compliance
- Performance budget monitoring
- Code quality standards

### **Platform Reliability**
- Database schema validation
- API endpoint testing
- Performance monitoring
- Error detection and prevention

## 🚨 Troubleshooting

### **If MCP servers don't respond:**
1. Restart Claude Code
2. Check if all packages are available via npx
3. Verify internet connection for external services
4. Check Claude Code MCP configuration syntax

### **If specific tests fail:**
- **GitHub**: Verify repository access and token permissions
- **Supabase**: Check project ref and token validity
- **ESLint**: Ensure project has ESLint configuration
- **A11y**: Verify target URLs are accessible
- **Lighthouse**: Check network connectivity
- **Playwright**: Install browsers with `npx playwright install chrome`

## 🎯 Success Criteria

Your MCP setup is successful when:
- ✅ All 6 servers respond to test commands
- ✅ GitHub operations return repository data
- ✅ Supabase shows database schema
- ✅ ESLint provides code quality feedback
- ✅ A11y returns accessibility reports
- ✅ Lighthouse provides performance scores
- ✅ Playwright can navigate pages (with browsers installed)

---

**🚀 Ready to enhance your Care Collective development workflow with comprehensive MCP server integration!**