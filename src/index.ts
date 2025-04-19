#!/usr/bin/env node

import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load .env file from the project root
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env") });

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Request } from "@modelcontextprotocol/sdk/types.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { LinearClient } from "@linear/sdk";

const API_KEY = process.env.LINEAR_API_KEY || process.env.LINEARAPIKEY;
if (!API_KEY) {
  console.error("Error: LINEAR_API_KEY environment variable is required");
  console.error("");
  console.error("To use this tool, run it with your Linear API key:");
  console.error("LINEAR_API_KEY=your-api-key npx @ibraheem4/linear-mcp");
  console.error("");
  console.error("Or set it in your environment:");
  console.error("export LINEAR_API_KEY=your-api-key");
  console.error("npx @ibraheem4/linear-mcp");
  process.exit(1);
}

const linearClient = new LinearClient({
  apiKey: API_KEY,
});

const server = new Server(
  {
    name: "linear-mcp",
    version: "39.0.0", // Match Linear SDK version
  },
  {
    capabilities: {
      tools: {
        create_issue: true,
        list_issues: true,
        update_issue: true,
        list_teams: true,
        list_projects: true,
        search_issues: true,
        get_issue: true,
        list_workflow_states: true,
        create_comment: true,
        get_issue_by_identifier: true,
        list_labels: true,
        add_label: true,
        remove_label: true,
        list_cycles: true,
        get_cycle: true,
      },
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "create_issue",
      description: "Create a new issue in Linear",
      inputSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Issue title",
          },
          description: {
            type: "string",
            description: "Issue description (markdown supported)",
          },
          teamId: {
            type: "string",
            description: "Team ID",
          },
          assigneeId: {
            type: "string",
            description: "Assignee user ID (optional)",
          },
          priority: {
            type: "number",
            description: "Priority (0-4, optional)",
            minimum: 0,
            maximum: 4,
          },
          labels: {
            type: "array",
            items: {
              type: "string",
            },
            description: "Label IDs to apply (optional)",
          },
        },
        required: ["title", "teamId"],
      },
    },
    {
      name: "list_issues",
      description: "List issues with optional filters",
      inputSchema: {
        type: "object",
        properties: {
          teamId: {
            type: "string",
            description: "Filter by team ID (optional)",
          },
          assigneeId: {
            type: "string",
            description: "Filter by assignee ID (optional)",
          },
          status: {
            type: "string",
            description: "Filter by status (optional)",
          },
          first: {
            type: "number",
            description: "Number of issues to return (default: 50)",
          },
        },
      },
    },
    {
      name: "update_issue",
      description: "Update an existing issue",
      inputSchema: {
        type: "object",
        properties: {
          issueId: {
            type: "string",
            description: "Issue ID",
          },
          title: {
            type: "string",
            description: "New title (optional)",
          },
          description: {
            type: "string",
            description: "New description (optional)",
          },
          stateId: {
            type: "string",
            description: "New workflow state ID (optional). Use list_workflow_states to get valid state IDs.",
          },
          assigneeId: {
            type: "string",
            description: "New assignee ID (optional)",
          },
          priority: {
            type: "number",
            description: "New priority (0-4, optional)",
            minimum: 0,
            maximum: 4,
          },
        },
        required: ["issueId"],
      },
    },
    {
      name: "list_teams",
      description: "List all teams in the workspace",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "list_projects",
      description: "List all projects",
      inputSchema: {
        type: "object",
        properties: {
          teamId: {
            type: "string",
            description: "Filter by team ID (optional)",
          },
          first: {
            type: "number",
            description: "Number of projects to return (default: 50)",
          },
        },
      },
    },
    {
      name: "search_issues",
      description: "Search for issues using a text query",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query text",
          },
          first: {
            type: "number",
            description: "Number of results to return (default: 50)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_issue",
      description: "Get detailed information about a specific issue",
      inputSchema: {
        type: "object",
        properties: {
          issueId: {
            type: "string",
            description: "Issue ID",
          },
        },
        required: ["issueId"],
      },
    },
    {
      name: "list_workflow_states",
      description: "List workflow states (statuses) for a team",
      inputSchema: {
        type: "object",
        properties: {
          teamId: {
            type: "string",
            description: "Team ID",
          },
        },
        required: ["teamId"],
      },
    },
    {
      name: "create_comment",
      description: "Add a comment to an issue",
      inputSchema: {
        type: "object",
        properties: {
          issueId: {
            type: "string",
            description: "Issue ID",
          },
          body: {
            type: "string",
            description: "Comment text (markdown supported)",
          },
        },
        required: ["issueId", "body"],
      },
    },
    {
      name: "get_issue_by_identifier",
      description: "Get detailed information about an issue using its human-readable identifier (e.g., 'TEAM-123')",
      inputSchema: {
        type: "object",
        properties: {
          identifier: {
            type: "string",
            description: "Issue identifier (e.g., 'TEAM-123')",
          },
        },
        required: ["identifier"],
      },
    },
    {
      name: "list_labels",
      description: "List issue labels in the workspace",
      inputSchema: {
        type: "object",
        properties: {
          teamId: {
            type: "string",
            description: "Filter by team ID (optional)",
          },
        },
      },
    },
    {
      name: "add_label",
      description: "Create a new label",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Label name",
          },
          color: {
            type: "string",
            description: "Label color (hex code)",
          },
          teamId: {
            type: "string",
            description: "Team ID",
          },
          description: {
            type: "string",
            description: "Label description (optional)",
          },
        },
        required: ["name", "color", "teamId"],
      },
    },
    {
      name: "remove_label",
      description: "Delete a label",
      inputSchema: {
        type: "object",
        properties: {
          labelId: {
            type: "string",
            description: "Label ID",
          },
        },
        required: ["labelId"],
      },
    },
    {
      name: "list_cycles",
      description: "List cycles (sprints) for a team",
      inputSchema: {
        type: "object",
        properties: {
          teamId: {
            type: "string",
            description: "Team ID",
          },
          first: {
            type: "number",
            description: "Number of cycles to return (default: 50)",
          },
        },
        required: ["teamId"],
      },
    },
    {
      name: "get_cycle",
      description: "Get detailed information about a specific cycle",
      inputSchema: {
        type: "object",
        properties: {
          cycleId: {
            type: "string",
            description: "Cycle ID",
          },
        },
        required: ["cycleId"],
      },
    },
  ],
}));

