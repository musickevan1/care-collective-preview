# Phase 6: Community Events Calendar

**Duration**: Weeks 14-17
**Priority**: 📋 Medium
**Status**: ⏳ Pending
**Dependencies**: Phase 1-5

---

## 🎯 Overview

Build community events calendar (separate from help requests) with RSVP system. Includes event creation, calendar views, and attendee management.

### Goals
- Create events database schema
- Build event creation and management
- Implement calendar view with month/week/day
- Add RSVP system with capacity limits
- Integrate with dashboard

### Success Criteria
- [ ] Events can be created and managed
- [ ] Calendar view functional and intuitive
- [ ] RSVP system working with capacity tracking
- [ ] Email notifications for RSVPs and reminders
- [ ] Mobile-friendly calendar interface

---

## 📋 Key Tasks

### 6.1 Database Schema (Week 14)
```sql
CREATE TABLE community_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  event_time time,
  location text,
  organizer_id uuid REFERENCES profiles(id),
  max_attendees integer,
  category text, -- meetup, workshop, support_group, social
  created_at timestamptz DEFAULT now()
);

CREATE TABLE event_rsvps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id uuid REFERENCES community_events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id),
  status text DEFAULT 'going', -- going, maybe, not_going
  rsvp_date timestamptz DEFAULT now(),
  UNIQUE(event_id, user_id)
);
```

### 6.2 Event Management (Week 15)
- Event creation form
- Event details page
- Event editing/deletion
- Event categories with icons

### 6.3 Calendar & RSVP (Week 16)
- Implement FullCalendar or similar
- Month/week/day views
- RSVP functionality
- Attendee count display
- Email notifications

### 6.4 Enhancements (Week 17)
- Recurring events
- Waitlist for full events
- Event comments
- Google Calendar export

---

## 📊 Success Metrics

- Events created per month: Track growth
- RSVP rate: 60%+
- Event attendance: 70%+ of RSVPs

---

*May be MVP first, enhanced post-launch.*
