# Phase 4: Multi-Helper System

**Duration**: Weeks 9-10
**Priority**: ⚡ High
**Status**: ⏳ Pending
**Dependencies**: Phase 1-3

---

## 🎯 Overview

Enable requesters to allow multiple helpers for a single help request. Each helper gets one-on-one messaging with the requester. Requester controls via checkbox "Keep post up after acceptance."

### Goals
- Add `allow_multiple_helpers` checkbox to request creation
- Update database schema to support multiple helper connections
- Create separate conversation per helper
- Keep request status as "open" if checkbox enabled

### Success Criteria
- [ ] Requester can toggle multi-helper on request creation
- [ ] Multiple helpers can accept same request
- [ ] Each helper has separate 1:1 conversation
- [ ] UI shows "X helpers accepted" count
- [ ] No confusion between different helper conversations

---

## 📋 Key Tasks

### 4.1 Database Schema Updates (Week 9)
```sql
-- Add to help_requests table
ALTER TABLE help_requests 
ADD COLUMN allow_multiple_helpers BOOLEAN DEFAULT false;

-- Create helper_connections table
CREATE TABLE helper_connections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id uuid REFERENCES help_requests(id) ON DELETE CASCADE,
  helper_id uuid REFERENCES profiles(id),
  conversation_id uuid REFERENCES conversations(id),
  status text DEFAULT 'active', -- active, completed, cancelled
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, helper_id)
);
```

### 4.2 Request Creation Form (Week 9)
```typescript
// Add checkbox to form
<Checkbox
  id="multipleHelpers"
  checked={allowMultipleHelpers}
  onCheckedChange={setAllowMultipleHelpers}
/>
<Label htmlFor="multipleHelpers">
  Keep this request open after someone accepts (allow multiple helpers)
</Label>
```

### 4.3 Messaging Flow (Week 10)
- Update conversation creation logic
- Display helper count on request cards
- Show all active helpers in request details
- Test edge cases (helper leaves, etc.)

---

## 📊 Success Metrics

- Multi-helper requests: 30%+ adoption
- No conversation confusion (user testing)
- Zero bugs in multi-helper flow

---

*See full implementation details when ready.*
