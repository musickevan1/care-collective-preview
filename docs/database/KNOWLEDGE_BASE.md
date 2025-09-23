# Care Collective Knowledge Base

**Central Documentation Hub**  
**Version**: 5.0 (Enterprise Knowledge Management)  
**Last Updated**: January 2025  
**Purpose**: Centralized access to all Care Collective documentation and resources  

## 📚 Documentation Structure

### Quick Navigation
- [🚀 Getting Started](#-getting-started)
- [🗄️ Database & Architecture](#-database--architecture)
- [🔐 Security & Privacy](#-security--privacy)
- [🧪 Testing & Quality](#-testing--quality)
- [🚨 Operations & Support](#-operations--support)
- [💡 Development & Features](#-development--features)
- [📖 Reference & API](#-reference--api)

---

## 🚀 Getting Started

### New Team Members
- **[Developer Onboarding Guide](./DEVELOPER_ONBOARDING.md)** ⭐
  - Complete setup instructions (30-45 min)
  - Environment configuration
  - Verification checklist
  - First week learning path

- **[Project Overview (CLAUDE.md)](../CLAUDE.md)** ⭐
  - Care Collective mission and values
  - Technical architecture overview
  - Development guidelines and patterns
  - AI assistant context and instructions

### Quick Setup
```bash
# Clone and setup (5 minutes)
git clone [repo-url]
cd care-collective-preview
npm install
cp .env.example .env.local
npm run verify
```

### Core Concepts
- **Mutual Aid Platform**: Connecting neighbors for community support
- **Privacy-First**: Explicit consent for all contact information sharing
- **Accessibility**: WCAG 2.1 AA compliance throughout
- **Trust & Safety**: Comprehensive audit trails and moderation

---

## 🗄️ Database & Architecture

### Essential Documentation
- **[Database Schema Documentation](./SCHEMA_DOCUMENTATION.md)** ⭐
  - Complete table structure and relationships
  - RLS policy overview
  - Performance optimization details
  - Health monitoring (90/100 EXCELLENT)

- **[RLS Policies Reference](./RLS_POLICIES.md)**
  - 22 documented security policies
  - Privacy protection patterns
  - Policy testing procedures
  - Security model explanation

### Migration Management
- **[Migration History](./MIGRATION_HISTORY.md)**
  - 15 active migrations documented
  - Migration dependency mapping
  - Rollback procedures
  - Archive system for obsolete migrations

### Database Tools
```bash
# Health monitoring
npm run db:security-audit        # Security assessment
scripts/analyze-query-performance.sql  # Performance analysis
scripts/db-maintenance.sh        # Automated maintenance

# Development tools
npm run db:reset                 # Reset local database
npm run db:types                 # Generate TypeScript types
npm run db:test-rls             # Test RLS policies
```

---

## 🔐 Security & Privacy

### Security Framework
- **Row Level Security (RLS)**: 22 policies protecting user data
- **Contact Exchange Privacy**: Explicit consent for all contact sharing
- **Audit Trails**: Comprehensive logging for compliance
- **Security Status**: SECURE (automated vulnerability scanning)

### Privacy Protection
```typescript
// Example: Privacy-first contact access
export async function getContactInfoWithConsent(
  requestId: string, 
  userId: string
): Promise<ContactInfo | null> {
  // Requires explicit consent verification
  // Full audit trail logging
  // RLS policies automatically enforced
}
```

### Security Tools
- **Automated Security Audit**: `npm run db:security-audit`
- **RLS Policy Testing**: Comprehensive test coverage
- **Vulnerability Scanning**: Regular automated checks
- **Privacy Compliance**: GDPR-ready data handling

---

## 🧪 Testing & Quality

### Testing Infrastructure
- **Test Coverage**: 80%+ across critical components
- **Database Testing**: All 22 RLS policies tested
- **Integration Testing**: End-to-end user workflows
- **Security Testing**: Automated vulnerability scanning

### Running Tests
```bash
# Full test suite
npm test                         # All tests
npm run test:coverage           # Coverage report
npm run test:database           # Database integration tests
npm run db:test-rls            # RLS policy validation

# Development testing
npm run test:watch              # Watch mode
npm run test:ui                 # Visual test runner
```

### Quality Assurance
- **TypeScript**: Strict type checking (`npm run type-check`)
- **ESLint**: Code style enforcement (`npm run lint`)
- **Pre-commit Hooks**: Automated quality checks
- **Code Reviews**: Required for all changes

---

## 🚨 Operations & Support

### Incident Response
- **[Troubleshooting Runbook](./TROUBLESHOOTING_RUNBOOK.md)** ⭐
  - Emergency contact information
  - Common issue resolution
  - Diagnostic commands and procedures
  - Escalation procedures by severity

### Monitoring & Maintenance
- **Database Health**: 90/100 (EXCELLENT) monitoring
- **Performance Analysis**: Query optimization tools
- **Automated Maintenance**: Weekly maintenance scripts
- **Real-time Monitoring**: Health check procedures

### Support Resources
```bash
# Emergency diagnostics
npm run setup:check             # Verify system health
npm run db:security-audit       # Security assessment
scripts/analyze-query-performance.sql  # Performance analysis

# Maintenance tools
scripts/db-maintenance.sh       # Database maintenance
scripts/security-audit.js       # Security scanning
```

---

## 💡 Development & Features

### Development Workflow
1. **Feature Branch**: `git checkout -b feature/feature-name`
2. **Development**: Code changes with tests
3. **Quality Checks**: `npm run type-check && npm run lint && npm test`
4. **Code Review**: Team review required
5. **Deployment**: Automated CI/CD pipeline

### Core Feature Areas
- **Help Request System**: Community request management
- **Contact Exchange**: Privacy-protected contact sharing
- **Messaging System**: In-app communication
- **User Profiles**: Community member management
- **Admin Dashboard**: Platform oversight and moderation

### Development Tools
```bash
# Development server
npm run dev                     # Next.js dev server with hot reload

# Code quality
npm run type-check             # TypeScript validation
npm run lint                   # ESLint checking
npm run build                  # Production build verification

# Database development
npm run db:migration -- "name"  # Create new migration
npm run db:reset               # Reset development database
```

---

## 📖 Reference & API

### API Documentation
- **[API Endpoints](./API_DOCUMENTATION.md)**
  - RESTful API reference
  - Authentication patterns
  - Data validation schemas
  - Error handling

### Technical Reference
- **TypeScript Types**: Auto-generated from database schema
- **Component Library**: Reusable UI components with Care Collective design
- **Utility Functions**: Common helper functions and patterns
- **Environment Configuration**: Development, staging, and production setup

### Code Examples
```typescript
// Help Request Creation
const helpRequestSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().max(500).optional(),
  category: z.enum(['groceries', 'transport', 'household', 'medical', 'other']),
  urgency: z.enum(['normal', 'urgent', 'critical']).default('normal')
});

// Contact Exchange with Privacy
await initiateContactExchange(requestId, message, explicitConsent);
```

---

## 🔍 Search & Discovery

### Finding Information
Use the search patterns below to quickly locate relevant documentation:

#### By Topic
- **Setup**: Developer Onboarding, Environment Configuration
- **Database**: Schema Documentation, RLS Policies, Migration History
- **Security**: Security Audit, Privacy Protection, RLS Testing
- **Troubleshooting**: Runbook, Common Issues, Emergency Procedures
- **Testing**: Test Coverage, RLS Policy Testing, Quality Assurance

#### By Role
- **New Developers**: Developer Onboarding → CLAUDE.md → Schema Documentation
- **Database Admins**: Schema Documentation → Troubleshooting Runbook → Migration History
- **DevOps Engineers**: Troubleshooting Runbook → Security Audit → Performance Analysis
- **Product Managers**: CLAUDE.md → API Documentation → Feature Documentation

#### By Task
- **Adding Features**: CLAUDE.md → Schema Documentation → API Documentation
- **Fixing Bugs**: Troubleshooting Runbook → Test Coverage → Code Examples
- **Security Review**: RLS Policies → Security Audit → Privacy Documentation
- **Performance Issues**: Performance Analysis → Database Maintenance → Optimization Guide

---

## 📅 Documentation Maintenance

### Update Schedule
- **Weekly**: Database health scores and performance metrics
- **Monthly**: Security audit results and vulnerability assessments
- **Quarterly**: Complete documentation review and updates
- **As Needed**: Feature additions, bug fixes, and architectural changes

### Contribution Guidelines
1. **Accuracy**: All documentation must reflect current implementation
2. **Completeness**: Include examples, code snippets, and expected outputs
3. **Accessibility**: Clear language, good structure, searchable content
4. **Version Control**: Track changes and maintain version history

### Documentation Standards
- **Markdown**: Consistent formatting and structure
- **Code Examples**: Working, tested code snippets
- **Screenshots**: Up-to-date UI examples where relevant
- **Links**: Working internal and external references

---

## 🎯 Quick Reference Cards

### Daily Development
```bash
npm run dev                     # Start development
npm run test:watch             # Run tests in watch mode
npm run type-check             # TypeScript validation
npm run db:reset               # Reset database
```

### Database Operations
```bash
npm run db:security-audit      # Security check
npm run db:test-rls           # Test RLS policies
npm run setup:check           # Verify setup
scripts/db-maintenance.sh     # Database maintenance
```

### Emergency Procedures
```bash
# Check system health
npm run setup:check && npm run db:security-audit

# Diagnose performance issues
psql -f scripts/analyze-query-performance.sql

# Review recent errors
tail -f /var/log/care-collective/error.log
```

---

## 📞 Getting Help

### Internal Support
- **Slack**: #care-collective-dev for development questions
- **Team Leads**: Technical architecture and complex issues
- **Office Hours**: Weekly team sync for questions
- **Pair Programming**: Schedule with team members

### External Resources
- **[Supabase Docs](https://supabase.com/docs)**: Database platform documentation
- **[Next.js 15 Docs](https://nextjs.org/docs)**: Framework documentation
- **[React 19 Docs](https://react.dev)**: React framework
- **[PostgreSQL Docs](https://www.postgresql.org/docs/)**: Database reference

### Emergency Contact
- **Production Issues**: Follow escalation in Troubleshooting Runbook
- **Security Incidents**: Immediate escalation to tech lead
- **Data Concerns**: Database administrator contact

---

**Care Collective Knowledge Base v5.0**  
*Centralized documentation for enterprise-ready mutual aid platform*

*Last Updated: January 2025 | Documentation Coverage: 95% | Database Health: 90/100 (EXCELLENT)*