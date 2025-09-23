# Care Collective Database - Developer Onboarding Guide

**Welcome to Care Collective!** 🤝  
**Version**: 5.0 (Enterprise Developer Experience)  
**Estimated Setup Time**: 30-45 minutes  
**Target Audience**: New developers joining the Care Collective team  

## 🎯 Quick Start Checklist

- [ ] **Prerequisites**: Node.js 18+, Git, VS Code (recommended)
- [ ] **Environment Setup**: Clone repo, install dependencies
- [ ] **Database Setup**: Configure Supabase connection
- [ ] **Local Development**: Run development server
- [ ] **Testing**: Execute test suite
- [ ] **Verification**: Complete setup verification
- [ ] **Documentation Review**: Understand core concepts

**Expected Time**: 30 minutes if everything goes smoothly

## 🚀 1. Prerequisites & System Requirements

### Required Software
```bash
# Node.js (18.x or higher)
node --version  # Should be v18.x.x or higher

# Git for version control
git --version

# Optional but recommended
code --version  # VS Code
```

### Account Requirements
- **GitHub Access**: Repository access (provided by team lead)
- **Supabase Access**: Development project access (provided by DevOps)
- **Slack/Communication**: Join #care-collective-dev channel

### Development Environment
- **OS**: macOS, Linux, or Windows with WSL
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 2GB free space for dependencies

## 📥 2. Repository Setup

### Clone and Install
```bash
# Clone the repository
git clone https://github.com/your-org/care-collective-preview.git
cd care-collective-preview

# Install dependencies
npm install

# Verify installation
npm run verify
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your development credentials
# See "Environment Variables" section below
```

### Required Environment Variables
```bash
# .env.local - Development Configuration
NODE_ENV=development

# Supabase Configuration (provided by team lead)
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE=[your-service-role-key]

# Local Development Settings
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Enable debug logging
DEBUG=care-collective:*
```

## 🗄️ 3. Database Setup

### Supabase CLI Installation
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase (use provided credentials)
supabase login

# Link to development project
npm run db:link
```

### Local Database Setup
```bash
# Start local Supabase stack (optional for development)
npm run db:start

# OR use remote development database (recommended for new developers)
# Skip local setup and use shared dev environment
```

### Database Verification
```bash
# Test database connection
npm run setup:check

# Run database health check
npm run db:security-audit

# Verify RLS policies are working
npm run db:test-rls
```

### Understanding the Schema
1. **Read**: [Database Schema Documentation](./SCHEMA_DOCUMENTATION.md)
2. **Core Tables**: profiles, help_requests, contact_exchanges, messages
3. **Key Concepts**: RLS policies, audit trails, privacy-first design

## 🧪 4. Testing Setup

### Running Tests
```bash
# Run full test suite
npm test

# Run specific test categories
npm run test:database     # Database and RLS policy tests
npm run test:coverage     # Generate coverage report
npm run db:test-rls       # RLS policy specific tests

# Watch mode for development
npm run test:watch
```

### Test Structure Understanding
```
tests/
├── database/                    # Database integration tests
│   ├── rls-policies.test.ts    # RLS policy validation
│   ├── integration-flows.test.ts # User workflow tests
│   └── security-audit.test.ts  # Security vulnerability tests
├── components/                  # Component unit tests
└── api/                        # API endpoint tests
```

### Expected Test Results
- **Database Tests**: Should all pass (22 RLS policies tested)
- **Integration Tests**: End-to-end user workflows
- **Security Tests**: No vulnerabilities should be found
- **Coverage**: Should be >80% for new code

## 🌐 5. Local Development

### Starting Development Server
```bash
# Start Next.js development server
npm run dev

# Server will start at http://localhost:3000
# Hot reload enabled for development
```

### Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes and test
npm run test
npm run type-check
npm run lint

# 3. Commit with descriptive message
git add .
git commit -m "feat: add your feature description"

# 4. Push and create PR
git push origin feature/your-feature-name
```

### Code Quality Checks
```bash
# TypeScript checking
npm run type-check

# ESLint for code style
npm run lint

# Build verification
npm run build
```

