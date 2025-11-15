# Components - React UI Components

The `components/` directory contains all reusable React components organized by feature domain.

---

## 📁 Directory Structure

```
components/
├── ui/                             # Shadcn/ui and primitive components
├── admin/                          # Admin dashboard components
│   └── cms/                        # CMS-specific admin components
├── dashboard/                      # User dashboard components
├── help-requests/                  # Help request feature components
├── layout/                         # Layout wrapper components
├── messaging/                      # Real-time messaging UI components
├── notifications/                  # Notification display components
├── privacy/                        # Privacy control components
├── beta/                          # Beta feature components
├── [Root components]              # Page-level components
└── README.md (this file)
```

---

## 📋 Module Documentation

### `ui/` - Primitive Components
**Purpose**: Base UI components from Shadcn/ui and custom primitives

**Contents**:
- `Button` - Styled button component
- `Badge` - Status/category badges
- `Card` - Card container
- `Modal` - Modal dialog
- `Input` - Text input
- `Select` - Dropdown selection
- `Checkbox`, `Radio`, `Toggle`, etc.

**When to use**: Building blocks for larger components

**Example**:
```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MyComponent() {
  return (
    <Card>
      <Button>Click me</Button>
    </Card>
  );
}
```

**Status**: ✅ These are small, focused components (< 50 lines each)

---

### `admin/` - Admin Dashboard Components
**Purpose**: Admin interface for moderation, user management, and system administration

**Key files**:
- `ModerationDashboard.tsx` (791 lines) [⚠️ NEEDS SPLIT]
- `PrivacyDashboard.tsx` (731 lines) [⚠️ NEEDS SPLIT]
- `AdminReportingDashboard.tsx` (566 lines) [⚠️ NEEDS SPLIT]
- `BulkUserActions.tsx` (464 lines) [⚠️ NEEDS SPLIT]

**Subdirectory**:
- `cms/` - CMS-specific components:
  - `CalendarEventsManager.tsx` - Event calendar management
  - `EventCategoriesManager.tsx` - Event category management
  - `SiteContentManager.tsx` - CMS content editor

**When to use**: Admin-only interfaces and dashboards

**Status**: ⚠️ Several files exceed 200-line component limit (see FILE_SIZE_VIOLATIONS.md)

---

### `dashboard/` - User Dashboard Components
**Purpose**: Components for the authenticated user dashboard

**Key files**:
- Dashboard navigation
- Widget components
- Stats displays

**When to use**: User dashboard pages and sections

**Status**: ✅ Mostly compliant with size limits

---

### `help-requests/` - Help Request Components
**Purpose**: Components for creating, browsing, and managing help requests

**Key files**:
- `EditRequestForm.tsx` (324 lines) [⚠️ NEEDS SPLIT]
- `HelpRequestCardWithMessaging.tsx` (432 lines) [⚠️ NEEDS SPLIT]
- Request status displays
- Category/urgency selectors

**When to use**: Help request feature functionality

**Status**: ⚠️ Some files exceed 200-line limit (see FILE_SIZE_VIOLATIONS.md)

---

### `layout/` - Layout Components
**Purpose**: Structural/wrapper components for page layouts

**Key files**:
- `Header.tsx` - Page header
- `Footer.tsx` - Page footer
- `Sidebar.tsx` - Sidebar navigation
- `MobileNav.tsx` (314 lines) [⚠️ NEEDS SPLIT]
- Layout providers/wrappers

**When to use**: Page-level structural components

**Status**: ⚠️ MobileNav exceeds 200-line limit

---

### `messaging/` - Real-Time Messaging Components
**Purpose**: UI for the real-time messaging system

**Key files**:
- `ConversationList.tsx` - List of conversations
- `MessageInput.tsx` - Message composition
- `TypingIndicator.tsx` - "User is typing" indicator
- `VirtualizedMessageList.tsx` (486 lines) [⚠️ NEEDS SPLIT]
- `MessagingContext.tsx` (456 lines) [⚠️ NEEDS SPLIT]

**When to use**: Messaging feature UI

**Status**: ⚠️ Some files exceed 200-line limit

---

### `notifications/` - Notification Components
**Purpose**: User notifications and alerts

**Key files**:
- Toast notifications
- Alert banners
- Notification center

**When to use**: Displaying notifications to users

**Status**: ✅ Mostly compliant with size limits

---

### `privacy/` - Privacy Control Components
**Purpose**: User privacy settings and consent management UI

**Key files**:
- `PrivacyDashboard.tsx` (942 lines) [⚠️ NEEDS SPLIT]
- Consent trackers
- Data access logs
- Deletion request UI

**When to use**: Privacy-related user interfaces

**Status**: ⚠️ PrivacyDashboard significantly exceeds 200-line limit

---

### `beta/` - Beta Feature Components
**Purpose**: Components for beta-testing features

**Key files**:
- `BugReportButton.tsx` - Beta bug reporting
- Beta feature toggles
- Beta-specific UI

**When to use**: Beta testing and feature flags

**Status**: ✅ Small, focused components

---

### Root Components
**Purpose**: Page-level wrapper components

**Key files**:
- `Hero.tsx` - Homepage hero section
- `WhatsHappeningSection.tsx` - Content section
- Other page sections

**When to use**: Page composition

**Status**: ✅ Mostly compliant

---

## 🔴 Components Needing Refactoring

