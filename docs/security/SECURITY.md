# Security Guidelines - Care Collective Preview

This document outlines security best practices for the Care Collective Preview project to prevent secret leaks and maintain secure development practices.

## 🚨 Immediate Actions After Secret Leak

If secrets are accidentally committed:

1. **Immediately revoke/rotate the leaked secrets**
   - Supabase: Go to Settings → API → Reset service role key
   - Generate new API keys
   - Update environment variables in deployment platforms

2. **Remove secrets from git history**
   ```bash
   # For recent commits
   git reset --soft HEAD~1
   git reset HEAD .
   
   # For older commits, consider using git-filter-repo or BFG
   ```

3. **Update all deployment environments**
   - Vercel: Update environment variables
   - Local development: Update .env.local files
   - CI/CD: Update secret stores

## 🔒 Prevention Measures

### Environment Variables

- **NEVER** commit `.env` files or files containing real secrets
- Use `.env.example` with placeholder values for documentation
- Store real secrets in:
  - Local development: `.env.local` (gitignored)
  - Production: Platform environment variables (Vercel, etc.)

### File Patterns to Never Commit

```
.env
.env.local
.env.production
.env.*.local
*.key
*.pem
*.p12
*.pfx
secrets.json
config.json
```

### Documentation Security

- Use placeholder values in all documentation
- Examples:
  - ✅ `SUPABASE_URL=your_supabase_project_url`
  - ❌ `SUPABASE_URL=https://your-project-id.supabase.co` (Never use real URLs in docs)

## 🛡️ Security Tools

### Pre-commit Hook

A pre-commit hook is installed that scans for:
- JWT tokens (eyJ...)
- API key patterns
- Supabase URLs in code
- Dangerous file types

To test the hook:
```bash
# This should be blocked
echo "SUPABASE_SERVICE_ROLE=your_supabase_service_role_key_here" > test.txt
git add test.txt
git commit -m "test"  # Should fail
```

### Manual Secret Scanning

Use these commands to scan for potential secrets:

```bash
# Scan for JWT tokens
grep -r "eyJ[A-Za-z0-9_/+-]*\.[A-Za-z0-9_/+-]*\.[A-Za-z0-9_/+-]*" . --exclude-dir=node_modules --exclude-dir=.git

# Scan for Supabase URLs
grep -r "supabase\.co" . --exclude-dir=node_modules --exclude-dir=.git

# Scan for service role assignments
grep -r "service_role.*=.*eyJ" . --exclude-dir=node_modules --exclude-dir=.git
```

## 📋 Security Checklist

Before committing:
- [ ] No real API keys or secrets in files
- [ ] All sensitive data uses environment variables
- [ ] Documentation uses placeholder values
- [ ] .env files are in .gitignore
- [ ] Pre-commit hook is active

Before deploying:
- [ ] Environment variables set in deployment platform
- [ ] No secrets in build logs
- [ ] Service role key is fresh (not leaked)
- [ ] CORS and authentication properly configured

## 🔍 Regular Security Audits

### Monthly Checks
- Review all environment variables
- Rotate service role keys
- Check git history for accidental commits
- Update dependencies for security patches

### Tools for Ongoing Security
- GitHub secret scanning (if using GitHub)
- Dependabot for dependency updates
- Regular Supabase security reviews

## 🚨 Incident Response

If a secret is leaked:

1. **Immediate (within 1 hour)**
   - Revoke the leaked secret
   - Generate new credentials
   - Update all environments

2. **Short-term (within 24 hours)**
   - Review git history for other potential leaks
   - Update security documentation
   - Notify team members

3. **Long-term (within 1 week)**
   - Implement additional security measures
   - Review and update security policies
   - Consider additional tooling

## 📞 Contact

For security concerns or questions:
- Review this document first
- Check with team lead before making security-related changes
- Document any security incidents for future reference

---

**Remember: Security is everyone's responsibility. When in doubt, ask!**