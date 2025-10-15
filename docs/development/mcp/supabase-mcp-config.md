# Supabase MCP Server Configuration for Care Collective

## Configuration Template

Add this configuration to your `~/.claude.json` file for the Care Collective project:

```json
{
  "projects": {
    "/home/evan/Projects/Care-Collective/care-collective-preview": {
      "mcpServers": {
        "github": {
          "type": "http",
          "url": "https://api.githubcopilot.com/mcp/",
          "headers": {
            "Authorization": "Bearer YOUR_GITHUB_TOKEN_HERE"
          }
        },
        "supabase": {
          "type": "stdio",
          "command": "npx",
          "args": [
            "-y",
            "@supabase/mcp-server-supabase@latest",
            "--read-only",
            "--project-ref=kecureoyekeqhrxkmjuh"
          ]
        },
        "playwright": {
          "type": "stdio",
          "command": "npx",
          "args": ["@playwright/mcp@latest"]
        }
      }
    }
  }
}
```

## Care Collective Supabase Project Details

- **Project Reference**: `kecureoyekeqhrxkmjuh`
- **Mode**: Read-only (safe for development)
- **Database**: PostgreSQL with Care Collective schema
- **Key Tables**: help_requests, profiles, contact_exchanges

## Available Supabase MCP Features

Once configured, you'll have access to:

### Database Operations
- **Schema Inspection**: View tables, columns, relationships
- **Query Execution**: Run read-only SQL queries
- **RLS Policy Analysis**: Examine Row Level Security policies
- **Data Exploration**: Browse Care Collective data safely

### Management Tools
- **Table Management**: Inspect help_requests, profiles tables
- **Configuration Review**: Check project settings
- **Storage Analysis**: Review file storage buckets
- **Real-time Monitoring**: Check real-time subscriptions

## Security Features

- **Read-Only Mode**: Prevents accidental data modifications
- **Project Scoping**: Limited to Care Collective project only
- **Safe Queries**: All operations run as read-only transactions
- **Audit Trail**: All MCP operations are logged

## Sample Queries for Care Collective

### Help Requests Analysis
```sql
-- View open help requests
SELECT
  id, title, category, urgency, created_at,
  profiles.name as requester_name
FROM help_requests
LEFT JOIN profiles ON help_requests.user_id = profiles.id
WHERE status = 'open'
ORDER BY urgency DESC, created_at DESC
LIMIT 10;
```

### User Activity Overview
```sql
-- Check user registrations and activity
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as recent_signups
FROM profiles;
```

### Contact Exchange Monitoring
```sql
-- Monitor contact exchanges for safety
SELECT
  DATE(created_at) as exchange_date,
  COUNT(*) as exchanges_count
FROM contact_exchanges
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY exchange_date DESC;
```

## Best Practices

### Development Safety
- Always use read-only mode for MCP operations
- Test queries on development data first
- Verify RLS policies are working correctly
- Monitor for unusual data patterns

### Care Collective Specific
- Focus on help_requests table for core functionality
- Check user verification status in profiles
- Monitor contact_exchanges for community safety
- Validate privacy compliance in all queries

## Troubleshooting

### Common Issues
1. **Connection Failed**: Verify project reference is correct
2. **Permission Denied**: Ensure read-only mode is enabled
3. **Query Timeout**: Limit query complexity and row counts
4. **MCP Server Not Found**: Check npx and npm installation

### Debug Commands
```bash
# Test Supabase MCP server directly
npx @supabase/mcp-server-supabase@latest --read-only --project-ref=kecureoyekeqhrxkmjuh

# Verify npm package
npm view @supabase/mcp-server-supabase

# Check Node.js version compatibility
node --version
```

## Integration with Care Collective Development

### Use Cases for MCP
- **Database Schema Review**: Understand table structures
- **Data Quality Checks**: Validate data integrity
- **Performance Analysis**: Identify slow queries
- **Security Audits**: Review RLS policy effectiveness
- **Feature Development**: Understand data relationships

### Workflow Integration
1. Use Supabase MCP for database inspection
2. Use GitHub MCP for repository management
3. Use Playwright MCP for UI testing
4. Coordinate all three for comprehensive development