# GitHub MCP Server Configuration for Care Collective

## Configuration Template

Add this configuration to your `~/.claude.json` file under the Care Collective project:

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

## Required GitHub Token Permissions

Your GitHub Personal Access Token needs these permissions for the Care Collective repository:

- **Contents**: Read and write (for file operations)
- **Issues**: Read and write (for issue management)
- **Pull requests**: Read and write (for PR creation)
- **Metadata**: Read (for repository information)

## Setup Steps

1. **Create GitHub Token**: Follow the instructions in this file to create a fine-grained personal access token
2. **Replace Token**: Replace `YOUR_GITHUB_TOKEN_HERE` with your actual token
3. **Restart Claude**: Restart Claude Code for the configuration to take effect
4. **Test Connection**: Use GitHub MCP commands to verify connectivity

## Available GitHub MCP Features

Once configured, you'll have access to:

- **Repository Management**: Browse files, search code, analyze commits
- **Issue & PR Operations**: Create, update, manage issues and pull requests
- **Workflow Intelligence**: Monitor GitHub Actions, analyze build failures
- **Code Analysis**: Review security findings, examine code patterns

## Security Notes

- Never commit the token to any repository
- Use environment variables or secure configuration for tokens
- Regularly rotate your GitHub tokens
- Limit token scope to only required repositories

## Troubleshooting

If the GitHub MCP server fails to connect:

1. Verify token permissions match the repository
2. Check token hasn't expired
3. Ensure repository name is correct: `musickevan1/care-collective-preview`
4. Restart Claude Code after configuration changes