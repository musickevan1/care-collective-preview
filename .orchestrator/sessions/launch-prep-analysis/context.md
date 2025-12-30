# Orchestration Context: launch-prep-analysis

## Original Request
Create an in-depth analysis of the current state of the Care Collective project and develop an extensive plan to prepare the platform for launch by January 1, 2026. Go through all documentation, client emails, and planning files to determine what has been done and what still needs to be done. Focus on polishing UI/UX, backend database schemas, code files, and existing features. **Do NOT add new features** that are not in the launch plans.

## Specific Issues to Address

### UI/UX Issues (5 issues)
1. **Hero Section CARE Logo**: Remove or reposition the CARE logo from hero section (doesn't fit right)
2. **Profile Page**: Caregiver situation breadcrumbs suggestion text - remove "supporting two young children as a single parent", keep only first option
3. **Dashboard Page**: Make "Your Requests" box same height as the two boxes next to it
4. **Help Requests Page**: Fix advanced filter - when switching to urgency level, Sort order dropdown should show "Most urgent"/"Least urgent"
5. **Messages Page**: First-time tutorial is very glitchy and needs significant improvement

### System Verification Issues (2 issues)
6. **Notifications System**: Verify functionality (5 notification types via Resend)
7. **Admin Tools (CMS)**: Check functionality and fix any issues

## Current Platform Status
- **Launch Date**: January 1, 2026
- **Overall Readiness**: 72/100 (72%)
- **Phase 3 (Production Readiness)**: 0% complete
- **Platform Health**: 90% excellent
- **Build Status**: ✅ Passing
- **TypeScript**: ✅ Zero errors
- **ESLint**: ✅ Passing
- **Test Coverage**: 80%+
- **Accessibility**: WCAG 2.1 AA compliant

## Key Documentation to Review
1. `docs/launch-2026/LAUNCH_PREPARATION_PLAN.md`
2. `docs/launch-2026/MASTER_PLAN.md`
3. `PROJECT_STATUS.md`
4. `docs/client/` (all files)
5. `docs/context-engineering/` (master-plan.md, PRP method)

## Success Criteria
- All 7 specific issues have been investigated and documented
- Comprehensive todo list covers all launch preparation needs
- Tasks are prioritized with clear launch blockers identified
- Implementation plan is realistic for January 1, 2026 launch
- Plan is ready for immediate execution by implementation agents

## Constraints
- **DO NOT add new features** - Only polish, fixes, and verification
- **Follow existing patterns** - Use established code style and component patterns
- **Maintain accessibility** - All changes must maintain WCAG 2.1 AA compliance
- **Mobile-first** - Ensure all UI changes work well on mobile
- **Privacy-first** - Don't compromise privacy controls or consent flows
- **Reference existing documentation** - Use CLAUDE.md, phase documents, and existing plans

## Execution Approach

### Group A (Parallel - Discovery & Investigation)
Each agent should find and examine the relevant files, understand current implementation, identify the specific code that needs to be modified, and provide:
- File paths of relevant components
- Current behavior/issue description
- Expected behavior after fix
- Specific code changes needed
- Testing approach

### Group B (Sequential - Analysis & Planning)
After Group A completes:
- Synthesize all findings
- Create comprehensive prioritized todo list
- Create day-by-day implementation schedule through January 1, 2026
- Document risks and mitigation strategies
- Create final launch checklist

## Investigation Tasks (Group A)

### Agent 1: Hero Section Investigation
**Task**: Find and analyze the hero section component. Locate the CARE logo that needs to be removed or repositioned. Identify the file structure and current layout implementation.

### Agent 2: Profile Page Investigation
**Task**: Find and analyze the profile page component. Locate the caregiver situation breadcrumbs suggestion text. Identify where "supporting two young children as a single parent" text appears and how to remove it while keeping the first option.

### Agent 3: Dashboard Page Investigation
**Task**: Find and analyze the dashboard page component. Identify the "Your Requests" box and the two boxes next to it. Understand the current layout/height differences and how to make them equal height.

### Agent 4: Help Requests Page Investigation
**Task**: Find and analyze the help requests page with advanced filter functionality. Locate the filter logic where urgency level switching should update the Sort order dropdown options to show "Most urgent"/"Least urgent".

### Agent 5: Messages Page Investigation
**Task**: Find and analyze the messages page with tutorial/empty state implementation. Identify what's glitchy about the first-time tutorial and document specific issues.

### Agent 6: Notifications System Investigation
**Task**: Review the notifications system implementation. Verify all 5 notification types via Resend are working correctly. Document current state and any issues found.

### Agent 7: Admin Tools Investigation
**Task**: Review the admin tools/CMS functionality. Identify all admin features, test key workflows, and document any issues or improvements needed.

### Agent 8: Documentation Review
**Task**: Review all launch preparation documentation, client files, and planning documents. Understand the full scope of what's been done and what remains. Synthesize current state assessment.

## Deliverable
Create `.orchestrator/sessions/launch-prep-analysis/01-launch-prep-plan.md` containing:
1. Executive Summary - Current state assessment and launch readiness score
2. Completed Work Inventory - What's done and verified
3. Critical Issues Detail - Each of the 7 specific issues with current behavior, expected behavior, files to modify, specific change required, testing approach
4. Comprehensive Task List - All tasks organized by category
5. Implementation Schedule - Day-by-day plan through launch
6. Risk Assessment - Potential blockers and mitigation strategies
7. Launch Checklist - Final verification items
