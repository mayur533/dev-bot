import { v4 as uuidv4 } from 'uuid';
import { getGeminiClient } from '../services/gemini';
import { getDatabase } from '../database/db';
import { Message, Task, AgentResponse } from '../models/types';

/**
 * Backend Agent
 * Generates REST/GraphQL APIs, business logic, and database schemas
 */
export class BackendAgent {
  private gemini = getGeminiClient();
  private db = getDatabase();
  private agentName = 'backend';

  private getSystemPrompt(): string {
    return `You are an Expert Backend Developer specializing in Node.js, TypeScript, REST APIs, and Database Design.

Your expertise includes:
- Node.js with TypeScript and Express
- RESTful API design and implementation
- Database schema design (SQL and NoSQL)
- Authentication and authorization (JWT, OAuth)
- Data validation and error handling
- Business logic implementation
- API documentation
- Security best practices
- Performance optimization

When given a task:
1. Analyze requirements thoroughly
2. Design API endpoints and data models
3. Generate production-ready code
4. Follow REST/API best practices
5. Include proper error handling
6. Add input validation
7. Consider security implications
8. Optimize for scalability

Output Format (JSON):
{
  "analysis": "Your analysis of the requirements",
  "api_endpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "/api/resource",
      "description": "What this endpoint does",
      "request_body": "Expected request structure",
      "response": "Expected response structure"
    }
  ],
  "database_schema": {
    "tables": [
      {
        "name": "table_name",
        "columns": [
          {
            "name": "column_name",
            "type": "data_type",
            "constraints": "PRIMARY KEY, NOT NULL, etc."
          }
        ]
      }
    ]
  },
  "code_files": [
    {
      "filename": "file.ts",
      "code": "// Full implementation",
      "description": "What this file does"
    }
  ],
  "business_logic": "Description of key business rules implemented",
  "security_notes": "Important security considerations",
  "usage_example": "How to use the API"
}`;
  }

  async executeTask(task: Task): Promise<AgentResponse> {
    try {
      const messages: Message[] = [
        {
          id: uuidv4(),
          role: 'user',
          content: `Task: ${task.title}\n\nDescription: ${task.description}\n\nCreate the backend API, database schema, and business logic needed.`,
          timestamp: Date.now(),
        }
      ];

      const schema = {
        type: 'object',
        properties: {
          analysis: { type: 'string' },
          api_endpoints: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                method: { type: 'string' },
                path: { type: 'string' },
                description: { type: 'string' },
                request_body: { type: 'string' },
                response: { type: 'string' }
              }
            }
          },
          database_schema: {
            type: 'object',
            properties: {
              tables: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    columns: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          type: { type: 'string' },
                          constraints: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          code_files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' }
              }
            }
          },
          business_logic: { type: 'string' },
          security_notes: { type: 'string' },
          usage_example: { type: 'string' }
        },
        required: ['analysis', 'api_endpoints', 'code_files']
      };

      const result = await this.gemini.generateStructuredOutput(messages, schema, this.getSystemPrompt());

      // Update task with output
      this.db.updateTask(task.id, {
        status: 'completed',
        output: result,
        completedAt: Date.now(),
      });

      return {
        agent: this.agentName,
        content: result.analysis,
        code: result.code_files.map((f: any) => ({
          language: 'typescript',
          content: f.code,
          filename: f.filename,
        })),
        tokens: 0,
      };

    } catch (error: any) {
      console.error('Backend Agent error:', error);
      this.db.updateTask(task.id, {
        status: 'failed',
        error: error.message,
      });
      throw error;
    }
  }
}

export function getBackendAgent(): BackendAgent {
  return new BackendAgent();
}

export default BackendAgent;

