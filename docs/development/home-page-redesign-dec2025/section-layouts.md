# Section Layout Reference - Home Page Redesign

## Overview

This document shows the before/after layout changes for each section.

---

## Section 1: HERO

### Current Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                        [LOGO]                               │
│                                                             │
│                   Southwest Missouri                        │
│                   CARE Collective                           │
│                                                             │
│        Caregiver Assistance and Resource Exchange           │
│                                                             │
│              [Description paragraph]                        │
│                                                             │
│     [Join Our Community]    [Learn How It Works]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### New Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                        [LOGO]                               │
│                                                             │
│                   Southwest Missouri                        │
│                   CARE Collective                           │
│                                                             │
│        Caregiver Assistance and Resource Exchange           │
│                                                             │
│              [Description paragraph]                        │
│                                                             │
│                  [Join Our Community]                       │  ← Single button (teal)
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
- Remove "Learn How It Works" button
- Change button color: sage → teal

---

## Section 2: WHAT IS CARE COLLECTIVE? (formerly "How It Works" + "Why Join")

### Current Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                     How It Works                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Step 1    │  │   Step 2    │  │   Step 3    │          │
│  │   Create    │  │  Request/   │  │   Build     │          │
│  │   Account   │  │   Offer     │  │  Community  │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Why Join?                              │
│                 [Feature list items]                        │
└─────────────────────────────────────────────────────────────┘
```

### New Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                What is CARE Collective?                     │
│                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │  HOW IT WORKS   │ │   WHY JOIN?     │ │  KINDS OF HELP  ││
│  │                 │ │                 │ │                 ││
│  │  1. Create      │ │ Are you caring  │ │ • Health &      ││
│  │     Account     │ │ for an aging    │ │   Caregiving    ││
│  │                 │ │ loved one?      │ │ • Groceries &   ││
│  │  2. Request or  │ │                 │ │   Meals         ││
│  │     Offer Help  │ │ • Mutual        │ │ • Transport &   ││
│  │                 │ │   exchange      │ │   Errands       ││
│  │  3. Build       │ │ • Flexibility   │ │ • Household &   ││
│  │     Community   │ │ • Learning      │ │   Yard          ││
│  │                 │ │ • No pressure   │ │ • Tech & Admin  ││
│  │                 │ │                 │ │ • Social &      ││
│  │                 │ │                 │ │   Companionship ││
│  └─────────────────┘ └─────────────────┘ └─────────────────┘│
│                                                             │
│                   [Get Started Today]                       │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
- Merge two sections into one
- Rename to "What is CARE Collective?"
- 3-column grid layout (stacks on mobile)
- Add new "Kinds of Help" box

---

## Section 3: ABOUT CARE COLLECTIVE

### Current Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                  About CARE Collective                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                   Who We Are                        │    │
│  │                    [icon]                           │    │
│  │         [Centered paragraph of text]                │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Academic Partnership                    │    │  ← DELETE
│  │                    [icon]                           │    │
│  │         [MSU and SGS information]                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│                   [Learn More About Us]                     │
└─────────────────────────────────────────────────────────────┘
```

### New Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                  About CARE Collective                      │
│            Background: Tan (#C39778)                        │
│                                                             │
│  ┌────────────────────────────┐  ┌────────────────────────┐ │
│  │                            │  │                        │ │
│  │      Who We Are            │  │    ┌──────────────┐    │ │
│  │                            │  │    │              │    │ │
│  │  The CARE Collective is    │  │    │   [PHOTO]    │    │ │
│  │  a network of family       │  │    │              │    │ │
│  │  caregivers in Southwest   │  │    │   Maureen    │    │ │
│  │  Missouri who support      │  │    │              │    │ │
│  │  each other through        │  │    └──────────────┘    │ │
│  │  practical help and        │  │                        │ │
│  │  shared resources...       │  │  Dr. Maureen Templeman │ │
│  │                            │  │        Founder         │ │
│  │         (60%)              │  │         (40%)          │ │
│  └────────────────────────────┘  └────────────────────────┘ │
│                                                             │
│                   [Learn More About Us]                     │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
- Delete "Academic Partnership" card
- Asymmetrical layout: text left (60%), photo right (40%)
- Add Maureen's photo with caption
- Tan background for warmth

---

## Section 4: WHAT'S HAPPENING

### Current Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                    What's Happening                         │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐         │
│  │  Upcoming Events    │    │  Community Updates  │         │
│  │  [Event cards]      │    │  [Update cards]     │         │
│  └─────────────────────┘    └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### New Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                    What's Happening                         │
│            Background: Brown (#483129)                      │
│            Text: White                                      │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐         │
│  │  Upcoming Events    │    │  Community Updates  │         │
│  │  [Event cards]      │    │  [Update cards]     │         │
│  └─────────────────────┘    └─────────────────────┘         │
│                                                             │
│              [View All in Member Portal]                    │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
- Dark brown background with white text
- Cards may need adjusted styling for dark background

---

## Section 5: GET IN TOUCH

### Current Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                     Get in Touch                            │
│                                                             │
│                    ┌───────────────┐                        │
│                    │   Email Us    │                        │
│                    │   [email]     │                        │
│                    └───────────────┘                        │
│                                                             │
│                [Visit Full Contact Page]                    │
└─────────────────────────────────────────────────────────────┘
```

### New Layout:
```
┌─────────────────────────────────────────────────────────────┐
│                     Get in Touch                            │
│            Background: Terracotta (#BC6547)                 │
│            Text: White                                      │
│                                                             │
│                    ┌───────────────┐                        │
│                    │   Email Us    │                        │
│                    │   [email]     │                        │
│                    └───────────────┘                        │
│                                                             │
│                [Visit Full Contact Page]                    │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
- Terracotta background with white text
- Warm, inviting color for contact section

---

## Section 6: FOOTER

### Current Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  CARE Collective        CONTACT         GET STARTED   RESOURCES │
│  "Community mutual      Dr. Maureen     Join          Help     │
│   support..."           Springfield     Login         Terms    │
│                         [email]                       Privacy  │
├─────────────────────────────────────────────────────────────┤
│  © 2025 CARE Collective - Southwest Missouri                │
└─────────────────────────────────────────────────────────────┘
```

### New Layout:
```
┌─────────────────────────────────────────────────────────────┐
│  CARE Collective        CONTACT         GET STARTED   RESOURCES │
│  "Funded by the         Dr. Maureen     Join          Help     │
│   Southern Geronto-     Springfield     Login         Terms    │
│   logical Society       [email]                       Privacy  │
│   and the Dept of                                              │
│   Sociology..."                                                │
│                                                                │
│  [Facebook Icon]                                               │
├─────────────────────────────────────────────────────────────┤
│  © 2025 CARE Collective - Southwest Missouri                │
└─────────────────────────────────────────────────────────────┘
```

**Changes:**
- Replace tagline with MSU/SGS funding statement
- Add Facebook icon with link

---

## Mobile Responsiveness

All 3-column layouts stack to single column on mobile:

```
Desktop (lg+):     [Box 1] [Box 2] [Box 3]

Tablet (md):       [Box 1] [Box 2]
                   [Box 3]

Mobile (sm):       [Box 1]
                   [Box 2]
                   [Box 3]
```

About section on mobile:
```
Mobile:            [Photo + Caption]
                   [Text Content]
```