## 📚 6. Understanding Care Collective

### Core Domain Concepts

#### Mutual Aid Platform
Care Collective connects community members to exchange support:
- **Help Requests**: Community members post requests for assistance
- **Resource Sharing**: Neighbors offer help through the platform
- **Contact Exchange**: Secure contact information sharing
- **Community Building**: Creating stronger neighborhood bonds

#### Key User Flows
1. **User Registration**: Signup → Profile creation → Email verification
2. **Help Request**: Create request → Community discovery → Helper connection
3. **Contact Exchange**: Helper offers → Consent request → Contact sharing
4. **Messaging**: In-app communication → Coordination → Help completion

#### Privacy & Safety
- **Privacy-First**: Contact info requires explicit consent
- **Community Safety**: Message flagging and moderation
- **Accessibility**: WCAG 2.1 AA compliance
- **Trust & Safety**: Comprehensive audit trails

### Technical Architecture

#### Technology Stack
- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Styling**: Tailwind CSS with custom design system
- **Testing**: Vitest + React Testing Library
- **Validation**: Zod schemas for type safety

#### Security Model
```typescript
// All database access uses Row Level Security (RLS)
// Example: Users can only see their own help requests
CREATE POLICY "Users can update their own help requests" 
  ON help_requests FOR UPDATE 
  USING (auth.uid() = user_id);
```

#### Design System
```typescript
// Care Collective brand colors
--sage: #7A9E99;           // Primary action color
--dusty-rose: #D8A8A0;     // Secondary accent
--primary: #BC6547;        // Terracotta - warm primary
--background: #FBF2E9;     // Cream - main background
```

## 🔧 7. Common Development Tasks

### Creating Database Migrations
```bash
# Create new migration
npm run db:migration -- "add_new_feature"

# Edit the generated file in supabase/migrations/
# Apply locally
npm run db:reset

# Test migration
npm run db:test-rls
```

### Adding New Components
```typescript
// Follow Care Collective patterns
import { ReactElement } from 'react';

interface HelpRequestCardProps {
  request: HelpRequest;
}

export function HelpRequestCard({ request }: HelpRequestCardProps): ReactElement {
  return (
    <article className="p-4 border rounded-lg bg-sage/10">
      <h3 className="text-lg font-semibold text-secondary">
        {request.title}
      </h3>
      {/* Accessible, mobile-first design */}
    </article>
  );
}
```

### API Route Development
```typescript
// app/api/help-requests/route.ts
import { createClient } from '@/lib/supabase/server';
import { helpRequestSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const supabase = createClient();
  
  // Validate input with Zod
  const body = helpRequestSchema.parse(await request.json());
  
  // RLS policies automatically enforced
  const { data, error } = await supabase
    .from('help_requests')
    .insert(body);
    
  return Response.json({ data, error });
}
```

### Writing Tests
```typescript
// tests/components/HelpRequestCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpRequestCard } from '@/components/HelpRequestCard';

describe('HelpRequestCard', () => {
  it('displays help request information clearly', () => {
    const mockRequest = {
      id: '123',
      title: 'Need groceries picked up',
      category: 'groceries' as const,
      urgency: 'urgent' as const
    };

    render(<HelpRequestCard request={mockRequest} />);
    
    expect(screen.getByText('Need groceries picked up')).toBeInTheDocument();
    expect(screen.getByRole('article')).toBeInTheDocument();
  });
});
```

## 🐛 8. Troubleshooting Common Issues

### Environment Issues
```bash
# Node version problems
nvm use 18  # or install Node 18+

# Package installation issues
rm -rf node_modules package-lock.json
npm install

# Environment variable problems
npm run verify  # Check configuration
```

### Database Connection Issues
```bash
# Verify Supabase connection
npm run setup:check

# Reset database connection
supabase login
npm run db:link

# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Build/Development Issues
```bash
# TypeScript errors
npm run type-check

# Clear Next.js cache
rm -rf .next
npm run dev

# Lint issues
npm run lint -- --fix
```

### Test Failures
```bash
# Run tests with verbose output
npm run test -- --reporter=verbose

