import express from "express";
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs

import { MessageData } from "genkit";
import {
  AgentCard,
  Task,
  TaskArtifactUpdateEvent,
  TaskState,
  TaskStatusUpdateEvent,
  TextPart,
  Message,
} from "@a2a-js/sdk";
import {
  InMemoryTaskStore,
  TaskStore,
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  DefaultRequestHandler,
} from "@a2a-js/sdk/server"; // Import server components
import { A2AExpressApp } from "@a2a-js/sdk/server/express";

import { ai } from "./genkit.js";

const orchestratorPrompt = ai.prompt("orchestrator_judge");


if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable not set.")
  process.exit(1);
}


class OrchestratorExecutor implements AgentExecutor{

    private cancelledTasks = new Set<string>();

    public cancelTask = async (
    taskId: string,
    eventBus: ExecutionEventBus,
  ): Promise<void> => {
    this.cancelledTasks.add(taskId);
  };


    public async execute( requestContext: RequestContext, eventBus: ExecutionEventBus){
        const userMessage = requestContext.userMessage;
        const existingTask = requestContext.task;

        const taskId = existingTask?.id || uuidv4();
        const contextId = userMessage.contextId || existingTask?.contextId || uuidv4();

        console.log(
        `[Orchestrator] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`
        );

    // 1. Publish initial Task event if it's a new task
    if (!existingTask) {
      const initialTask: Task = {
        kind: 'task',
        id: taskId,
        contextId: contextId,
        status: {
          state: 'submitted',
          timestamp: new Date().toISOString(),
        },
        history: [userMessage],
        metadata: userMessage.metadata,
        artifacts: [], // Initialize artifacts array
      };
      eventBus.publish(initialTask);
    }

    // 2. Publish "working" status update
    const workingStatusUpdate: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId: taskId,
      contextId: contextId,
      status: {
        state: 'working',
        message: {
          kind: 'message',
          role: 'agent',
          messageId: uuidv4(),
          parts: [{ kind: 'text', text: 'Evaluating...' }],
          taskId: taskId,
          contextId: contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    };
    eventBus.publish(workingStatusUpdate);

    // 3. Prepare messages for Genkit prompt
    const historyForGenkit = existingTask?.history ? [...existingTask.history] : [];
    if (!historyForGenkit.find(m => m.messageId === userMessage.messageId)) {
      historyForGenkit.push(userMessage);
    }

    const messages: MessageData[] = historyForGenkit
      .map((m) => ({
        role: (m.role === 'agent' ? 'model' : 'user') as 'user' | 'model',
        content: m.parts
          .filter((p): p is TextPart => p.kind === 'text' && !!(p as TextPart).text)
          .map((p) => ({
            text: (p as TextPart).text,
          })),
      }))
      .filter((m) => m.content.length > 0);

    if (messages.length === 0) {
      console.warn(
        `[Orchestrator] No valid text messages found in history for task ${taskId}.`
      );
      const failureUpdate: TaskStatusUpdateEvent = {
        kind: 'status-update',
        taskId: taskId,
        contextId: contextId,
        status: {
          state: 'failed',
          message: {
            kind: 'message',
            role: 'agent',
            messageId: uuidv4(),
            parts: [{ kind: 'text', text: 'No input message found to process.' }],
            taskId: taskId,
            contextId: contextId,
          },
          timestamp: new Date().toISOString(),
        },
        final: true,
      };
      eventBus.publish(failureUpdate);
      return;
    }

    try {
      // 4. Call Genkit AI model
      const response  = await orchestratorPrompt(
        {},
        {
          messages,
        }
      );

      if (this.cancelledTasks.has(taskId)) {
        console.log(
          `[OrchestratorExecutor] Request cancelled for task: ${taskId}`,
        );

        const cancelledUpdate: TaskStatusUpdateEvent = {
          kind: "status-update",
          taskId: taskId,
          contextId: contextId,
          status: {
            state: "canceled",
            timestamp: new Date().toISOString(),
          },
          final: true,
        };
        eventBus.publish(cancelledUpdate);
        return;
      }

      const responseText = response.text;
      console.info(
        `[OrchestratorExecutor] Prompt response: ${responseText}`,
      );

      const agentMessage: Message = {
        kind: "message",
        role: "agent",
        messageId: uuidv4(),
        parts: [{ kind: "text", text: responseText || "Completed." }],
        taskId: taskId,
        contextId: contextId,
      };

      const finalUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: taskId,
        contextId: contextId,
        status: {
          state: "completed",
          message: agentMessage,
          timestamp: new Date().toISOString(),
        },
        final: true,
      };
      eventBus.publish(finalUpdate);

      console.log(
        `[OrchestratorExecutor] Task ${taskId} finished with state: completed`,
      );

    } catch (error: unknown) {
      console.error(
        `[OrchestratorExecutor] Error processing task ${taskId}:`,
        error,
      );
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      const errorUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: taskId,
        contextId: contextId,
        status: {
          state: "failed",
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: "text", text: `Agent error: ${errorMessage}` }],
            taskId: taskId,
            contextId: contextId,
          },
          timestamp: new Date().toISOString(),
        },
        final: true,
      };
      eventBus.publish(errorUpdate);
    }
  }
    

}

// server setup

// --- Server Setup ---

const orchestratorJudgeAgentCard: AgentCard = {
  name: 'Orchestrator Judge Agent',
  description:
    'An agent that evaluates and judges the output of other agents based on predefined criteria.',
  url: 'http://localhost:41247/', // Adjusted port and base URL
  provider: {
    organization: 'A2A Samples',
    url: 'https://example.com/a2a-samples',
  },
  version: '0.0.2', // Incremented version
  capabilities: {
    streaming: true, // Agent streams artifact updates
    pushNotifications: false,
    stateTransitionHistory: true,
  },
  securitySchemes: undefined,
  security: undefined,
  defaultInputModes: ['text'],
  defaultOutputModes: ['text', 'file'], // 'file' implies artifacts
  skills: [
    {
      id: 'orchestrator_judge_skill',
      name: 'Orchestrator Judging',
      description:
        'Evaluates and judges the output of other agents based on predefined criteria.',
      tags: ['evaluation', 'judging', 'orchestration'],
      examples: [
        'Assess the quality of interview responses.',
        'Determine the most suitable agent for a given task.',
      ],
      inputModes: ['text'],
      outputModes: ['text'],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

async function main() {
  // 1. Create TaskStore
  const taskStore: TaskStore = new InMemoryTaskStore();

  // 2. Create AgentExecutor
  const agentExecutor: AgentExecutor = new OrchestratorExecutor();

  // 3. Create DefaultRequestHandler
  const requestHandler = new DefaultRequestHandler(
    orchestratorJudgeAgentCard,
    taskStore,
    agentExecutor
  );

  // 4. Create and setup A2AExpressApp
  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express(), '');

  // 5. Start the server
  const PORT = process.env.ORCHESTRATOR_JUDGE_AGENT_PORT || 41247; // Different port for orchestrator judge agent
  expressApp.listen(PORT, () => {
    console.log(`[OrchestratorJudgeAgent] Server using new framework started on http://localhost:${PORT}`);
    console.log(`[OrchestratorJudgeAgent] Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`);
    console.log('[OrchestratorJudgeAgent] Press Ctrl+C to stop the server');
  });
}

main().catch(console.error);


     
