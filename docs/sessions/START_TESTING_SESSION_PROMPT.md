# Testing Session Prompt

Copy and paste this prompt to start a comprehensive testing session:

---

**TESTING SESSION START**

I need you to conduct a comprehensive testing session of the Care Collective platform at https://care-collective-preview.vercel.app

**Your Task:**
1. Follow the testing guide in `docs/sessions/COMPREHENSIVE_PLATFORM_TESTING_SESSION.md`
2. Use Playwright MCP to automate browser testing
3. Take screenshots of every page and significant state
4. Document ALL findings in organized markdown files
5. Track console errors and network issues
6. Test on both desktop and mobile viewports

**Testing Phases:**
- Phase 1: Public pages (homepage, about, contact, etc.)
- Phase 2: Authentication flow (signup, login, waitlist)
- Phase 3: Authenticated user features (dashboard, requests, messages)
- Phase 4: Admin panel (if you have admin credentials)
- Phase 5: Error states and edge cases
- Phase 6: Responsive and cross-device testing
- Phase 7: Performance and accessibility audits

**Deliverables:**
1. `TESTING_REPORT_[DATE].md` - Executive summary with findings
2. `ISSUES_FOUND_[DATE].md` - Detailed list of all bugs/issues
3. `DESIGN_IMPROVEMENTS_[DATE].md` - UX/design suggestions
4. Screenshots in `.playwright-mcp/testing-session-[DATE]/`

**Important:**
- Start with Phase 1 (public pages) and work through systematically
- Take a screenshot of EVERY page before interacting
- Document console errors immediately when you see them
- Note positive findings too (what's working well)
- Use the issue documentation template for consistency
- Test forms with both valid and invalid data
- Check mobile responsiveness for every page

**For Authentication Testing:**
You may need test credentials:
- Regular user: [ask Evan for test account]
- Admin user: [ask Evan for admin test account]
- Pending user: [create during testing]
- Rejected user: [ask Evan if available]

**Start Now:**
Begin with Phase 1.1 (Homepage testing). Navigate to https://care-collective-preview.vercel.app and start documenting your findings. Work through each checklist item methodically.

Create the testing report files as you go, and organize screenshots by phase/page.
