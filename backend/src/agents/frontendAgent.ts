import { v4 as uuidv4 } from 'uuid';
import { getGeminiClient } from '../services/gemini';
import { get Database } from '../database/db';
import { Message, Task, AgentResponse } from '../models/types';

/**
 * Frontend Agent
 * Generates React UI components, responsive designs, and frontend code
 */
export class FrontendAgent {
  private gemini = getGeminiClient();
  private db = getDatabase();
  private agentName = 'frontend';

  private getSystemPrompt(): string {
    return `You are an Expert Frontend Developer specializing in React, TypeScript, and Modern UI/UX.

Your expertise includes:
- React 18+ with TypeScript
- Responsive design with CSS/Tailwind
- Component architecture and state management
- React Hooks and custom hooks
- Modern UI patterns and accessibility
- Performance optimization
- Integration with REST APIs

When given a task:
1. Analyze requirements thoroughly
2. Design component structure
3. Generate clean, production-ready code
4. Follow React best practices
5. Include proper TypeScript types
6. Add comments for complex logic
7. Ensure responsive design
8. Consider accessibility (ARIA labels, semantic HTML)

Output Format (JSON):
{
  "analysis": "Your analysis of the requirements",
  "components": [
    {
      "name": "ComponentName",
      "filename": "ComponentName.tsx",
      "code": "// Full component code",
      "description": "What this component does",
      "props": "TypeScript interface for props"
    }
  ],
  "styles": [
    {
      "filename": "styles.css",
      "code": "/* CSS code */"
    }
  ],
  "usage_example": "How to use the components",
  "notes": "Important implementation notes"
}`;
  }

  async executeTask(task: Task): Promise<AgentResponse> {
    try {
      const messages: Message[] = [
        {
          id: uuidv4(),
          role: 'user',
          content: `Task: ${task.title}\n\nDescription: ${task.description}\n\nCreate the React components and code needed.`,
          timestamp: Date.now(),
        }
      ];

      const schema = {
        type: 'object',
        properties: {
          analysis: { type: 'string' },
          components: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                filename: { type: 'string' },
                code: { type: 'string' },
                description: { type: 'string' },
                props: { type: 'string' }
              }
            }
          },
          styles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                code: { type: 'string' }
              }
            }
          },
          usage_example: { type: 'string' },
          notes: { type: 'string' }
        },
        required: ['analysis', 'components']
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
        code: result.components.map((c: any) => ({
          language: 'typescript',
          content: c.code,
          filename: c.filename,
        })),
        tokens: 0,
      };

    } catch (error: any) {
      console.error('Frontend Agent error:', error);
      this.db.updateTask(task.id, {
        status: 'failed',
        error: error.message,
      });
      throw error;
    }
  }
}

export function getFrontendAgent(): FrontendAgent {
  return new FrontendAgent();
}

export default FrontendAgent;