The following components exceed the 200-line size limit:

| Component | Size | Recommended Split | Status |
|-----------|------|------------------|--------|
| `ContactExchange.tsx` | 998 lines | 5 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `PrivacyDashboard.tsx` (privacy/) | 942 lines | 4 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `ModerationDashboard.tsx` | 791 lines | 3 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `PrivacyDashboard.tsx` (admin/) | 731 lines | 3 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `AdminReportingDashboard.tsx` | 566 lines | 3 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `VirtualizedMessageList.tsx` | 486 lines | 2 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `HelpRequestCardWithMessaging.tsx` | 432 lines | 3 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `PerformanceMonitor.tsx` | 403 lines | 2 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `BulkUserActions.tsx` | 464 lines | 2-3 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `EditRequestForm.tsx` | 324 lines | 2 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `MobileNav.tsx` | 314 lines | 2 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `FilterPanel.tsx` | 334 lines | 2 components | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| `MessagingContext.tsx` | 456 lines | 2 files | [NEEDS SPLIT](../docs/reference/FILE_SIZE_VIOLATIONS.md) |
| And 15+ more... | — | — | See FILE_SIZE_VIOLATIONS.md |

---

## 🎯 Best Practices

### 1. Component Size Limits
```typescript
// ❌ BAD: 500-line component
export function LargeComponent() {
  // ... 500 lines
}

// ✅ GOOD: Break into smaller components
export function Container() {
  return (
    <Header />
    <Content />
    <Sidebar />
    <Footer />
  );
}

function Header() { /* 30 lines */ }
function Content() { /* 40 lines */ }
function Sidebar() { /* 50 lines */ }
function Footer() { /* 20 lines */ }
```

### 2. Co-locate Styles and Logic
```typescript
// ✅ GOOD: Component file with its own styles
// components/MyComponent.tsx
import styles from './MyComponent.module.css';

export function MyComponent() {
  return <div className={styles.container}>...</div>;
}
```

### 3. Use Composition Over Props Drilling
```typescript
// ❌ BAD: Props drilling
<Form
  title={title}
  subtitle={subtitle}
  description={description}
  // ... 20 more props
/>

// ✅ GOOD: Composition
<Form>
  <Form.Header title={title} subtitle={subtitle} />
  <Form.Description>{description}</Form.Description>
  <Form.Body>{children}</Form.Body>
  <Form.Footer>
    <Form.SubmitButton />
  </Form.Footer>
</Form>
```

### 4. Separate Container from Presentational
```typescript
// ✅ GOOD: Container (hooks, state, logic)
export function MessageListContainer() {
  const { messages, loading } = useMessages();
  return <MessageListView messages={messages} isLoading={loading} />;
}

// ✅ GOOD: Presentational (UI only, no hooks)
export function MessageListView({ messages, isLoading }: Props) {
  return <div>{/* render UI */}</div>;
}
```

### 5. Type-Safe Props
```typescript
// ✅ GOOD: TypeScript interface for props
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function Button({ variant = 'primary', ...props }: ButtonProps) {
  // ...
}

// ❌ BAD: Untyped props
export function Button(props: any) {
  // ...
}
```

### 6. Accessibility is Non-Negotiable
```typescript
// ✅ GOOD: Accessible component
export function Button({ 'aria-label': ariaLabel, children, ...props }: ButtonProps) {
  return (
    <button
      aria-label={ariaLabel || undefined}
      className="h-12 px-4 focus:outline-none focus:ring-2 focus:ring-offset-2"
      {...props}
    >
      {children}
    </button>
  );
}
```

### 7. Mobile-First Design
```typescript
// ✅ GOOD: Mobile-first responsive
export function ResponsiveLayout() {
  return (
    <div className="
      flex flex-col              /* Mobile: column */
      md:flex-row                /* Tablet+: row */
      gap-4
      px-4 md:px-6 lg:px-8       /* Responsive padding */
    ">
      {/* content */}
    </div>
  );
}
```

---

## 📚 References

- **Size Limit Violations**: See [`../docs/reference/FILE_SIZE_VIOLATIONS.md`](../docs/reference/FILE_SIZE_VIOLATIONS.md)
- **Project Guidelines**: See [`../docs/reference/CLAUDE.md`](../docs/reference/CLAUDE.md)
- **Component Patterns**: See [`../docs/reference/component-patterns.md`](../docs/reference/component-patterns.md)
- **Accessibility**: See [`../docs/guides/testing.md`](../docs/guides/testing.md)

---

## 🔄 Refactoring Progress

**Phase**: Component Size Optimization

| Task | Status | Target Date |
|------|--------|-------------|
| Document component structure | ✅ COMPLETE | 11/15/2025 |
| Identify oversized components | ✅ COMPLETE | 11/15/2025 |
| Plan component splits | ✅ COMPLETE | 11/15/2025 |
| Implement component refactoring | ⏳ PENDING | TBD |
| Add component tests | ⏳ PENDING | TBD |

---

## 💡 When in Doubt

1. **Is this component over 200 lines?** → Split it
2. **Does it do too many things?** → Extract helper components
3. **Are props drilling deep?** → Use composition/context
4. **Is state management complex?** → Move to custom hook or context
5. **Is it hard to test?** → Separate logic from presentation

---

**Last Updated**: November 15, 2025
**Maintainer**: Care Collective Team
**Version**: 1.0
