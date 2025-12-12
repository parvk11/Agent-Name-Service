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

const secureCodeAuditorPrompt = ai.prompt("secure_code_auditor");

class SecureCodeAuditorAgentExecutor implements AgentExecutor {
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
      `[SecureCodeAuditorAgentExecutor] Processing message ${userMessage.messageId} for task ${taskId} (context: ${contextId})`,
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
          parts: [{ kind: "text", text: "Auditing code security..." }],
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
        `[SecureCodeAuditorAgentExecutor] No valid text messages found in history for task ${taskId}.`,
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
      const response = await secureCodeAuditorPrompt(
        {},
        {
          messages,
        },
      );

      if (this.cancelledTasks.has(taskId)) {
        console.log(
          `[SecureCodeAuditorAgentExecutor] Request cancelled for task: ${taskId}`,
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
        `[SecureCodeAuditorAgentExecutor] Prompt response: ${responseText}`,
      );

      const agentMessage: Message = {
        kind: "message",
        role: "agent",
        messageId: uuidv4(),
        parts: [{ kind: "text", text: responseText || "Security audit completed." }],
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
        `[SecureCodeAuditorAgentExecutor] Task ${taskId} finished with state: completed`,
      );
    } catch (error: unknown) {
      console.error(
        `[SecureCodeAuditorAgentExecutor] Error processing task ${taskId}:`,
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

const secureCodeAuditorAgentCard: AgentCard = {
  name: "Secure Code Auditor (JS)",
  description: "Agent oriented around secure coding practices, threat modeling, and vulnerability detection.",
  url: "http://localhost:12006/",
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
      id: "vulnerability-review",
      name: "Vulnerability review",
      description: "Review code snippets for common vulnerabilities like SQL injection, XSS, CSRF, SSRF",
      tags: ["security", "vulnerabilities", "owasp"],
      examples: [
        "Is this login endpoint vulnerable to SQL injection?",
        "Find any XSS risks in this React component",
      ],
      inputModes: ["text"],
      outputModes: ["text"],
    },
  ],
  supportsAuthenticatedExtendedCard: false,
};

async function main() {
  const taskStore: TaskStore = new InMemoryTaskStore();
  const agentExecutor: AgentExecutor = new SecureCodeAuditorAgentExecutor();
  const requestHandler = new DefaultRequestHandler(
    secureCodeAuditorAgentCard,
    taskStore,
    agentExecutor,
  );

  const appBuilder = new A2AExpressApp(requestHandler);
  const expressApp = appBuilder.setupRoutes(express() as any);

  const PORT = process.env.SECURE_CODE_AUDITOR_AGENT_PORT || 12006;
  expressApp.listen(PORT, () => {
    console.log(
      `[SecureCodeAuditorAgent] Server using new framework started on http://localhost:${PORT}`,
    );
    console.log(
      `[SecureCodeAuditorAgent] Agent Card: http://localhost:${PORT}/.well-known/agent-card.json`,
    );
    console.log("[SecureCodeAuditorAgent] Press Ctrl+C to stop the server");
  });
}

main().catch(console.error);