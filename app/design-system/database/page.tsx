import Link from 'next/link'
import { notFound } from 'next/navigation'
import { features } from '@/lib/features'

export default function DatabasePage() {
  if (!features.designSystem) {
    notFound()
  }

  const tables = [
    {
      name: "profiles",
      description: "User profiles extending Supabase auth.users",
      primaryKey: "id (UUID)",
      foreignKeys: [
        "approved_by → profiles.id (admin who approved)"
      ],
      keyFields: [
        "id: UUID (matches auth.users.id)",
        "name: TEXT (display name)",
        "location: TEXT (optional neighborhood/area)", 
        "verification_status: ENUM (pending/approved/rejected)",
        "is_admin: BOOLEAN (admin privileges flag)",
        "application_reason: TEXT (why they want to join)",
        "created_at: TIMESTAMP"
      ],
      indexes: [
        "idx_profiles_verification_status",
        "idx_profiles_is_admin (WHERE is_admin = true)",
        "idx_profiles_applied_at"
      ],
      rlsPolicies: [
        "Public read for basic info (name, location)",
        "Users can update own profile",
        "Admins can update verification status"
      ]
    },
    {
      name: "help_requests", 
      description: "Community help requests (groceries, transport, etc.)",
      primaryKey: "id (UUID)",
      foreignKeys: [
        "user_id → profiles.id (request creator)"
      ],
      keyFields: [
        "id: UUID",
        "user_id: UUID (request creator)",
        "title: TEXT (brief description)",
        "description: TEXT (detailed explanation)",
        "category: ENUM (groceries/transport/household/medical/other)",
        "urgency: ENUM (normal/urgent/critical)",
        "status: ENUM (open/closed/in_progress)",
        "created_at: TIMESTAMP"
      ],
      indexes: [
        "idx_help_requests_user_id",
        "idx_help_requests_status", 
        "idx_help_requests_created_at (DESC)"
      ],
      rlsPolicies: [
        "Public read access for open requests",
        "Users can create requests for themselves",
        "Users can update/delete own requests",
        "Admins can moderate any request"
      ]
    },
    {
      name: "messages",
      description: "Private messaging between users (future feature)",
      primaryKey: "id (UUID)", 
      foreignKeys: [
        "request_id → help_requests.id (related request)",
        "sender_id → profiles.id (message sender)",
        "recipient_id → profiles.id (message recipient)"
      ],
      keyFields: [
        "id: UUID",
        "request_id: UUID (context for message)",
        "sender_id: UUID",
        "recipient_id: UUID", 
        "content: TEXT (message body)",
        "read: BOOLEAN (read status)",
        "created_at: TIMESTAMP"
      ],
      indexes: [
        "idx_messages_request_id",
        "idx_messages_recipient_id",
        "idx_messages_read (recipient_id, read)"
      ],
      rlsPolicies: [
        "Users can only view messages they sent/received",
        "Users can only send as themselves",
        "Message privacy between participants"
      ]
    },
    {
      name: "contact_exchanges",
      description: "Privacy-controlled contact information sharing",
      primaryKey: "id (UUID)",
      foreignKeys: [
        "request_id → help_requests.id (related request)",
        "requester_id → profiles.id (person needing help)",
        "helper_id → profiles.id (person offering help)"
      ],
      keyFields: [
        "id: UUID",
        "request_id: UUID",
        "requester_id: UUID",
        "helper_id: UUID",
        "status: ENUM (initiated/completed/expired)",
        "message: TEXT (helper's message)", 
        "consent_given: BOOLEAN (explicit consent)",
        "initiated_at: TIMESTAMP",
        "completed_at: TIMESTAMP"
      ],
      indexes: [
        "idx_contact_exchanges_request_id",
        "idx_contact_exchanges_helper_id",
        "idx_contact_exchanges_status"
      ],
      rlsPolicies: [
        "Users can only view exchanges they're part of",
        "Explicit consent required from both parties",
        "Audit trail for accountability"
      ]
    },
    {
      name: "audit_logs",
      description: "Admin action tracking for transparency",
      primaryKey: "id (UUID)",
      foreignKeys: [
        "user_id → profiles.id (admin performing action)"
      ],
      keyFields: [
        "id: UUID",
        "user_id: UUID (admin who performed action)",
        "action: TEXT (description of action)",
        "entity_type: TEXT (table/resource affected)",
        "entity_id: UUID (specific record ID)",
        "old_values: JSONB (before state)",
        "new_values: JSONB (after state)",
        "metadata: JSONB (additional context)",
        "created_at: TIMESTAMP"
      ],
      indexes: [
        "idx_audit_logs_user_id",
        "idx_audit_logs_entity (entity_type, entity_id)",
        "idx_audit_logs_created_at (DESC)"
      ],
      rlsPolicies: [
        "Only admins can view audit logs",
        "Only admins can create audit entries",
        "Append-only (no deletions allowed)"
      ]
    }
  ]

  const performanceOptimizations = [
    {
      type: "Database Indexes",
      description: "Strategic indexing for common query patterns",
      details: [
        "Composite indexes for status + created_at queries",
        "Partial indexes for admin users (WHERE is_admin = true)",
        "Descending indexes for timeline views"
      ]
    },
    {
      type: "Next.js Caching",
      description: "Application-level caching with unstable_cache",
      details: [
        "Help requests cached for 60 seconds",
        "User statistics cached for 5 minutes",
        "Search results cached for 2 minutes",
        "Cache invalidation on mutations"
      ]
    },
    {
      type: "Query Optimization", 
      description: "Efficient data fetching patterns",
      details: [
        "Selective field fetching (avoid SELECT *)",
        "JOIN optimization for profile data",
        "Pagination with offset/limit",
        "Batch operations for admin actions"
      ]
    },
    {
      type: "Connection Management",
      description: "Supabase client optimization",
      details: [
        "Server-side client for database operations", 
        "Connection pooling handled by Supabase",
        "RLS policies reduce query complexity",
        "Prepared statements for security"
      ]
    }
  ]

  const mermaidDiagram = `
graph TD
    %% Users and Authentication
    Auth[Supabase Auth Users] -->|extends| P[profiles]
    
    %% Core Tables
    P -->|creates| HR[help_requests]
    P -->|sends/receives| M[messages]
    P -->|initiates| CE[contact_exchanges]
    P -->|performs admin actions| AL[audit_logs]
    
    %% Relationships
    HR -->|context for| M
    HR -->|enables| CE
    
    %% Table Details
    P -.->|verification_status| VS[pending/approved/rejected]
    P -.->|is_admin| AD[admin privileges]
    
    HR -.->|category| CAT[groceries/transport/household/medical/other]
    HR -.->|urgency| URG[normal/urgent/critical]
    HR -.->|status| STAT[open/closed/in_progress]
    
    CE -.->|privacy controls| PRIV[explicit consent required]
    
    AL -.->|audit trail| AUDIT[admin accountability]
    
    %% Security Layer
    RLS[Row Level Security] -.->|protects| P
    RLS -.->|protects| HR  
    RLS -.->|protects| M
    RLS -.->|protects| CE
    RLS -.->|protects| AL
    
    %% Styling
    classDef primary fill:#BC6547,stroke:#483129,stroke-width:2px,color:#FBF2E9
    classDef secondary fill:#324158,stroke:#483129,stroke-width:2px,color:#FBF2E9  
    classDef accent fill:#C39778,stroke:#483129,stroke-width:2px,color:#483129
    classDef security fill:#7A9E99,stroke:#483129,stroke-width:2px,color:#FBF2E9
    
    class Auth,P primary
    class HR,M,CE,AL secondary
    class CAT,URG,STAT,VS,AD,PRIV,AUDIT accent
    class RLS security
  `

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <Link href="/" className="text-primary hover:text-primary-contrast">← Back to Home</Link>
          <span className="text-muted-foreground">|</span>
          <Link href="/design-system/colors" className="text-primary hover:text-primary-contrast">Colors</Link>
          <Link href="/design-system/typography" className="text-primary hover:text-primary-contrast">Typography</Link>
          <Link href="/design-system/permissions" className="text-primary hover:text-primary-contrast">Permissions</Link>
          <span className="font-medium">Database</span>
        </div>
        
        <h1 className="mb-8 text-4xl font-bold text-foreground">
          🗄️ Database Schema & Architecture
        </h1>

        <div className="mb-8 rounded-lg border-l-4 border-primary bg-card p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Developer Note:</strong> Care Collective uses Supabase (PostgreSQL) with Row Level Security (RLS) for data protection. All tables have comprehensive indexes and caching strategies for optimal performance.
          </p>
        </div>

        {/* Database Schema Diagram */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Database Schema Overview</h2>
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Entity Relationship Diagram showing table relationships and security boundaries
              </p>
            </div>
            <div className="overflow-x-auto">
              <div className="mermaid min-w-[800px]" id="database-diagram">
                {mermaidDiagram}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-primary"></div>
                <span className="text-sm">Core Tables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-secondary"></div>
                <span className="text-sm">Feature Tables</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded bg-accent"></div>
                <span className="text-sm">Enums/Constraints</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded" style={{backgroundColor: '#7A9E99'}}></div>
                <span className="text-sm">Security Layer</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Documentation */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Table Documentation</h2>
          <div className="space-y-8">
            {tables.map((table) => (
              <div key={table.name} className="rounded-lg border bg-card p-6">
                <div className="mb-4">
                  <h3 className="mb-2 text-xl font-semibold">
                    <code className="rounded bg-muted px-2 py-1">{table.name}</code>
                  </h3>
                  <p className="text-sm text-muted-foreground">{table.description}</p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-medium">Schema Details</h4>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs font-medium text-blue-700">PRIMARY KEY:</span>
                        <code className="ml-2 text-sm">{table.primaryKey}</code>
                      </div>
                      {table.foreignKeys.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-green-700">FOREIGN KEYS:</span>
                          <ul className="ml-2 mt-1">
                            {table.foreignKeys.map((fk, i) => (
                              <li key={i} className="text-sm">
                                <code>{fk}</code>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-medium text-purple-700">FIELDS:</span>
                        <ul className="ml-2 mt-1 space-y-1">
                          {table.keyFields.map((field, i) => (
                            <li key={i} className="text-sm">
                              <code>{field}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium">Performance & Security</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-orange-700">INDEXES:</span>
                        <ul className="ml-2 mt-1 space-y-1">
                          {table.indexes.map((index, i) => (
                            <li key={i} className="text-sm">
                              <code>{index}</code>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-red-700">RLS POLICIES:</span>
                        <ul className="ml-2 mt-1 space-y-1">
                          {table.rlsPolicies.map((policy, i) => (
                            <li key={i} className="text-sm flex items-start gap-1">
                              <span className="text-red-500 mt-1">•</span>
                              <span>{policy}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Optimizations */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Performance Optimizations</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {performanceOptimizations.map((optimization) => (
              <div key={optimization.type} className="rounded-lg border bg-card p-6">
                <h3 className="mb-2 text-lg font-semibold">{optimization.type}</h3>
                <p className="mb-4 text-sm text-muted-foreground">{optimization.description}</p>
                <ul className="space-y-2">
                  {optimization.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-primary mt-1">▸</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Query Examples */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Common Query Patterns</h2>
          <div className="space-y-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold">Efficient Help Request Fetching</h3>
              <pre className="overflow-x-auto rounded bg-muted p-4 text-sm">
{`// Optimized query with selective fields and joins
const { data } = await supabase
  .from('help_requests')
  .select(\`
    id,
    title,
    category,
    urgency,
    status,
    created_at,
    profiles!inner (
      name,
      location
    )
  \`)
  .eq('status', 'open')
  .order('urgency', { ascending: false })
  .order('created_at', { ascending: false })
  .limit(20)`}
              </pre>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold">Admin Statistics with Caching</h3>
              <pre className="overflow-x-auto rounded bg-muted p-4 text-sm">
{`// Cached statistics query for admin dashboard
export const getStatistics = unstable_cache(
  async () => {
    const [totalRequests, openRequests, totalUsers] = await Promise.all([
      supabase.from('help_requests').select('*', { count: 'exact', head: true }),
      supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('profiles').select('*', { count: 'exact', head: true })
    ])
    
    return { totalRequests, openRequests, totalUsers }
  },
  ['statistics'],
  { revalidate: 600 } // Cache for 10 minutes
)`}
              </pre>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="mb-3 text-lg font-semibold">Privacy-Safe Contact Exchange</h3>
              <pre className="overflow-x-auto rounded bg-muted p-4 text-sm">
{`// Contact exchange with explicit consent and audit trail
const { data, error } = await supabase
  .from('contact_exchanges')
  .insert({
    request_id: requestId,
    requester_id: requesterId,
    helper_id: auth.user.id,
    message: helperMessage,
    consent_given: true,
    status: 'initiated',
    initiated_at: new Date().toISOString()
  })
  .select()
  
// RLS policies ensure only participants can view`}
              </pre>
            </div>
          </div>
        </div>

        {/* Migration Strategy */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="mb-4 text-2xl font-bold">Migration & Development</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-3 font-medium">Database Migrations</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><code>20240811000000_initial_schema.sql</code> - Base tables and RLS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><code>20250903000000_add_user_verification.sql</code> - Waitlist system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span><code>20250811090000_add_admin_support.sql</code> - Admin features</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>All migrations have rollback procedures</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-3 font-medium">Development Commands</h3>
              <ul className="space-y-2 text-sm">
                <li><code className="rounded bg-muted px-2 py-1">supabase db reset</code> - Reset local DB</li>
                <li><code className="rounded bg-muted px-2 py-1">supabase migration new [name]</code> - New migration</li>
                <li><code className="rounded bg-muted px-2 py-1">supabase gen types typescript</code> - Generate types</li>
                <li><code className="rounded bg-muted px-2 py-1">npm run db:types</code> - Update local types</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Mermaid.js script */}
      <script 
        type="module"
        dangerouslySetInnerHTML={{
          __html: `
            import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
            mermaid.initialize({ 
              startOnLoad: true,
              theme: 'base',
              themeVariables: {
                primaryColor: '#BC6547',
                primaryTextColor: '#FBF2E9', 
                primaryBorderColor: '#483129',
                lineColor: '#483129',
                secondaryColor: '#324158',
                tertiaryColor: '#C39778'
              }
            });
          `
        }}
      />
    </div>
  )
}