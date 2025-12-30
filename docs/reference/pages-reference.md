# Pages Reference

Complete reference for all page routes and navigation structure in the Care Collective platform.

**Last Updated**: December 2025

---

## Table of Contents

- [Public Pages](#public-pages-no-authentication-required)
- [Authenticated User Pages](#authenticated-user-pages-login-required)
- [Admin Pages](#admin-pages-admin-role-required)
- [Special Routes](#special-routes)
- [Page Metadata](#page-metadata)

---

## Public Pages (No Authentication Required)

### `/` - Homepage

**Purpose**: Landing page and introduction to the platform

**Features**:
- Hero section with value proposition
- Help categories showcase
- "How It Works" section
- Call-to-action to sign up

**Components**:
- `Hero` - Hero banner
- `WhatsHappeningSection` - Recent community updates
- `LandingSection` - Feature highlights
- Category cards
- Steps/process visual

**Redirect Logic**: None (always accessible)

---

### `/about` - About Page

**Purpose**: Information about CARE Collective mission and values

**Content**:
- Mission statement
- Core values (Accessibility, Privacy, Community, Inclusivity)
- How the platform works
- Geographic focus (Southwest Missouri)

**Navigation**:
- Link from homepage footer
- Accessible to all visitors

---

### `/contact` - Contact Form

**Purpose**: Allow visitors to contact the platform

**Features**:
- Contact form (name, email, message)
- Form validation
- Email submission to platform team

**Components**:
- `ContactForm` - Contact form component

**Navigation**:
- Link from homepage footer
- Accessible to all visitors

---

### `/login` - Login Page

**Purpose**: User authentication

**Features**:
- Email/password login
- "Remember me" option
- Forgot password link
- Link to signup page
- Error handling and feedback

**Components**:
- Login form
- Social login (if configured)

**Redirect After Login**:
- Approved users → `/dashboard`
- Pending users → `/waitlist`
- Rejected users → `/access-denied?reason=rejected`

**API Integration**:
- `POST /api/auth/login`

---

### `/signup` - Sign Up Page

**Purpose**: New user registration

**Features**:
- Account creation form
- Name, email, password
- Email verification flow
- Terms and privacy policy agreement

**Components**:
- Signup form
- Password strength indicator
- Terms checkbox

**Redirect After Signup**:
- Success → Email verification page
- Then → `/waitlist` (awaiting approval)

**API Integration**:
- Supabase Auth signup
- Profile creation with `verification_status = 'pending'`

---

### `/help` - Help Documentation

**Purpose**: User help and documentation

**Content**:
- Platform usage guides
- Common questions
- Troubleshooting
- Feature documentation

**Sub-routes**:
- `/help/workflows` - Step-by-step workflows

**Navigation**:
- Link from main navigation
- Accessible to all users

---

### `/resources` - Community Resources

**Purpose**: External resources and community information

**Content**:
- Local resources (Missouri)
- Community organizations
- Helpful links
- Emergency contacts

**Navigation**:
- Link from main navigation
- Accessible to all users

---

### `/privacy-policy` - Privacy Policy

**Purpose**: Legal privacy policy document

**Content**:
- Data collection practices
- User rights
- GDPR compliance
- Contact information

**Navigation**:
- Link from footer
- Required for compliance

---

### `/terms` - Terms of Service

**Purpose**: Legal terms and conditions

**Content**:
- Platform rules
- User responsibilities
- Content policies
- Dispute resolution

**Navigation**:
- Link from footer
- Required for compliance

---

### `/verify-email` - Email Verification

**Purpose**: Handle email verification flow

**Behavior**:
- Extract verification token from URL
- Confirm email with Supabase
- Redirect based on verification status
- Show success/error messages

**Redirect Logic**:
- Success → `/waitlist` (pending admin approval)
- Error → Show error with retry option

**API Integration**:
- Supabase Auth verification

---

### `/waitlist` - Pending Approval

**Purpose**: Page for users awaiting account approval

**Features**:
- Status message explaining approval process
- Expected timeframe
- Contact information for questions
- Option to logout

**Access Control**:
- Only for authenticated users with `verification_status = 'pending'`

**Navigation**:
- Redirect after signup
- Redirect after failed login (pending status)

---

### `/access-denied` - Access Denied

**Purpose**: Page for blocked/rejected users

**Features**:
- Clear explanation of access denial
- Reason displayed (query parameter)
- Contact information
- Appeal process (if applicable)

**Access Control**:
- Redirected users (rejected accounts)
- Suspended/banned users

**Query Parameters**:
- `reason` - Rejection reason (`rejected`, `suspended`, `banned`)

---

### `/design-system` - Design System Showcase

**Purpose**: Display design tokens and components

**Sub-routes**:
- `/design-system/colors` - Color palette
- `/design-system/typography` - Typography system
- `/design-system/database` - Database design patterns
- `/design-system/permissions` - Permission system reference
- `/design-system/wireframe` - Wireframe showcase
- `/design-system/wireframe/annotated` - Annotated wireframes

**Features**:
- Visual design tokens
- Component examples
- Color swatches
- Typography scale
- Interactive components

**Navigation**:
- Primarily for developers/designers
- Not in main navigation

---

### `/hero-showcase` - Hero Section Showcase

**Purpose**: Display hero section variations

**Features**:
- Multiple hero designs
- A/B testing candidates
- Visual exploration

**Navigation**:
- Internal reference page
- Not linked from main navigation

---

### `/auth-test` - Authentication Testing

**Purpose**: Test authentication flow and debug

**Features**:
- Display current auth state
- User information display
- Session status
- Debug information

**Access Control**:
- Internal testing page
- Not for production users

---

### `/not-found` - 404 Page

**Purpose**: Page not found error (Next.js default)

**Features**:
- Friendly error message
- Link to homepage
- Suggested navigation

**Trigger**: Automatic (Next.js not-found.tsx)

---

### `/error` - Error Page

**Purpose**: Generic error page (Next.js default)

**Features**:
- Error message display
- Link to homepage
- Error details (development mode)

**Trigger**: Automatic (Next.js error.tsx)

---

## Authenticated User Pages (Login Required)

### `/dashboard` - User Dashboard

**Purpose**: Main user hub and overview

**Features**:
- Account status
- Recent activity
- Quick actions (create request, view requests, messages)
- Notification summary
- Statistics overview

**Access Control**:
- Requires authentication
- Only for approved users (`verification_status = 'approved'`)

**Redirect If**: Not authenticated → `/login`

---

### `/profile` - User Profile Management

**Purpose**: View and edit user profile

**Features**:
- Profile information display
- Edit name, location, bio
- Avatar management
- Privacy settings
- Account settings

**Components**:
- Profile display
- Edit form
- Avatar upload

**Access Control**:
- Requires authentication
- Only for approved users

**API Integration**:
- GET user profile
- PUT update profile
- POST avatar upload

---

### `/privacy` - Privacy Settings

**Purpose**: Manage privacy preferences

**Features**:
- Profile visibility settings
- Contact sharing preferences
- Data export options
- Notification preferences
- Account deletion request

**Access Control**:
- Requires authentication
- Only for approved users

**API Integration**:
- `GET /api/privacy/user-data` (data export)
- Privacy settings endpoints

---

### `/requests` - Help Requests Listing

**Purpose**: Browse all open help requests

**Features**:
- Filterable list of requests
- Category filters
- Urgency filters
- Search functionality
- Sort options (newest, nearest)

**Components**:
- `FilterPanel` - Filter controls
- Request cards
- Load more button

**Access Control**:
- Requires authentication
- Only for approved users

**Sub-routes**:
- `/requests/new` - Create new request
- `/requests/my-requests` - User's own requests
- `/requests/[id]` - Individual request details

---

### `/requests/new` - Create Help Request

**Purpose**: Form to create a new help request

**Features**:
- Request creation form
- Title, description fields
- Category selection
- Urgency selection
- Form validation
- Preview before submit

**Form Fields**:
- `title` (required, 5-100 characters)
- `description` (optional, max 500 characters)
- `category` (required, enum)
- `urgency` (required, default 'normal')

**Access Control**:
- Requires authentication
- Only for approved users

**API Integration**:
- `POST /api/requests` (create)

**Redirect After Submit**:
- Success → `/requests` (view new request)
- Error → Show form with error message

---

### `/requests/my-requests` - User's Own Requests

**Purpose**: View requests created by the current user

**Features**:
- List of user's requests
- Status indicators (open, in_progress, closed)
- Quick actions (cancel, complete, edit)
- Filter by status

**Access Control**:
- Requires authentication
- Only shows current user's requests

**API Integration**:
- `GET /api/requests` (filtered by user_id)

---

### `/requests/[id]` - Individual Request Details

**Purpose**: View specific help request details

**Features**:
- Full request information
- Requester profile (name, location)
- Status and urgency badges
- "Offer Help" button (if open)
- Request history (status changes)
- Cancel/complete actions (if owner)

**Dynamic Route**: `[id]` is UUID of help request

**Access Control**:
- Requires authentication
- Open requests: all approved users
- Cancelled requests: owner only
- Owner actions: owner only

**Components**:
- `RequestActions` - Cancel/complete/edit (owner only)
- Contact exchange form
- Status indicators

**API Integration**:
- `GET /api/requests/[id]` (fetch details)
- `POST /api/requests/[id]/cancel` (cancel)
- `POST /api/requests/[id]/complete` (complete)
- `POST /api/requests/[id]/edit` (update)

---

### `/messages` - Messaging Inbox

**Purpose**: View and manage conversations

**Features**:
- Conversation list
- Unread message count
- Last message preview
- Participant information
- Help request association
- Delete conversation option

**Components**:
- Conversation list
- Unread badges
- Message preview
- Real-time updates

**Access Control**:
- Requires authentication
- Only for approved users

**API Integration**:
- `GET /api/messaging/conversations` (list)
- `GET /api/notifications/unread-count` (unread count)
- Supabase Realtime for live updates

---

## Admin Pages (Admin Role Required)

> **All admin pages require:**
> - Authentication
> - Admin role (`profiles.role = 'admin'`)

### `/admin` - Admin Dashboard

**Purpose**: Main admin hub

**Features**:
- Platform statistics overview
- Quick links to admin sections
- Pending actions summary
- Recent activity feed
- Health status indicators

**Components**:
- Stats cards
- Activity list
- Navigation menu
- Quick action buttons

**Access Control**:
- Requires authentication
- Only for admin role

**Redirect If**: Not admin → `/access-denied`

---

### `/admin/applications` - Membership Applications

**Purpose**: Manage user membership applications

**Features**:
- List of pending applications
- User details (name, email, signup date)
- Approve/reject actions
- Rejection reason input
- Filter by status

**Actions**:
- Approve user (sets `verification_status = 'approved'`)
- Reject user (sets `verification_status = 'rejected'`)
- View full user profile

**Access Control**:
- Requires admin role

**API Integration**:
- `GET /api/admin/applications` (list)
- `POST /api/admin/applications` (approve/reject)

---

### `/admin/bug-reports` - Bug Reports Management

**Purpose**: Review and manage user-submitted bug reports

**Features**:
- List of bug reports
- Report details (title, description, severity)
- Status tracking (open, in_progress, resolved)
- Assign to developer (if applicable)
- Mark as resolved

**Report Information**:
- User who submitted
- Category (UI, functionality, performance, security, other)
- Severity (low, medium, high, critical)
- Steps to reproduce
- Browser and URL

**Access Control**:
- Requires admin role

**API Integration**:
- `POST /api/beta/bug-report` (submit)
- Admin action endpoints

---

### `/admin/help-requests` - Help Requests Management

**Purpose**: Admin management of help requests

**Features**:
- View all help requests
- Filter by status, category, urgency
- Bulk actions (cancel, feature, moderate)
- View request details
- Admin actions on problematic requests

**Components**:
- `AdminRequestActions` - Bulk operations
- Request management interface

**Access Control**:
- Requires admin role

**API Integration**:
- Admin request endpoints
- Bulk operations API

---

### `/admin/users` - User Management

**Purpose**: Manage platform users

**Features**:
- User list with pagination
- Search by name/email
- Filter by role, verification status
- User details view
- User actions:
  - Ban
  - Suspend
  - Unban
  - Reset password
  - View restrictions

**User Information Displayed**:
- Name, email, role
- Verification status
- Account creation date
- Last sign-in
- Current restrictions
- Activity stats

**Access Control**:
- Requires admin role

**API Integration**:
- `GET /api/admin/users` (list)
- `GET /api/admin/users/[userId]/details` (details)
- `POST /api/admin/users/[userId]/actions` (actions)

---

### `/admin/reports` - Analytics and Reports

**Purpose**: View platform analytics and reports

**Features**:
- Platform metrics overview
- User growth charts
- Request statistics
- Completion rates
- Activity timelines
- Export options

**Metrics Available**:
- Total users
- Active users (30 days)
- Total help requests
- Open vs closed requests
- Total conversations
- Messages sent
- Help requests completed

**Access Control**:
- Requires admin role

**API Integration**:
- `GET /api/admin/metrics`
- `GET /api/admin/stats`
- `GET /api/admin/export/[type]`

---

### `/admin/privacy` - Privacy Management

**Purpose**: Manage user privacy requests

**Features**:
- View data export requests
- Handle GDPR requests
- Review account deletion requests
- Audit data access logs

**Actions**:
- Approve data export
- Process account deletion
- Review privacy settings changes

**Access Control**:
- Requires admin role

---

### `/admin/messaging/moderation` - Content Moderation

**Purpose**: Moderate user-generated content

**Features**:
- Reported content queue
- Message review
- User behavior review
- Action options:
  - Approve (no action)
  - Warning
  - Delete content
  - Ban user
  - Restrict user

**Report Information**:
- Content type (message, user, request)
- Who reported it
- Reason for report
- Current status
- Timestamp

**Access Control**:
- Requires admin role

**API Integration**:
- `GET /api/admin/moderation/queue`
- `GET /api/admin/moderation/[id]`
- `POST /api/admin/moderation/[id]/process`

---

### `/admin/performance` - Performance Metrics

**Purpose**: Monitor platform performance

**Features**:
- Page load times
- API response times
- Error rates
- Database performance
- Cache hit rates

**Metrics**:
- Average response time
- 95th percentile response time
- Error rate percentage
- Uptime percentage
- Database query performance

**Access Control**:
- Requires admin role

---

### `/admin/signup` - Signup Management

**Purpose**: Manage signup flow and settings

**Features**:
- View signup statistics
- Moderate new signups
- Review flagged accounts
- Manage signup questions (if any)

**Access Control**:
- Requires admin role

---

### `/admin/cms` - Content Management System

**Purpose**: Manage site content and resources

**Sub-routes**:
- `/admin/cms/site-content` - Site content management
- `/admin/cms/categories` - Help categories
- `/admin/cms/community-updates` - Community updates
- `/admin/cms/calendar-events` - Calendar events

**Features**:
- Create, edit, publish content
- Draft management
- Version control
- Publishing workflow
- Content scheduling

**Access Control**:
- Requires admin role

**API Integration**:
- CMS endpoints for all content types

---

### `/admin/cms/site-content`

**Purpose**: Manage static site content

**Features**:
- Edit page content (about, FAQ, etc.)
- Draft and publish workflow
- Content keys management
- Preview functionality

**Content Types**:
- About page text
- FAQ items
- Policy text
- Landing page copy

**API Integration**:
- `GET /api/admin/cms/site-content` (list)
- `GET /api/admin/cms/site-content/[key]`
- `POST /api/admin/cms/site-content/[key]`
- `POST /api/admin/cms/site-content/[key]/publish`

---

### `/admin/cms/categories`

**Purpose**: Manage help request categories

**Features**:
- Add new categories
- Edit existing categories
- Reorder categories
- Enable/disable categories

**Categories**:
- groceries
- transport
- household
- medical
- other

**API Integration**:
- `GET /api/admin/cms/categories` (list)
- `GET /api/admin/cms/categories/[id]`
- `POST /api/admin/cms/categories/[id]`

---

### `/admin/cms/community-updates`

**Purpose**: Publish community updates

**Features**:
- Create update announcements
- Rich text editor
- Schedule publication
- Manage update history

**Content Fields**:
- Title
- Body content
- Publication date
- Status (draft/published)

**API Integration**:
- `GET /api/admin/cms/community-updates` (list)
- `POST /api/admin/cms/community-updates` (create)
- `GET /api/admin/cms/community-updates/[id]`
- `POST /api/admin/cms/community-updates/[id]` (update)
- `POST /api/admin/cms/community-updates/[id]/publish`

---

### `/admin/cms/calendar-events`

**Purpose**: Manage community calendar events

**Features**:
- Create events
- Edit event details
- Schedule events
- Publish events

**Event Fields**:
- Title
- Description
- Date/time
- Location
- Status (draft/published)

**API Integration**:
- `GET /api/admin/cms/calendar-events` (list)
- `POST /api/admin/cms/calendar-events` (create)
- `GET /api/admin/cms/calendar-events/[id]`
- `POST /api/admin/cms/calendar-events/[id]` (update)
- `POST /api/admin/cms/calendar-events/[id]/publish`

---

## Special Routes

### `/auth/callback` - OAuth Callback

**Purpose**: Handle OAuth authentication callbacks

**Behavior**:
- Process OAuth callback from external providers
- Exchange authorization code for tokens
- Create/update user session
- Redirect to appropriate page

**Query Parameters**:
- `code` - Authorization code
- `state` - CSRF protection token

**Trigger**: Automatic (OAuth flow)

---

### `/auth/auth-code-error` - Auth Code Error

**Purpose**: Display OAuth error information

**Features**:
- Show error details
- Error code explanation
- Retry option
- Contact support link

**Trigger**: Automatic (OAuth error)

---

## Page Metadata

### Page Titles

| Page | Title Pattern | Description |
|-------|---------------|-------------|
| Homepage | "CARE Collective" | Main landing |
| Login | "Login | CARE Collective" | Authentication |
| Signup | "Sign Up | CARE Collective" | Registration |
| Dashboard | "Dashboard | CARE Collective" | User hub |
| Requests | "Help Requests | CARE Collective" | Browse requests |
| Messages | "Messages | CARE Collective" | Messaging |
| Admin | "Admin | CARE Collective" | Admin panel |

### SEO Settings

**Homepage** (`/`):
```typescript
export const metadata: Metadata = {
  title: "CARE Collective",
  description: "Southwest Missouri CARE Collective - Building community through mutual support",
  robots: {
    index: true,
    follow: true,
  }
}
```

**Protected Pages**:
- Dashboard, messages, profile: `index: false` (no index)
- Admin pages: `index: false` (no index)

### OpenGraph Tags

All pages include OpenGraph metadata:

```typescript
openGraph: {
  title: page_title,
  description: page_description,
  images: ['/logo.png'],
  type: 'website',
}
```

---

## Navigation Structure Summary

### Main Navigation (All Users)

```
Home (/) → About (/) → Help (/) → Resources (/) → Contact (/)
```

### Authenticated Navigation

```
[Home] [Dashboard] [Requests] [Messages] [Profile] → [Logout]
```

### Admin Navigation

```
Dashboard | Applications | Requests | Users | Moderation | Reports | CMS
```

---

## Route Protection

### Middleware

Route protection is handled via middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-access-token');

  // Protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin routes
  if (request.nextUrl.pathname.startsWith('/admin') && !isAdmin) {
    return NextResponse.redirect(new URL('/access-denied', request.url));
  }

  return NextResponse.next();
}
```

### Server-Side Checks

Protected pages also check authentication server-side:

```typescript
// page.tsx
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  if (user.user_metadata.verification_status !== 'approved') {
    redirect('/waitlist');
  }

  return <DashboardContent />;
}
```

---

## Additional Resources

- [API Overview](./api-overview.md) - Authentication, rate limiting, error handling
- [API Reference Index](./README.md) - Complete API documentation
- [Getting Started Guide](../guides/getting-started.md)
- [CLAUDE.md](/CLAUDE.md)

---

**Last Updated**: December 2025
