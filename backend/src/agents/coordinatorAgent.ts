import { v4 as uuidv4 } from 'uuid';
import { getGeminiClient } from '../services/gemini';
import { getDatabase } from '../database/db';
import { Message, Task, ProjectBrief, AgentResponse } from '../models/types';

/**
 * Coordinator Agent
 * Breaks down project briefs into concrete technical tasks and assigns them to specialized agents
 */
export class CoordinatorAgent {
  private gemini = getGeminiClient();
  private db = getDatabase();
  private agentName = 'coordinator';

  /**
   * System prompt for the coordinator
   */
  private getSystemPrompt(): string {
    return `You are a Senior Technical Project Manager and Solution Architect AI Agent.

Your role is to:
1. Analyze project briefs and requirements
2. Break them down into well-defined, actionable technical tasks
3. Assign tasks to the appropriate specialized agent (Frontend or Backend)
4. Ensure tasks are detailed enough for agents to implement independently
5. Consider technical dependencies and logical order of implementation

When analyzing a project brief, you should:
- Identify all required features and functionality
- Determine the technical stack and architecture
- Break down into granular, implementable tasks
- Assign each task to Frontend Agent, Backend Agent, or mark as coordination task
- Specify clear acceptance criteria for each task
- Consider scalability, security, and best practices

Output Format (JSON):
{
  "analysis": "Your detailed analysis of the project",
  "architecture": {
    "frontend": ["tech stack items"],
    "backend": ["tech stack items"],
    "database": ["database choices"]
  },
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed task description",
      "type": "frontend|backend|fullstack",
      "assigned_agent": "frontend|backend",
      "priority": "high|medium|low",
      "dependencies": ["task_id"],
      "acceptance_criteria": ["criterion 1", "criterion 2"]
    }
  ],
  "implementation_order": ["task_id"],
  "estimated_complexity": "low|medium|high"
}

Be thorough, professional, and ensure all tasks are actionable.`;
  }

  /**
   * Analyze project brief and create tasks
   */
  async analyzeProject(
    projectBrief: string | ProjectBrief,
    sessionId: string,
    projectId?: string
  ): Promise<{
    analysis: string;
    tasks: Task[];
    architecture: any;
  }> {
    try {
      // Convert brief to string if needed
      const briefString = typeof projectBrief === 'string' 
        ? projectBrief 
        : this.projectBriefToString(projectBrief);

      // Create message for analysis
      const messages: Message[] = [
        {
          id: uuidv4(),
          role: 'user',
          content: `Analyze this project and break it down into tasks:\n\n${briefString}`,
          timestamp: Date.now(),
        }
      ];

      // Define JSON schema for structured output
      const schema = {
        type: 'object',
        properties: {
          analysis: { type: 'string' },
          architecture: {
            type: 'object',
            properties: {
              frontend: { type: 'array', items: { type: 'string' } },
              backend: { type: 'array', items: { type: 'string' } },
              database: { type: 'array', items: { type: 'string' } }
            }
          },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                type: { type: 'string', enum: ['frontend', 'backend', 'fullstack'] },
                assigned_agent: { type: 'string', enum: ['frontend', 'backend'] },
                priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                dependencies: { type: 'array', items: { type: 'string' } },
                acceptance_criteria: { type: 'array', items: { type: 'string' } }
              },
              required: ['title', 'description', 'type', 'assigned_agent']
            }
          },
          implementation_order: { type: 'array', items: { type: 'string' } },
          estimated_complexity: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['analysis', 'tasks']
      };

      // Generate structured response
      const result = await this.gemini.generateStructuredOutput(
        messages,
        schema,
        this.getSystemPrompt()
      );