# Check specific test file
npm run test tests/database/rls-policies.test.ts

# Update snapshots if needed
npm run test -- --update-snapshots
```

## 📖 9. Learning Resources

### Must-Read Documentation
1. **[Database Schema](./SCHEMA_DOCUMENTATION.md)** - Complete database reference
2. **[RLS Policies](./RLS_POLICIES.md)** - Security model understanding
3. **[CLAUDE.md](../CLAUDE.md)** - AI assistant guidelines and project context
4. **[Troubleshooting](./TROUBLESHOOTING_RUNBOOK.md)** - Problem resolution guide

### External Resources
- **[Next.js 15 Docs](https://nextjs.org/docs)** - Framework documentation
- **[Supabase Docs](https://supabase.com/docs)** - Database and auth platform
- **[React 19 Docs](https://react.dev)** - React framework
- **[Tailwind CSS](https://tailwindcss.com)** - Styling framework

### Code Examples
```bash
# Explore example implementations
ls app/                    # Next.js 15 app router examples
ls components/             # Reusable UI components
ls lib/                    # Utility functions and configurations
ls tests/                  # Testing examples and patterns
```

## ✅ 10. Setup Verification

### Final Verification Checklist
```bash
# 1. Environment verification
npm run verify
# ✅ Should show "Setup verification completed successfully"

# 2. Database connectivity
npm run db:security-audit
# ✅ Should show "Database Health: 90/100 (EXCELLENT)"

# 3. Test suite execution
npm run test
# ✅ All tests should pass

# 4. Development server
npm run dev
# ✅ Server should start at http://localhost:3000

# 5. Build process
npm run build
# ✅ Should complete without errors

# 6. Type checking
npm run type-check
# ✅ Should complete with no errors
```

### Success Criteria
- [ ] Local development server running
- [ ] All tests passing (database, components, integration)
- [ ] Database health score: 90/100 (EXCELLENT)
- [ ] TypeScript compilation without errors
- [ ] Can create and view help requests
- [ ] Understanding of core domain concepts

## 🎓 11. Next Steps

### First Week Goals
1. **Day 1-2**: Complete setup and read core documentation
2. **Day 3**: Explore codebase and understand data flow
3. **Day 4-5**: Complete first small feature or bug fix
4. **Week 1**: Pair programming session with team member

### Learning Path
1. **Week 1**: Core platform understanding
2. **Week 2**: Database and RLS policy deep dive
3. **Week 3**: Frontend component architecture
4. **Week 4**: Testing patterns and quality assurance

### Getting Help
- **Slack**: #care-collective-dev for development questions
- **Code Reviews**: All PRs require team review
- **Pair Programming**: Schedule with team members
- **Office Hours**: Weekly team sync for questions

## 📞 12. Support & Contact

### Team Contacts
- **Tech Lead**: Technical architecture and complex issues
- **DevOps**: Database and infrastructure questions
- **Product**: Feature requirements and user experience
- **Design**: UI/UX and accessibility guidance

### Emergency Support
- **Production Issues**: Follow [Troubleshooting Runbook](./TROUBLESHOOTING_RUNBOOK.md)
- **Security Concerns**: Immediate escalation to tech lead
- **Data Issues**: Database administrator contact

---

## 🌟 Welcome to the Team!

Care Collective is more than a platform - we're building technology that strengthens communities and helps neighbors support each other. Your work directly impacts real people getting the help they need.

### Community Values in Code
- **Accessibility**: Every feature considers users of all abilities
- **Privacy**: User consent and data protection are paramount
- **Simplicity**: Interfaces must work when people are in crisis
- **Trust**: Comprehensive testing and security measures
- **Community**: Building connections, not just transactions

### Ready to Get Started?
Run through the verification checklist above, and when everything passes, you're ready to start building features that help communities thrive!

---

**Care Collective Developer Onboarding Guide v5.0**  
*Enterprise-ready developer experience for mutual aid platform*

*Last Updated: January 2025 | Database Health: 90/100 (EXCELLENT)*