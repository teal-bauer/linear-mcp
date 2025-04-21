# Linear MCP Server

> Note: This is a custom implementation. For the official Cline Linear MCP server, see [cline/linear-mcp](https://github.com/cline/linear-mcp).
>
> This repository was forked from [tiovikram/linear-mcp](https://github.com/tiovikram/linear-mcp), which was in turn forked from [ibraheem4/linear-mcp](https://github.com/ibraheem4/linear-mcp).

A Model Context Protocol (MCP) server that provides tools for interacting with Linear's API, enabling AI agents to manage issues, projects, and teams programmatically through the Linear platform.

## Features

- **Issue Management**
  - Create new issues with customizable properties (title, description, team, assignee, priority, labels)
  - List issues with flexible filtering options (team, assignee, state)
  - Update existing issues (title, description, state, assignee, priority)
  - Get detailed issue information by ID or identifier (e.g., 'TEAM-123')
  - Add comments to issues
  - Manage issue labels

- **Team Management**
  - List all teams in the workspace
  - Access team details including ID, name, key, and description
  - List workflow states for teams
  - Manage team cycles (sprints)

- **Project Management**
  - List all projects with optional team filtering
  - View project details including name, description, state, and associated teams

- **Label Management**
  - List all labels in the workspace
  - Create new labels with custom colors
  - Remove existing labels

- **Cycle (Sprint) Management**
  - List cycles for a team
  - Get detailed cycle information including progress and issues

## Prerequisites

- node.js (v18 or higher)
- A Linear account with API access
- Linear API key with appropriate permissions

## Quick Start

1. Get your Linear API key from [Linear's Developer Settings](https://linear.app/settings/api)

2. Run with your API key:

```bash
LINEAR_API_KEY=your-api-key npx @teal-bauer/linear-mcp
```

Or set it in your environment:

```bash
export LINEAR_API_KEY=your-api-key
npx @teal-bauer/linear-mcp
```

## Development Setup

1. Clone the repository:

```bash
git clone [repository-url]
cd linear-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Build the project:

```bash
npm run build
```

## Running with Inspector

For local development and debugging, you can use the MCP Inspector:

1. Install supergateway:

```bash
npm install -g supergateway
```

2. Use the included `run.sh` script:

```bash
chmod +x run.sh
LINEAR_API_KEY=your-api-key ./run.sh
```

3. Access the Inspector:
   - Open [localhost:1337](http://localhost:1337) in your browser
   - The Inspector connects via Server-Sent Events (SSE)
   - Test and debug tool calls through the Inspector interface

## Configuration

Configure the MCP server in your settings file based on your client:

### For Claude Desktop

- MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "linear-mcp": {
      "command": "node",
      "args": ["/path/to/linear-mcp/build/index.js"],
      "env": {
        "LINEAR_API_KEY": "your-api-key-here"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

### For VS Code Extension (Cline)

Location: `~/Library/Application Support/Code/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "linear-mcp": {
      "command": "node",
      "args": ["/path/to/linear-mcp/build/index.js"],
      "env": {
        "LINEAR_API_KEY": "your-api-key-here"
      },
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

### For Cursor ([cursor.sh](https://cursor.sh))

For Cursor, the server must be run with the full path:

```bash
node /Users/ibraheem/Projects/linear-mcp/build/index.js
```

## Available Tools

### create_issue

Creates a new issue in Linear.

```typescript
{
  title: string;          // Required: Issue title
  description?: string;   // Optional: Issue description (markdown supported)
  teamId: string;        // Required: Team ID
  assigneeId?: string;   // Optional: Assignee user ID
  priority?: number;     // Optional: Priority (0-4)
  labels?: string[];     // Optional: Label IDs to apply
}
```

### list_issues

Lists issues with optional filters.

```typescript
{
  teamId?: string;      // Optional: Filter by team ID
  assigneeId?: string;  // Optional: Filter by assignee ID
  status?: string;      // Optional: Filter by state name
  first?: number;       // Optional: Number of issues to return (default: 50)
}
```

Note: When filtering by status, use the state name as returned by `list_workflow_states`.

### update_issue

Updates an existing issue.

```typescript
{
  issueId: string;       // Required: Issue ID
  title?: string;        // Optional: New title
  description?: string;  // Optional: New description
  stateId?: string;     // Optional: New workflow state ID (must use list_workflow_states to get valid state IDs)
  assigneeId?: string;  // Optional: New assignee ID
  priority?: number;    // Optional: New priority (0-4)
}
```

**Important Note**: To change an issue's state/status, you must:
1. First use `list_workflow_states` with the team's ID to get available workflow states
2. Then use the desired state's ID in the `stateId` parameter of `update_issue`

Example workflow:
```typescript
// 1. Get workflow states for the team
const states = await listWorkflowStates({ teamId: "team_123" });
// Returns: [{ id: "state_456", name: "Done", type: "completed" }, ...]

// 2. Update issue with the desired state ID
await updateIssue({ 
  issueId: "issue_789",
  stateId: "state_456" // Use the actual state ID, not the name
});
```

### list_teams

Lists all teams in the workspace. No parameters required.

### list_projects

Lists all projects with optional filtering.

```typescript
{
  teamId?: string;     // Optional: Filter by team ID
  first?: number;      // Optional: Number of projects to return (default: 50)
}
```

### list_workflow_states

Lists workflow states (statuses) for a team.

```typescript
{
  teamId: string;  // Required: Team ID
}
```

Returns an array of state objects containing id, name, type, color, description, and position.

### create_comment

Adds a comment to an issue.

```typescript
{
  issueId: string;  // Required: Issue ID
  body: string;     // Required: Comment text (markdown supported)
}
```

### get_issue_by_identifier

Gets detailed information about an issue using its human-readable identifier.

```typescript
{
  identifier: string;  // Required: Issue identifier (e.g., 'TEAM-123')
}
```

### list_labels

Lists issue labels in the workspace.

```typescript
{
  teamId?: string;  // Optional: Filter by team ID
}
```

### add_label

Creates a new label.

```typescript
{
  name: string;         // Required: Label name
  color: string;        // Required: Label color (hex code)
  teamId: string;       // Required: Team ID
  description?: string; // Optional: Label description
}
```

### remove_label

Deletes a label.

```typescript
{
  labelId: string;  // Required: Label ID
}
```

### list_cycles

Lists cycles (sprints) for a team.

```typescript
{
  teamId: string;     // Required: Team ID
  first?: number;     // Optional: Number of cycles to return (default: 50)
}
```

### get_cycle

Gets detailed information about a specific cycle.

```typescript
{
  cycleId: string;  // Required: Cycle ID
}
```

### get_issue

Gets detailed information about a specific issue.

```typescript
{
  issueId: string;  // Required: Issue ID
}
```

Returns comprehensive issue details including:
- Basic information (title, description, priority)
- Current state and workflow information
- Assignee and creator details
- Team and project associations
- Labels and comments
- Attachments and embedded images
- Timestamps and lifecycle information

### get_project

Gets detailed information about a specific project.

```typescript
{
  projectId: string;  // Required: Project ID
}
```

### get_team

Gets detailed information about a specific team.

```typescript
{
  teamId: string;  // Required: Team ID
}
```

### list_users

Lists all users in the workspace.

```typescript
{
  first?: number;  // Optional: Number of users to return (default: 50)
}
```

### get_user

Gets detailed information about a specific user.

```typescript
{
  userId: string;  // Required: User ID
}
```

### get_viewer

Gets detailed information about the authenticated user. No parameters required.

### list_comments

Lists comments for a specific issue.

```typescript
{
  issueId: string;  // Required: Issue ID
  first?: number;   // Optional: Number of comments to return (default: 50)
}
```

### list_attachments

Lists attachments for a specific issue.

```typescript
{
  issueId: string;  // Required: Issue ID
  first?: number;   // Optional: Number of attachments to return (default: 50)
}
```

## Development

For development with auto-rebuild:

```bash
npm run watch
```

## Error Handling

The server includes comprehensive error handling for:

- Invalid API keys
- Missing required parameters
- Linear API errors
- Invalid tool requests

All errors are properly formatted and returned with descriptive messages.

## Technical Details

Built with:

- TypeScript
- Linear SDK (@linear/sdk v39.0.0)
- MCP SDK (@modelcontextprotocol/sdk v0.6.0)

The server uses stdio for communication and implements the Model Context Protocol for seamless integration with AI agents.

## License

MIT