      // Create Task objects from the response
      const tasks: Task[] = result.tasks.map((taskData: any, index: number) => ({
        id: `task-${index + 1}`,
        projectId,
        sessionId,
        title: taskData.title,
        description: taskData.description,
        type: taskData.type,
        status: 'pending',
        assignedAgent: taskData.assigned_agent,
        input: {
          priority: taskData.priority || 'medium',
          dependencies: taskData.dependencies || [],
          acceptanceCriteria: taskData.acceptance_criteria || []
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      // Save tasks to database
      for (const task of tasks) {
        this.db.createTask(task);
      }

      return {
        analysis: result.analysis,
        tasks,
        architecture: result.architecture || {},
      };

    } catch (error: any) {
      console.error('Error in CoordinatorAgent.analyzeProject:', error);
      throw new Error(`Failed to analyze project: ${error.message}`);
    }
  }

  /**
   * Review and validate task output from specialized agents
   */
  async reviewTaskOutput(
    taskId: string,
    output: any
  ): Promise<{
    approved: boolean;
    feedback?: string;
    improvements?: string[];
  }> {
    try {
      const task = this.db.getTask(taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const messages: Message[] = [
        {
          id: uuidv4(),
          role: 'user',
          content: `Review this task output:\n\nTask: ${task.title}\nDescription: ${task.description}\n\nOutput:\n${JSON.stringify(output, null, 2)}\n\nProvide feedback on quality, completeness, and any improvements needed.`,
          timestamp: Date.now(),
        }
      ];

      const reviewPrompt = `You are a Senior Code Reviewer. Review the task output for:
1. Completeness - Does it fulfill all requirements?
2. Quality - Is the code/design high quality?
3. Best Practices - Does it follow industry standards?
4. Security - Are there any security concerns?
5. Scalability - Will it scale appropriately?

Provide approval status and constructive feedback.`;

      const response = await this.gemini.generateResponse(
        messages,
        reviewPrompt,
        { temperature: 0.3 }
      );

      // Parse response (simplified - could use structured output)
      const approved = response.content.toLowerCase().includes('approved') || 
                      response.content.toLowerCase().includes('looks good');

      return {
        approved,
        feedback: response.content,
      };

    } catch (error: any) {
      console.error('Error reviewing task output:', error);
      throw new Error(`Failed to review task: ${error.message}`);
    }
  }

  /**
   * Generate project summary
   */
  async generateProjectSummary(projectId: string): Promise<string> {
    try {
      const project = this.db.getProject(projectId);
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const sessions = project.sessions.map(sid => this.db.getSession(sid)).filter(Boolean);
      const allMessages = sessions.flatMap(s => s?.messages || []);

      const summaryPrompt = `Generate a comprehensive project summary including:
1. Project overview and goals
2. Technical architecture and stack
3. Key features implemented
4. Current status and progress
5. Next steps and recommendations

Project: ${project.name}
Description: ${project.description || 'N/A'}`;

      const messages: Message[] = [
        {
          id: uuidv4(),
          role: 'user',
          content: summaryPrompt,
          timestamp: Date.now(),
        }
      ];

      const response = await this.gemini.generateResponse(
        messages,
        'You are a Technical Documentation Specialist.',
        { temperature: 0.3 }
      );

      return response.content;

    } catch (error: any) {
      console.error('Error generating project summary:', error);
      throw new Error(`Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Convert ProjectBrief object to string
   */
  private projectBriefToString(brief: ProjectBrief): string {
    let str = brief.description;
    
    if (brief.requirements && brief.requirements.length > 0) {
      str += '\n\nRequirements:\n' + brief.requirements.map(r => `- ${r}`).join('\n');
    }
    
    if (brief.features && brief.features.length > 0) {
      str += '\n\nFeatures:\n' + brief.features.map(f => `- ${f}`).join('\n');
    }
    
    if (brief.tech_stack) {
      str += '\n\nTech Stack:';
      if (brief.tech_stack.frontend) {
        str += '\nFrontend: ' + brief.tech_stack.frontend.join(', ');
      }
      if (brief.tech_stack.backend) {
        str += '\nBackend: ' + brief.tech_stack.backend.join(', ');
      }
      if (brief.tech_stack.database) {
        str += '\nDatabase: ' + brief.tech_stack.database.join(', ');
      }
    }
    
    return str;
  }
}

// Singleton instance
let coordinatorInstance: CoordinatorAgent | null = null;

export function getCoordinatorAgent(): CoordinatorAgent {
  if (!coordinatorInstance) {
    coordinatorInstance = new CoordinatorAgent();
  }
  return coordinatorInstance;
}

export default CoordinatorAgent;

