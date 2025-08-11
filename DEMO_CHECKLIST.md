# Care Collective - Demo Checklist

Use this checklist to ensure everything is ready for a smooth client demo.

## 🗓️ 24 Hours Before Demo

### Database Preparation
- [ ] **Apply all migrations**
  ```sql
  -- Run in Supabase SQL Editor
  scripts/apply-all-migrations.sql
  ```
- [ ] **Seed demo data**
  ```sql
  -- Run in Supabase SQL Editor  
  scripts/seed-demo.sql
  ```
- [ ] **Verify database setup**
  ```bash
  node scripts/verify-setup.js
  ```
- [ ] **Check demo data summary**
  ```sql
  -- Run in Supabase SQL Editor
  SELECT * FROM demo_summary;
  ```

### Environment Setup
- [ ] **Environment variables configured**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE`
  - `NEXT_PUBLIC_SITE_URL`
- [ ] **Feature flags set appropriately**
  - Design system hidden in production
  - Unfinished features disabled
- [ ] **Dependencies up to date**
  ```bash
  npm install
  ```

## 🕐 2 Hours Before Demo

### Application Testing
- [ ] **Start development server**
  ```bash
  npm run dev
  ```
- [ ] **Test health endpoint**
  ```bash
  curl http://localhost:3000/api/health
  ```
- [ ] **Verify homepage loads**
  - Visit `http://localhost:3000`
  - Check all links work
  - Confirm design system links are hidden

### Demo Account Setup
- [ ] **Create admin account**
  - Sign up with admin email
  - Set `is_admin = true` in database
  - Test admin panel access
- [ ] **Create regular user account**
  - Sign up with demo email
  - Test dashboard access
  - Verify profile creation

### Functionality Testing
- [ ] **Authentication flow**
  - Signup works
  - Login works
  - Logout works
  - Redirects work properly
- [ ] **Request creation**
  - Form submits successfully
  - Request appears in list
  - All fields save correctly
- [ ] **Admin capabilities**
  - Can view all requests
  - Can change request status
  - Audit logging works
- [ ] **Status workflow**
  - Open → In Progress works
  - In Progress → Completed works
  - Timestamps update correctly

## 🕑 30 Minutes Before Demo

### Final Checks
- [ ] **Browser preparation**
  - Clear cache and cookies
  - Open fresh browser window
  - Bookmark key URLs
- [ ] **Demo data verification**
  - Check request variety (categories, urgencies, statuses)
  - Verify user profiles exist
  - Confirm admin permissions
- [ ] **Network connectivity**
  - Stable internet connection
  - Supabase accessible
  - Local server running

### Backup Preparation
- [ ] **Screenshots ready**
  - Key pages captured
  - Error states documented
  - Design examples saved
- [ ] **Reset scripts accessible**
  - `scripts/reset-demo.sql` ready
  - `scripts/seed-demo.sql` ready
  - Know how to quickly recover

## 🎬 During Demo

### Live Monitoring
- [ ] **Server status**
  - Development server running
  - No console errors
  - Database responsive
- [ ] **User experience**
  - Pages load quickly
  - Forms submit smoothly
  - Navigation works correctly
- [ ] **Demo flow**
  - Follow script timing
  - Show key features
  - Handle questions gracefully

### Troubleshooting Ready
- [ ] **Common issues prepared**
  - Authentication problems
  - Database connection issues
  - Missing demo data
- [ ] **Quick fixes available**
  - Server restart command
  - Database reset procedure
  - Backup demo accounts

## 🔧 Emergency Procedures

### If Database Issues Occur
1. **Reset demo data:**
   ```sql
   -- In Supabase SQL Editor
   scripts/reset-demo.sql
   scripts/seed-demo.sql
   ```

2. **Verify setup:**
   ```bash
   node scripts/verify-setup.js
   ```

### If Server Won't Start
1. **Kill existing processes:**
   ```bash
   pkill -f "next dev"
   ```

2. **Clear cache and restart:**
   ```bash
   rm -rf .next
   npm run dev
   ```

### If Authentication Fails
1. **Check environment variables**
2. **Verify Supabase connection**
3. **Use backup accounts**
4. **Show UI/UX instead of functionality**

## ✅ Post-Demo Checklist

### Immediate Actions
- [ ] **Gather feedback notes**
- [ ] **Document any issues encountered**
- [ ] **Note client questions and concerns**
- [ ] **Schedule follow-up if needed**

### Data Cleanup
- [ ] **Reset demo data if needed**
- [ ] **Clear test accounts**
- [ ] **Update demo data for next time**

### Follow-up Planning
- [ ] **Prioritize feedback items**
- [ ] **Update development roadmap**
- [ ] **Plan next demo or milestone**

## 📋 Demo Day Supplies

### Technical Setup
- [ ] Laptop with stable power
- [ ] Reliable internet connection
- [ ] Backup internet (mobile hotspot)
- [ ] External monitor/projector adapter
- [ ] Presentation remote (if needed)

### Documentation
- [ ] Demo script printed/accessible
- [ ] This checklist available
- [ ] Key URLs bookmarked
- [ ] Contact info for technical support

### Backup Materials
- [ ] Screenshots of key features
- [ ] Video recording of successful demo run
- [ ] Technical architecture diagrams
- [ ] Feature comparison charts

## 🎯 Success Criteria

The demo is successful if you can demonstrate:
- [ ] **Complete user journey** (signup → request → help → completion)
- [ ] **Admin oversight capabilities** (status management, audit logs)
- [ ] **Professional design and UX** (clean, accessible, intuitive)
- [ ] **Technical reliability** (fast, responsive, error-free)
- [ ] **Scalability confidence** (handles multiple users, requests)

## 📞 Emergency Contacts

- **Technical Lead:** [Your contact info]
- **Database Admin:** [Supabase support or your DBA]
- **Project Manager:** [PM contact info]
- **Client Contact:** [Primary client contact]

---

**Remember:** The goal is to show a polished, professional application that demonstrates the value of community mutual aid. Focus on user experience and community impact rather than technical details.

**Last Updated:** [Current Date]  
**Next Review:** [Before next demo]