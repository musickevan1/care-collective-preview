import Link from 'next/link'
import { notFound } from 'next/navigation'
import { features } from '@/lib/features'

export default function PermissionsPage() {
  if (!features.designSystem) {
    notFound()
  }

  const userRoles = [
    {
      role: "Unauthenticated User",
      level: 0,
      description: "Visitors who haven't logged in",
      permissions: [
        "View open help requests (read-only)",
        "View public profile information",
        "Browse categories and search"
      ],
      restrictions: [
        "Cannot create help requests",
        "Cannot contact helpers/requesters",
        "Cannot access user dashboard"
      ]
    },
    {
      role: "Pending User", 
      level: 1,
      description: "Registered users awaiting approval",
      permissions: [
        "All unauthenticated permissions",
        "View own profile",
        "Access waitlist status"
      ],
      restrictions: [
        "Cannot create help requests until approved",
        "Cannot initiate contact exchanges",
        "Limited dashboard access"
      ]
    },
    {
      role: "Approved User",
      level: 2, 
      description: "Verified community members",
      permissions: [
        "All pending user permissions",
        "Create and manage help requests",
        "Initiate contact exchanges",
        "Send and receive messages",
        "Full dashboard access",
        "Update own profile information"
      ],
      restrictions: [
        "Cannot access admin functions",
        "Cannot moderate other users' content",
        "Cannot approve new applications"
      ]
    },
    {
      role: "Admin User",
      level: 3,
      description: "Community moderators and system administrators", 
      permissions: [
        "All approved user permissions",
        "Review and approve/reject applications",
        "Moderate help requests",
        "Manage user accounts",
        "Access system statistics",
        "View audit logs",
        "Update any help request status",
        "Delete inappropriate content"
      ],
      restrictions: [
        "System-level configuration (handled by developers)",
        "Database direct access (security boundary)"
      ]
    }
  ]

  const securityFeatures = [
    {
      name: "Row Level Security (RLS)",
      description: "Database-level security ensuring users can only access appropriate data",
      implementation: [
        "All tables have RLS policies enabled",
        "Users can only modify their own records",
        "Admins have elevated access through policy checks",
        "Contact exchanges require explicit consent from both parties"
      ]
    },
    {
      name: "Privacy-First Contact Exchange",
      description: "Secure system for sharing contact information between helpers and requesters",
      implementation: [
        "Explicit consent required from both parties",
        "Audit trail logged for all exchanges",
        "Contact info never exposed in URLs or client-side code",
        "Time-limited exchange tokens"
      ]
    },
    {
      name: "Verification System",
      description: "Waitlist and approval process for new community members",
      implementation: [
        "New users start with 'pending' status",
        "Admin review required for approval",
        "Reason tracking for rejections",
        "Grandfathered existing users during migration"
      ]
    },
    {
      name: "Admin Audit Trail",
      description: "Complete logging of administrative actions for transparency",
      implementation: [
        "All admin actions logged with timestamps",
        "User ID tracking for accountability", 
        "Before/after values captured",
        "Metadata for context and debugging"
      ]
    }
  ]

  const rlsPolicies = [
    {
      table: "profiles",
      policies: [
        "Public read access for basic profile info (name, location)",
        "Users can insert/update own profile only",
        "Admins can update verification status and admin flags"
      ]
    },
    {
      table: "help_requests", 
      policies: [
        "Public read access for open requests",
        "Users can create requests linked to their profile",
        "Users can update/delete own requests only",
        "Admins can moderate any request"
      ]
    },
    {
      table: "messages",
      policies: [
        "Users can only view messages they sent or received",
        "Users can only send messages as themselves",
        "Message content is private between sender/recipient"
      ]
    },
    {
      table: "contact_exchanges",
      policies: [
        "Users can only view exchanges they're part of",
        "Both requester and helper must consent",
        "Audit trail visible to participants and admins"
      ]
    },
    {
      table: "audit_logs",
      policies: [
        "Only admins can view or create audit entries",
        "Complete action history for transparency",
        "No deletion allowed (append-only log)"
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary-contrast">← Back to Home</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/design-system/colors" className="text-primary hover:text-primary-contrast">Colors</Link>
          <Link href="/design-system/typography" className="text-primary hover:text-primary-contrast">Typography</Link>
          <Link href="/design-system/database" className="text-primary hover:text-primary-contrast">Database</Link>
          <span className="font-medium">Permissions</span>
        </div>
        
        <h1 className="mb-8 text-4xl font-bold text-foreground">
          🛡️ User Permissions & Security Model
        </h1>

        <div className="mb-8 rounded-lg border-l-4 border-primary bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Developer Note:</strong> Care Collective implements a trust-based community model with progressive permissions based on verification status. All security is enforced at the database level through Row Level Security (RLS) policies.
          </p>
        </div>
        
        {/* User Roles Hierarchy */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">User Role Hierarchy</h2>
          <div className="space-y-6">
            {userRoles.map((role, index) => (
              <div key={role.role} className="rounded-lg border bg-card p-6">
                <div className="mb-4 flex items-center gap-4">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white font-bold ${
                    role.level === 0 ? 'bg-gray-500' : 
                    role.level === 1 ? 'bg-yellow-500' :
                    role.level === 2 ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {role.level}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{role.role}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium text-green-700">✅ Permissions</h4>
                    <ul className="space-y-1">
                      {role.permissions.map((permission, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="mb-2 font-medium text-red-700">❌ Restrictions</h4>
                    <ul className="space-y-1">
                      {role.restrictions.map((restriction, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{restriction}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Permission Matrix */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Permission Matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse rounded-lg border bg-card">
              <thead>
                <tr className="border-b bg-muted">
                  <th className="p-3 text-left">Action</th>
                  <th className="p-3 text-center">Unauthenticated</th>
                  <th className="p-3 text-center">Pending</th>
                  <th className="p-3 text-center">Approved</th>
                  <th className="p-3 text-center">Admin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['View help requests', '✅', '✅', '✅', '✅'],
                  ['Create help requests', '❌', '❌', '✅', '✅'],
                  ['Contact helpers/requesters', '❌', '❌', '✅', '✅'],
                  ['Send messages', '❌', '❌', '✅', '✅'],
                  ['Update own profile', '❌', '✅', '✅', '✅'],
                  ['Delete own requests', '❌', '❌', '✅', '✅'],
                  ['Moderate content', '❌', '❌', '❌', '✅'],
                  ['Approve applications', '❌', '❌', '❌', '✅'],
                  ['View audit logs', '❌', '❌', '❌', '✅'],
                  ['System statistics', '❌', '❌', '❌', '✅']
                ].map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-3 font-medium">{row[0]}</td>
                    <td className="p-3 text-center">{row[1]}</td>
                    <td className="p-3 text-center">{row[2]}</td>
                    <td className="p-3 text-center">{row[3]}</td>
                    <td className="p-3 text-center">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Features */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Security Implementation</h2>
          <div className="space-y-6">
            {securityFeatures.map((feature, index) => (
              <div key={feature.name} className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 text-lg font-semibold">{feature.name}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.implementation.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* RLS Policies */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Row Level Security (RLS) Policies</h2>
          <div className="space-y-4">
            {rlsPolicies.map((table) => (
              <div key={table.table} className="rounded-lg border bg-card p-4">
                <h3 className="mb-3 font-semibold">
                  <code className="rounded bg-muted px-2 py-1 text-sm">{table.table}</code>
                </h3>
                <ul className="space-y-1">
                  {table.policies.map((policy, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{policy}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Authentication Flow */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold">Authentication Flow</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-500 text-white font-bold">1</div>
              <div>
                <p className="font-medium">User Registration</p>
                <p className="text-sm text-muted-foreground">Email signup → Supabase Auth → Profile created with 'pending' status</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-white font-bold">2</div>
              <div>
                <p className="font-medium">Waitlist Period</p>
                <p className="text-sm text-muted-foreground">Limited access, can view content but not create or contact</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white font-bold">3</div>
              <div>
                <p className="font-medium">Admin Review</p>
                <p className="text-sm text-muted-foreground">Admin approves/rejects application with reason tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white font-bold">4</div>
              <div>
                <p className="font-medium">Full Access</p>
                <p className="text-sm text-muted-foreground">Approved users gain full community participation rights</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}