type CreateIssueArgs = {
  title: string;
  description?: string;
  teamId: string;
  assigneeId?: string;
  priority?: number;
  labels?: string[];
};

type ListIssuesArgs = {
  teamId?: string;
  assigneeId?: string;
  status?: string;
  first?: number;
};

type UpdateIssueArgs = {
  issueId: string;
  title?: string;
  description?: string;
  stateId?: string;
  assigneeId?: string;
  priority?: number;
};

type ListProjectsArgs = {
  teamId?: string;
  first?: number;
};

type SearchIssuesArgs = {
  query: string;
  first?: number;
};

type GetIssueArgs = {
  issueId: string;
};

type ListWorkflowStatesArgs = {
  teamId: string;
};

type CreateCommentArgs = {
  issueId: string;
  body: string;
};

type GetIssueByIdentifierArgs = {
  identifier: string;
};

type ListLabelsArgs = {
  teamId?: string;
};

type AddLabelArgs = {
  name: string;
  color: string;
  teamId: string;
  description?: string;
};

type RemoveLabelArgs = {
  labelId: string;
};

type ListCyclesArgs = {
  teamId: string;
  first?: number;
};

type GetCycleArgs = {
  cycleId: string;
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    switch (request.params.name) {
      case "create_issue": {
        const args = request.params.arguments as unknown as CreateIssueArgs;
        if (!args?.title || !args?.teamId) {
          throw new Error("Title and teamId are required");
        }

        const issue = await linearClient.createIssue({
          title: args.title,
          description: args.description,
          teamId: args.teamId,
          assigneeId: args.assigneeId,
          priority: args.priority,
          labelIds: args.labels,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(issue, null, 2),
            },
          ],
        };
      }

      case "list_issues": {
        const args = request.params.arguments as unknown as ListIssuesArgs;
        const filter: Record<string, any> = {};
        if (args?.teamId) filter.team = { id: { eq: args.teamId } };
        if (args?.assigneeId) filter.assignee = { id: { eq: args.assigneeId } };
        if (args?.status) filter.state = { name: { eq: args.status } };

        const issues = await linearClient.issues({
          first: args?.first ?? 50,
          filter,
        });

        const formattedIssues = await Promise.all(
          issues.nodes.map(async (issue) => {
            const state = await issue.state;
            const assignee = await issue.assignee;
            return {
              id: issue.id,
              title: issue.title,
              status: state ? await state.name : "Unknown",
              assignee: assignee ? assignee.name : "Unassigned",
              priority: issue.priority,
              url: issue.url,
            };
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedIssues, null, 2),
            },
          ],
        };
      }

      case "update_issue": {
        const args = request.params.arguments as unknown as UpdateIssueArgs;
        if (!args?.issueId) {
          throw new Error("Issue ID is required");
        }

        const issue = await linearClient.issue(args.issueId);
        if (!issue) {
          throw new Error(`Issue ${args.issueId} not found`);
        }

        const updatedIssue = await issue.update({
          title: args.title,
          description: args.description,
          stateId: args.stateId,
          assigneeId: args.assigneeId,
          priority: args.priority,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(updatedIssue, null, 2),
            },
          ],
        };
      }

      case "list_teams": {
        const query = await linearClient.teams();
        const teams = await Promise.all(
          (query as any).nodes.map(async (team: any) => ({
            id: team.id,
            name: team.name,
            key: team.key,
            description: team.description,
          }))
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(teams, null, 2),
            },
          ],
        };
      }

      case "list_projects": {
        const args = request.params.arguments as unknown as ListProjectsArgs;
        const filter: Record<string, any> = {};
        if (args?.teamId) filter.team = { id: { eq: args.teamId } };

        const query = await linearClient.projects({
          first: args?.first ?? 50,
          filter,
        });

        const projects = await Promise.all(
          (query as any).nodes.map(async (project: any) => {
            const teamsConnection = await project.teams;
            const teams = teamsConnection ? (teamsConnection as any).nodes : [];
            return {
              id: project.id,
              name: project.name,
              description: project.description,
              state: project.state,
              teamIds: teams.map((team: any) => team.id),
            };
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(projects, null, 2),
            },
          ],
        };
      }

      case "search_issues": {
        const args = request.params.arguments as unknown as SearchIssuesArgs;
        if (!args?.query) {
          throw new Error("Search query is required");
        }

        const searchResults = await linearClient.searchIssues(args.query, {
          first: args?.first ?? 50,
        });

        const formattedResults = await Promise.all(
          searchResults.nodes.map(async (result) => {
            const state = await result.state;
            const assignee = await result.assignee;
            return {
              id: result.id,
              title: result.title,
              status: state ? await state.name : "Unknown",
              assignee: assignee ? assignee.name : "Unassigned",
              priority: result.priority,
              url: result.url,
              metadata: result.metadata,
            };
          })
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedResults, null, 2),
            },
          ],
        };
      }

      case "list_workflow_states": {
        const args = request.params.arguments as unknown as ListWorkflowStatesArgs;
        if (!args?.teamId) {
          throw new Error("Team ID is required");
        }

        const team = await linearClient.team(args.teamId);
        if (!team) {
          throw new Error(`Team ${args.teamId} not found`);
        }

        const states = await team.states();
        const formattedStates = await Promise.all(
          states.nodes.map(async (state) => ({
            id: state.id,
            name: state.name,
            type: state.type,
            color: state.color,
            description: state.description,
            position: state.position,
          }))
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedStates, null, 2),
            },
          ],
        };
      }

      case "create_comment": {
        const args = request.params.arguments as unknown as CreateCommentArgs;
        if (!args?.issueId || !args?.body) {
          throw new Error("Issue ID and comment body are required");
        }

        const issue = await linearClient.issue(args.issueId);
        if (!issue) {
          throw new Error(`Issue ${args.issueId} not found`);
        }

        const comment = await linearClient.createComment({
          issueId: args.issueId,
          body: args.body,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(comment, null, 2),
            },
          ],
        };
      }

      case "get_issue_by_identifier": {
        const args = request.params.arguments as unknown as GetIssueByIdentifierArgs;
        if (!args?.identifier) {
          throw new Error("Issue identifier is required");
        }

        // Search for the issue using the identifier
        const searchResults = await linearClient.issues({
          filter: {
            number: { eq: parseInt(args.identifier.split('-')[1], 10) },
            team: { key: { eq: args.identifier.split('-')[0] } },
          },
          first: 1,
        });

        if (!searchResults.nodes.length) {
          throw new Error(`Issue ${args.identifier} not found`);
        }

        const issue = searchResults.nodes[0];

        try {
          const [
            state,
            assignee,
            creator,
            team,
            project,
            parent,
            cycle,
            labels,
            comments,
            attachments,
          ] = await Promise.all([
            issue.state,
            issue.assignee,
            issue.creator,
            issue.team,
            issue.project,
            issue.parent,
            issue.cycle,
            issue.labels(),
            issue.comments(),
            issue.attachments(),
          ]);

          const issueDetails: {
            id: string;
            identifier: string;
            title: string;
            description: string | undefined;
            priority: number;
            priorityLabel: string;
            status: string;
            url: string;
            createdAt: Date;
            updatedAt: Date;
            startedAt: Date | null;
            completedAt: Date | null;
            canceledAt: Date | null;
            dueDate: string | null;
            assignee: { id: string; name: string; email: string } | null;
            creator: { id: string; name: string; email: string } | null;
            team: { id: string; name: string; key: string } | null;
            project: { id: string; name: string; state: string } | null;
            parent: { id: string; title: string; identifier: string } | null;
            cycle: { id: string; name: string; number: number } | null;
            labels: Array<{ id: string; name: string; color: string }>;
            comments: Array<{ id: string; body: string; createdAt: Date }>;
            attachments: Array<{ id: string; title: string; url: string }>;
            embeddedImages: Array<{ url: string; analysis: string }>;
            estimate: number | null;
            customerTicketCount: number;
            previousIdentifiers: string[];
            branchName: string;
            archivedAt: Date | null;
            autoArchivedAt: Date | null;
            autoClosedAt: Date | null;
            trashed: boolean;
          } = {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
            priorityLabel: issue.priorityLabel,
            status: state ? await state.name : "Unknown",
            url: issue.url,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            startedAt: issue.startedAt || null,
            completedAt: issue.completedAt || null,
            canceledAt: issue.canceledAt || null,
            dueDate: issue.dueDate,
            assignee: assignee
              ? {
                  id: assignee.id,
                  name: assignee.name,
                  email: assignee.email,
                }
              : null,
            creator: creator
              ? {
                  id: creator.id,
                  name: creator.name,
                  email: creator.email,
                }
              : null,
            team: team
              ? {
                  id: team.id,
                  name: team.name,
                  key: team.key,
                }
              : null,
            project: project
              ? {
                  id: project.id,
                  name: project.name,
                  state: project.state,
                }
              : null,
            parent: parent
              ? {
                  id: parent.id,
                  title: parent.title,
                  identifier: parent.identifier,
                }
              : null,
            cycle:
              cycle && cycle.name
                ? {
                    id: cycle.id,
                    name: cycle.name,
                    number: cycle.number,
                  }
                : null,
            labels: await Promise.all(
              labels.nodes.map(async (label: any) => ({
                id: label.id,
                name: label.name,
                color: label.color,
              }))
            ),
            comments: await Promise.all(
              comments.nodes.map(async (comment: any) => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt,
              }))
            ),
            attachments: await Promise.all(
              attachments.nodes.map(async (attachment: any) => ({
                id: attachment.id,
                title: attachment.title,
                url: attachment.url,
              }))
            ),
            embeddedImages: [],
            estimate: issue.estimate || null,
            customerTicketCount: issue.customerTicketCount || 0,
            previousIdentifiers: issue.previousIdentifiers || [],
            branchName: issue.branchName || "",
            archivedAt: issue.archivedAt || null,
            autoArchivedAt: issue.autoArchivedAt || null,
            autoClosedAt: issue.autoClosedAt || null,
            trashed: issue.trashed || false,
          };

          // Extract embedded images from description
          const imageMatches =
            issue.description?.match(/!\[.*?\]\((.*?)\)/g) || [];
          if (imageMatches.length > 0) {
            issueDetails.embeddedImages = imageMatches.map((match) => {
              const url = (match as string).match(/\((.*?)\)/)?.[1] || "";
              return {
                url,
                analysis: "Image analysis would go here",
              };
            });
          }

          // Add image analysis for attachments if they are images
          issueDetails.attachments = await Promise.all(
            attachments.nodes
              .filter((attachment: any) =>
                attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
              )
              .map(async (attachment: any) => ({
                id: attachment.id,
                title: attachment.title,
                url: attachment.url,
                analysis: "Image analysis would go here",
              }))
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(issueDetails, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error("Error processing issue details:", error);
          throw new Error(`Failed to process issue details: ${error.message}`);
        }
      }

      case "list_labels": {
        const args = request.params.arguments as unknown as ListLabelsArgs;
        const filter: Record<string, any> = {};
        if (args?.teamId) filter.team = { id: { eq: args.teamId } };

        const labels = await linearClient.issueLabels({
          filter,
        });

        const formattedLabels = await Promise.all(
          labels.nodes.map(async (label) => ({
            id: label.id,
            name: label.name,
            color: label.color,
            description: label.description,
            team: label.team ? await label.team.then(team => ({
              id: team.id,
              name: team.name,
              key: team.key,
            })) : null,
          }))
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedLabels, null, 2),
            },
          ],
        };
      }

      case "add_label": {
        const args = request.params.arguments as unknown as AddLabelArgs;
        if (!args?.name || !args?.color || !args?.teamId) {
          throw new Error("Label name, color, and teamId are required");
        }

        const label = await linearClient.createIssueLabel({
          name: args.name,
          color: args.color,
          teamId: args.teamId,
          description: args.description,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(label, null, 2),
            },
          ],
        };
      }

      case "remove_label": {
        const args = request.params.arguments as unknown as RemoveLabelArgs;
        if (!args?.labelId) {
          throw new Error("Label ID is required");
        }

        const label = await linearClient.issueLabel(args.labelId);
        if (!label) {
          throw new Error(`Label ${args.labelId} not found`);
        }

        await label.delete();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ success: true, labelId: args.labelId }, null, 2),
            },
          ],
        };
      }

      case "list_cycles": {
        const args = request.params.arguments as unknown as ListCyclesArgs;
        if (!args?.teamId) {
          throw new Error("Team ID is required");
        }

        const team = await linearClient.team(args.teamId);
        if (!team) {
          throw new Error(`Team ${args.teamId} not found`);
        }

        const cycles = await team.cycles({
          first: args?.first ?? 50,
        });

        const formattedCycles = await Promise.all(
          cycles.nodes.map(async (cycle) => ({
            id: cycle.id,
            number: cycle.number,
            name: cycle.name,
            description: cycle.description,
            startsAt: cycle.startsAt,
            endsAt: cycle.endsAt,
            completedAt: cycle.completedAt,
            progress: cycle.progress,
          }))
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(formattedCycles, null, 2),
            },
          ],
        };
      }

      case "get_cycle": {
        const args = request.params.arguments as unknown as GetCycleArgs;
        if (!args?.cycleId) {
          throw new Error("Cycle ID is required");
        }

        const cycle = await linearClient.cycle(args.cycleId);
        if (!cycle) {
          throw new Error(`Cycle ${args.cycleId} not found`);
        }

        const [team, issues] = await Promise.all([
          cycle.team,
          cycle.issues(),
        ]);

        const formattedIssues = await Promise.all(
          issues.nodes.map(async (issue) => {
            const state = await issue.state;
            return {
              id: issue.id,
              identifier: issue.identifier,
              title: issue.title,
              status: state ? state.name : "Unknown",
              priority: issue.priority,
              url: issue.url,
            };
          })
        );

        const cycleDetails = {
          id: cycle.id,
          number: cycle.number,
          name: cycle.name,
          description: cycle.description,
          startsAt: cycle.startsAt,
          endsAt: cycle.endsAt,
          completedAt: cycle.completedAt,
          progress: cycle.progress,
          team: team ? {
            id: team.id,
            name: team.name,
            key: team.key,
          } : null,
          issues: formattedIssues,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cycleDetails, null, 2),
            },
          ],
        };
      }

      case "get_issue": {
        const args = request.params.arguments as unknown as GetIssueArgs;
        if (!args?.issueId) {
          throw new Error("Issue ID is required");
        }

        const issue = await linearClient.issue(args.issueId);
        if (!issue) {
          throw new Error(`Issue ${args.issueId} not found`);
        }

        try {
          const [
            state,
            assignee,
            creator,
            team,
            project,
            parent,
            cycle,
            labels,
            comments,
            attachments,
          ] = await Promise.all([
            issue.state,
            issue.assignee,
            issue.creator,
            issue.team,
            issue.project,
            issue.parent,
            issue.cycle,
            issue.labels(),
            issue.comments(),
            issue.attachments(),
          ]);

          const issueDetails: {
            id: string;
            identifier: string;
            title: string;
            description: string | undefined;
            priority: number;
            priorityLabel: string;
            status: string;
            url: string;
            createdAt: Date;
            updatedAt: Date;
            startedAt: Date | null;
            completedAt: Date | null;
            canceledAt: Date | null;
            dueDate: string | null;
            assignee: { id: string; name: string; email: string } | null;
            creator: { id: string; name: string; email: string } | null;
            team: { id: string; name: string; key: string } | null;
            project: { id: string; name: string; state: string } | null;
            parent: { id: string; title: string; identifier: string } | null;
            cycle: { id: string; name: string; number: number } | null;
            labels: Array<{ id: string; name: string; color: string }>;
            comments: Array<{ id: string; body: string; createdAt: Date }>;
            attachments: Array<{ id: string; title: string; url: string }>;
            embeddedImages: Array<{ url: string; analysis: string }>;
            estimate: number | null;
            customerTicketCount: number;
            previousIdentifiers: string[];
            branchName: string;
            archivedAt: Date | null;
            autoArchivedAt: Date | null;
            autoClosedAt: Date | null;
            trashed: boolean;
          } = {
            id: issue.id,
            identifier: issue.identifier,
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
            priorityLabel: issue.priorityLabel,
            status: state ? await state.name : "Unknown",
            url: issue.url,
            createdAt: issue.createdAt,
            updatedAt: issue.updatedAt,
            startedAt: issue.startedAt || null,
            completedAt: issue.completedAt || null,
            canceledAt: issue.canceledAt || null,
            dueDate: issue.dueDate,
            assignee: assignee
              ? {
                  id: assignee.id,
                  name: assignee.name,
                  email: assignee.email,
                }
              : null,
            creator: creator
              ? {
                  id: creator.id,
                  name: creator.name,
                  email: creator.email,
                }
              : null,
            team: team
              ? {
                  id: team.id,
                  name: team.name,
                  key: team.key,
                }
              : null,
            project: project
              ? {
                  id: project.id,
                  name: project.name,
                  state: project.state,
                }
              : null,
            parent: parent
              ? {
                  id: parent.id,
                  title: parent.title,
                  identifier: parent.identifier,
                }
              : null,
            cycle:
              cycle && cycle.name
                ? {
                    id: cycle.id,
                    name: cycle.name,
                    number: cycle.number,
                  }
                : null,
            labels: await Promise.all(
              labels.nodes.map(async (label: any) => ({
                id: label.id,
                name: label.name,
                color: label.color,
              }))
            ),
            comments: await Promise.all(
              comments.nodes.map(async (comment: any) => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt,
              }))
            ),
            attachments: await Promise.all(
              attachments.nodes.map(async (attachment: any) => ({
                id: attachment.id,
                title: attachment.title,
                url: attachment.url,
              }))
            ),
            embeddedImages: [],
            estimate: issue.estimate || null,
            customerTicketCount: issue.customerTicketCount || 0,
            previousIdentifiers: issue.previousIdentifiers || [],
            branchName: issue.branchName || "",
            archivedAt: issue.archivedAt || null,
            autoArchivedAt: issue.autoArchivedAt || null,
            autoClosedAt: issue.autoClosedAt || null,
            trashed: issue.trashed || false,
          };

          // Extract embedded images from description
          const imageMatches =
            issue.description?.match(/!\[.*?\]\((.*?)\)/g) || [];
          if (imageMatches.length > 0) {
            issueDetails.embeddedImages = imageMatches.map((match) => {
              const url = (match as string).match(/\((.*?)\)/)?.[1] || "";
              return {
                url,
                analysis: "Image analysis would go here", // Replace with actual image analysis if available
              };
            });
          }

          // Add image analysis for attachments if they are images
          issueDetails.attachments = await Promise.all(
            attachments.nodes
              .filter((attachment: any) =>
                attachment.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
              )
              .map(async (attachment: any) => ({
                id: attachment.id,
                title: attachment.title,
                url: attachment.url,
                analysis: "Image analysis would go here", // Replace with actual image analysis if available
              }))
          );

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(issueDetails, null, 2),
              },
            ],
          };
        } catch (error: any) {
          console.error("Error processing issue details:", error);
          throw new Error(`Failed to process issue details: ${error.message}`);
        }
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  } catch (error: any) {
    console.error("Linear API Error:", error);
    return {
      content: [
        {
          type: "text",
          text: `Linear API error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Linear MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
