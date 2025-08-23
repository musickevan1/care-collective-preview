# Pull Request

## 📋 Description

<!-- Provide a brief description of what this PR does -->

### Type of Change
<!-- Check the relevant option -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)  
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Code refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Security enhancement
- [ ] PRP implementation
- [ ] CI/CD pipeline update

## 🔗 Related Issues

<!-- Link any related issues, PRPs, or tickets -->
- Closes #
- Related to #
- Implements PRP: 

## 📝 Changes Made

<!-- List the main changes in this PR -->
- 
- 
- 

## 🧪 Testing

<!-- Describe how you tested your changes -->

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated  
- [ ] Manual testing completed
- [ ] E2E tests pass

### Test Results
<!-- Paste test results or coverage reports if relevant -->
```
Coverage: X% (target: 80%)
Tests: X passing, X failing
```

## 🔒 Security Considerations

<!-- Check all that apply -->
- [ ] No sensitive data exposed
- [ ] Input validation implemented
- [ ] Authentication/authorization considered
- [ ] SQL injection prevention measures
- [ ] XSS prevention measures
- [ ] CSRF protection in place
- [ ] Security headers configured
- [ ] Dependencies audited

## 📱 Accessibility

<!-- Check all that apply -->
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast meets WCAG standards
- [ ] Alt text provided for images
- [ ] Semantic HTML used
- [ ] Focus management implemented

## 🎯 Performance Impact

<!-- Describe any performance implications -->
- [ ] No performance regression
- [ ] Bundle size impact: +/- X KB
- [ ] Database query optimization
- [ ] Caching strategy implemented
- [ ] Performance tested

### Lighthouse Scores (if applicable)
- Performance: X%
- Accessibility: X%
- Best Practices: X%
- SEO: X%

## 🏗 PRP Compliance (if applicable)

<!-- For PRPs implementation, check compliance -->
- [ ] Context section completed with technical details
- [ ] Implementation strategy clearly defined
- [ ] Validation gates implemented
- [ ] Success criteria met
- [ ] Care Collective specific requirements addressed

### PRP Validation
- [ ] PRP structure follows methodology
- [ ] Technical specificity included
- [ ] File references provided
- [ ] Actionable implementation steps

## 📸 Screenshots/Demo

<!-- Add screenshots, GIFs, or demo links if applicable -->

| Before | After |
|--------|-------|
| ![Before](url) | ![After](url) |

## 🚀 Deployment Notes

<!-- Any special deployment considerations -->
- [ ] Database migrations required
- [ ] Environment variables needed
- [ ] Feature flags to toggle
- [ ] Cache invalidation required
- [ ] Third-party service configuration

### Environment Variables
<!-- List any new environment variables -->
```
NEW_VAR=value
UPDATED_VAR=new_value
```

## ✅ Pre-submission Checklist

<!-- Check all items before submitting -->

### Code Quality
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is well-commented
- [ ] No console.log statements in production code
- [ ] TypeScript types are properly defined
- [ ] ESLint passes locally
- [ ] Prettier formatting applied

### Testing
- [ ] Tests pass locally
- [ ] Coverage threshold met (80%)
- [ ] Edge cases considered
- [ ] Error handling tested

### Documentation
- [ ] Code is self-documenting
- [ ] README updated (if needed)
- [ ] API documentation updated (if needed)
- [ ] Changelog updated (if needed)

### Security
- [ ] No hardcoded secrets
- [ ] Input sanitization implemented
- [ ] Error messages don't expose sensitive info
- [ ] Dependencies are up to date

### Care Collective Specific
- [ ] User experience aligns with Care Collective mission
- [ ] Accessibility considerations for vulnerable populations
- [ ] Data privacy and protection measures
- [ ] Community safety features considered

## 🔄 Post-Merge Tasks

<!-- Tasks to complete after merging -->
- [ ] Deploy to staging
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Monitor for issues
- [ ] Update related tickets

## 💬 Additional Notes

<!-- Any additional context, concerns, or discussion points -->

---

## 🏷 Labels

<!-- Add relevant labels to categorize this PR -->
<!-- Common labels: bug, enhancement, documentation, security, performance, breaking-change, needs-review -->

## 📞 Contact

For questions about this PR, please:
- Comment on this PR
- Reach out to @username on Slack
- Contact the relevant team in CODEOWNERS

---

**Review Instructions for Reviewers:**

1. **Code Quality**: Check for clean, readable, and maintainable code
2. **Functionality**: Verify the changes work as intended
3. **Security**: Look for potential security vulnerabilities
4. **Performance**: Consider any performance implications
5. **Documentation**: Ensure adequate documentation
6. **Testing**: Verify appropriate test coverage
7. **Care Collective Mission**: Ensure changes align with our values

**Automated Checks:**
- ✅ All CI/CD pipeline checks must pass
- ✅ Code coverage must meet 80% threshold
- ✅ Security scans must pass
- ✅ Performance benchmarks must be met
- ✅ PRP validation (if applicable)