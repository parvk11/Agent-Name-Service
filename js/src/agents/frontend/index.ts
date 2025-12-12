import express from "express";
import { v4 as uuidv4 } from "uuid";

import {
  AgentCard,
  Task,
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
} from "@a2a-js/sdk/server";
import { A2AExpressApp } from "@a2a-js/sdk/server/express";
import { MessageData } from "genkit";
import { ai } from "./genkit.js";

import * as dotenv from "dotenv";
dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set.");
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const frontendUxRefinerPrompt = ai.prompt("frontend_ux_refiner");

class FrontendUxRefinerAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();

  public cancelTask = async (
    taskId: string,
    eventBus: ExecutionEventBus,
  ): Promise<void> => {
    this.cancelledTasks.add(taskId);
  };

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;

    const taskId = existingTask?.id || uuidv4();
    const contextId =
      userMessage.contextId || existingTask?.contextId || uuidv4();

    console.log(
      `[FrontendUxRefinerAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`,
    );

    if (!existingTask) {
      const initialTask: Task = {
        kind: "task",
        id: taskId,
        contextId: contextId,
        status: {
          state: "submitted",
          timestamp: new Date().toISOString(),
        },
        history: [userMessage],
        metadata: userMessage.metadata,
      };
      eventBus.publish(initialTask);
    }

    const workingStatusUpdate: TaskStatusUpdateEvent = {
      kind: "status-update",
      taskId: taskId,
      contextId: contextId,
      status: {
        state: "working",
        message: {
          kind: "message",
          role: "agent",
          messageId: uuidv4(),
          parts: [{ kind: "text", text: "Refining frontend code..." }],
          taskId: taskId,
          contextId: contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    };
    eventBus.publish(workingStatusUpdate);

    const historyForGenkit = existingTask?.history
      ? [...existingTask.history]
      : [];
    if (!historyForGenkit.find((m) => m.messageId === userMessage.messageId)) {
      historyForGenkit.push(userMessage);
    }

    const messages: MessageData[] = historyForGenkit
      .map((m) => ({
        role: (m.role === "agent" ? "model" : "user") as "user" | "model",
        content: m.parts
          .filter(
            (p): p is TextPart => p.kind === "text" && !!(p as TextPart).text,
          )
          .map((p) => ({
            text: (p as TextPart).text,
          })),
      }))
      .filter((m) => m.content.length > 0);

    if (messages.length === 0) {
      console.warn(
        `[FrontendUxRefinerAgentExecutor] No valid text messages found in history for task ${taskId}.`,
      );
      const failureUpdate: TaskStatusUpdateEvent = {
        kind: "status-update",
        taskId: taskId,
        contextId: contextId,
        status: {
          state: "failed",
          message: {
            kind: "message",
            role: "agent",
            messageId: uuidv4(),
            parts: [{ kind: "text", text: "No message found to process." }],
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
      const response = await frontendUxRefinerPrompt(
        {},
        {
          messages,
        },
      );

      if (this.cancelledTasks.has(taskId)) {
        console.log(
          `[FrontendUxRefinerAgentExecutor] Request cancelled for task: ${taskId}`,
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
        `[FrontendUxRefinerAgentExecutor] Prompt response: ${responseText}`,
      );

      const agentMessage: Message = {
        kind: "message",
        role: "agent",
        messageId: uuidv4(),
        parts: [{ kind: "text", text: responseText || "Refactoring completed." }],
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
        `[FrontendUxRefinerAgentExecutor] Task ${taskId} finished with state: completed`,
      );
    } catch (error: unknown) {
      console.error(
        `[FrontendUxRefinerAgentExecutor] Error processing task ${taskId}:`,
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

const frontendUxRefinerAgentCard: AgentCard = {
  name: "Frontend UX Refiner (JS)",
  description: "Agent focused on frontend code quality, accessibility, and UI/UX improvements.",
  url: "http://localhost:12004/",
  provider: {
    organization: "A2A Samples",
    url: "https://example.com/a2a-samples",
  },
  version: "1.0.0",
  capabilities: {
    streaming: true,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  securitySchemes: undefined,
  security: undefined,
  defaultInputModes: ["text"],
  defaultOutputModes: ["text"],
  skills: [
    {
      id: "react-component-refactoring",
      name: "React component refactoring",
      description: "Refactor React components for readability, performance, and maintainability",
      tags: ["frontend", "react", "refactoring"],
      examples: [
        "Refactor this giant React component into smaller pieces",
        "Help me avoid unnecessary re-renders in this React list",
      ],
      inputModes: ["text"],
      outputModes: ["text"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

async function main() {
  const taskStore: TaskStore = new InMemoryTaskStore();
  const agentExecutor: AgentExecutor = new FrontendUxRefinerAgentExecutor();
  const requestHandler = new DefaultRequestHandler(
    frontendUxRefinerAgentCard,
    taskStore,
    agentExecutor,
  );

  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express() as any);

  const PORT = process.env.FRONTEND_UX_REFINER_AGENT_PORT || 12004;
  expressApp.listen(PORT, () => {
    console.log(
      `[FrontendUxRefinerAgent] Server using new framework started on http://localhost:${PORT}`,
    );
    console.log(
      `[FrontendUxRefinerAgent] Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`,
    );
    console.log("[FrontendUxRefinerAgent] Press Ctrl+C to stop the server");
  });
}

main().catch(console.error);