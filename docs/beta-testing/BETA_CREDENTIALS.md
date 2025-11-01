# Beta Testing Credentials - Care Collective

**Last Updated**: November 1, 2025
**Environment**: Production (https://care-collective-preview.vercel.app)
**Database**: CLEAN SLATE - All old data deleted, fresh test data loaded

---

## 🔐 Admin Accounts

### Dev Admin (Evan)
- **Email**: `evanmusick@admin.org`
- **Password**: `uBrwz57KH359T&fLeXzn`
- **Permissions**: Full admin access, can approve users, view all data
- **User ID**: `05d470ae-7a84-4dc5-b7c4-ad6ca575b105`

### Client Admin (Maureen)
- **Email**: `maureentempleman@admin.org`
- **Password**: `MgSvjZM634SYqsVEKvw@`
- **Permissions**: Full admin access, can approve users, view all data
- **User ID**: `800d7000-cf22-435b-a46d-380361541120`

---

## 👥 Beta Test Users

### Alice Martinez (Springfield, MO)
- **Email**: `alice.test@carecollective.com`
- **Password**: `BetaTest2025!`
- **Status**: Approved user
- **Has**: 2 active help requests (groceries, tech help)
- **Has**: 1 conversation with Bob about groceries
- **User ID**: `ad12463a-0e65-4608-ab95-b5aa6e3a4f9f`

### Bob Johnson (Branson, MO)
- **Email**: `bob.test@carecollective.com`
- **Password**: `BetaTest2025!`
- **Status**: Approved user
- **Has**: 2 active help requests (doctor ride, companionship)
- **Has**: 1 conversation with Alice (helping with groceries)
- **User ID**: `f3452352-255d-4fbf-9911-51f2c56caa32`

### Carol Davis (Joplin, MO)
- **Email**: `carol.test@carecollective.com`
- **Password**: `BetaTest2025!`
- **Status**: Approved user
- **Has**: 1 active help request (yard work)
- **User ID**: `e3182e90-2570-4911-b2bb-dbd4fb8afc6b`

---

## 📊 Test Data Summary

### Help Requests (5 total)
1. **Alice**: "Need groceries this week" (groceries-meals, normal urgency)
2. **Bob**: "Ride to doctor appointment" (transportation-errands, urgent)
3. **Carol**: "Help with yard work" (household-yard, normal urgency)
4. **Alice**: "Tech help setting up phone" (technology-administrative, normal urgency)
5. **Bob**: "Companionship for coffee" (social-companionship, normal urgency)

### Conversations (1 total - V2 System)
- **Alice ↔ Bob**: Discussing groceries help (3 messages)

### Messaging V2 Status
- ✅ **ENABLED** in production
- ✅ Atomic conversation creation working
- ✅ Real-time messaging ready
- ✅ Test conversation created successfully

---

## 🧪 Testing Scenarios

### Scenario 1: Help Request Flow
1. Login as Alice
2. View dashboard - should see 2 help requests
3. Browse /requests - should see all 5 requests
4. Click "Offer Help" on Bob's doctor ride request
5. Send initial message
6. Navigate to /messages - should see new conversation

### Scenario 2: Messaging Platform (PRIORITY #1)
1. Login as Alice
2. Navigate to /messages
3. Should see 1 conversation with Bob
4. Open conversation - should see 3 messages
5. Send new message: "Thanks Bob, you're a lifesaver!"
6. Login as Bob (different browser/incognito)
7. Navigate to /messages
8. Should see Alice's message in real-time (WebSocket)
9. Reply to Alice
10. Both users should see messages update instantly

### Scenario 3: Create Help Request
1. Login as Carol
2. Navigate to /requests/new
3. Create new request:
   - Title: "Need help with computer virus removal"
   - Category: technology-administrative
   - Urgency: urgent
   - Description: (write your own)
4. Submit request
5. Verify it appears in /requests list
6. Login as Alice - verify she can see Carol's request

### Scenario 4: Admin Panel
1. Login as Evan (dev admin)
2. Navigate to /admin
3. Should see:
   - User management (5 total users)
   - Help requests dashboard (5+ requests)
   - Messaging overview
   - Privacy dashboard
4. Test user approval flow (if any pending users)
5. View help request details
6. Access privacy logs

### Scenario 5: Mobile Testing
1. Open on mobile device (iOS/Android)
2. Login as any user
3. Test responsive design:
   - Navigation works
   - Touch targets 44px minimum
   - Forms are usable
   - Messages display correctly
4. Test offline behavior:
   - Turn off network
   - Try to send message (should queue)
   - Turn network back on (should send)

---

## 🚨 Known Issues (Expected)

1. **Local build crashes** - Memory limitation, works on Vercel
2. **Test TypeScript errors** - 200+ errors in test files (deferred post-beta)
3. **Message loading on logout** - Expected, requires authentication
4. **WebSocket disconnects without session** - Expected, auth required

---

## 🔗 Important URLs

- **Production**: https://care-collective-preview.vercel.app
- **Login**: https://care-collective-preview.vercel.app/login
- **Signup**: https://care-collective-preview.vercel.app/signup
- **Messages**: https://care-collective-preview.vercel.app/messages
- **Help Requests**: https://care-collective-preview.vercel.app/requests
- **Admin Panel**: https://care-collective-preview.vercel.app/admin
- **Dashboard**: https://care-collective-preview.vercel.app/dashboard

---

## 🛠️ Technical Details

### Environment Variables (Production)
- `NEXT_PUBLIC_MESSAGING_V2_ENABLED=true` ✅ **ENABLED**
- Supabase URL: `https://kecureoyekeqhrxkmjuh.supabase.co`
- Next.js: 14.2.32
- React: 18.3.1

### Database State (as of Nov 1, 2025)
- **Profiles**: 5 (2 admins, 3 test users)
- **Help Requests**: 5
- **Conversations (V2)**: 1
- **Messages (V2)**: 3
- **Conversations (V1)**: 0 (legacy system unused)
- **Messages (V1)**: 0 (legacy system unused)

### Features Enabled
- ✅ Help request creation/browsing
- ✅ Messaging platform (V2 atomic system)
- ✅ Real-time WebSocket messaging
- ✅ User authentication
- ✅ Admin panel
- ✅ Privacy dashboard
- ✅ Contact exchange (consent-based)
- ✅ Content moderation
- ✅ Mobile responsive design
- ✅ Offline support (service worker)

---

## 📝 Beta Testing Checklist

### Day 1 (Nov 1, 2025)
- [ ] Verify all test users can login
- [ ] Test help request creation
- [ ] Test messaging platform (real-time)
- [ ] Verify admin panel access
- [ ] Test on mobile devices
- [ ] Check WebSocket connectivity
- [ ] Verify no critical console errors

### Day 2-3
- [ ] Stress test with 50+ messages
- [ ] Test message virtualization (1000+ messages)
- [ ] Test network reconnection
- [ ] Verify privacy features work
- [ ] Test contact exchange flow
- [ ] Check accessibility (screen reader)
- [ ] Performance testing (Lighthouse)

### Day 4-7
- [ ] Gather user feedback
- [ ] Document any bugs found
- [ ] Test edge cases
- [ ] Verify security (no unauthorized access)
- [ ] Test data export (GDPR)
- [ ] Verify audit trails
- [ ] Final review before public beta

---

## 🐛 Reporting Issues

**GitHub Issues**: https://github.com/musickevan1/care-collective-preview/issues

**Issue Template**:
```
**Environment**: Production
**User Account**: (which test account)
**Steps to Reproduce**:
1.
2.
3.

**Expected**:
**Actual**:
**Browser**: Chrome 120, Safari 17, etc.
**Device**: Desktop, iPhone 14, etc.
**Console Errors**: (paste any errors)
```

---

**Security Note**: These are test credentials for beta testing only. Do NOT use these credentials for production or share publicly beyond the beta testing team.
