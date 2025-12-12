import { A2AClient } from "@a2a-js/sdk/client";
import { MessageSendParams, Message } from "@a2a-js/sdk";
import { M } from "node_modules/@a2a-js/sdk/dist/types-DNKcmF0f";
import { logToFile } from "./ans";
import { log } from "console";

function generateId(): string { // Renamed for more general use
  return crypto.randomUUID();
}

export interface AgentInfo {
  title: string;
  url: string;  // agent card URL
}

interface JudgeResult {
  results: {
    agent: string;
    scores: {
      understanding: number;
      capability: number;
      approach: number;
      micro_demo: number;
      limitations: number;
    };
    weighted_score: number;
    evidence: string[];
    confidence: number;
  }[];
  ranking: string[];
  notes?: {
    rejected_agents?: string[];
    invalid_agent_responses?: string[];
  };
}

export class Orchestrator {
  private agents: AgentInfo[];

  constructor(agentUrls: AgentInfo[]) {
    this.agents = agentUrls;
  }

  /**
   * Load all agent cards by creating a client for each agent card URL
   */
  public async getAgentCards() {
    const cards = [];

    for (const agent of this.agents) {
      try {
        console.log(`Loading card for agent: ${agent.title} from ${agent.url}`);
        const client = new A2AClient(agent.url);
        const card = await client.getAgentCard();
        cards.push({ ...agent, card, client });
      } catch (err) {
        console.error(`Failed to load card for ${agent.title}:`, err);
      }
    }

    return cards;
  }

  /**
   * Ask a question to every agent via A2AClient
   */
  public async interviewAgents(query: string) {
    const results: {
      agent: string;
      answer: string;
    }[] = [];

    const loaded = await this.getAgentCards();

    for (const entry of loaded) {
      const { title, client, card } = entry;
      
      const messageId = generateId(); // Generate a unique message ID
    
      let interview = `
        You are being evaluated for your ability to perform the following task:

        "${query}"

        Below is your official AgentCard describing your true domain abilities.  
        You must base all parts of your answer ONLY on these capabilities.
        
        ${JSON.stringify(card, null, 2)}


        You must respond ONLY with valid JSON following the exact schema below.
        No extra text. No explanations. No markdown. Only JSON.

        Required JSON Schema:
        {
          "understanding": "1–2 sentences describing your interpretation of the task.",
          "capabilities": "List the concrete skills, tools, APIs, or models that directly apply to this task. Irrelevant capabilities will be scored 0.",
          "approach": "A specific, step-by-step actionable plan describing exactly how you would solve the task. Generic or boilerplate reasoning will be scored at most 2.",
          "micro_demo": "A short, self-contained demonstration showing the kind of output or reasoning you would produce for this task. Must be directly task-relevant, executable if code, or a worked example if reasoning. Generic or trivial examples = score 0. Max 4–6 lines.",
          "limitations": "Describe any weaknesses, uncertainties, or constraints. Include only task-relevant limitations."
        }

        Hard Rules:
        - All fields are required and must be quotable by the Orchestrator Judge.
        - Micro_demo must directly address the task. Generic or unrelated examples will get score 0.
        - Capabilities must be domain-relevant; unrelated skills result in capability = 0.
        - Avoid boilerplate, vague, or verbose reasoning. Only task-specific, actionable details are scored fully.
        - Do not exceed:
            - understanding: 2 sentences
            - capabilities: 4 sentences
            - approach: 5 sentences
            - micro_demo: 4–6 lines
            - limitations: 2–3 sentences
        - Do not repeat the task in long form.
        - Do not add extraneous text like “I will do my best.”
        - Remember: irrelevant or generic responses will be scored 0 by the Orchestrator Judge.
        `.trim();

    const messagePayload: Message = {
      messageId: messageId,
      kind: "message", // Required by Message interface
      role: "user",
      parts: [
        {
          kind: "text", // Required by TextPart interface
          text: interview,
        },
      ],
    };

    const params: MessageSendParams = {
      message: messagePayload,
    };

      try {
       
        let response = await withBackoff(() => client.sendMessage(params));

        let responseText = extractAgentResponse(response);



       

        results.push({
          agent: title,
          answer: responseText,
        });
      } catch (err) {
        console.error(`Error interviewing agent ${title}:`, err);
        await logToFile(`Error interviewing agent ${title}: ${err}, for query: ${query}`);
        await logToFile('Discarding all runs for query due to error.');
        return [];
      }
    }

    // console.log("Interview results:", results);
    await logToFile(`Interview results: ${JSON.stringify(results)}`);

    return results;
  }

  // /**
  //  * Choose the best agent using reasoning by another agent
  //  */
  public async pickBestAgent(query: string, judgeAgentUrl: string, top_k_agents:string[]) {
    // Construct params for sendMessageStream
    const messageId = generateId(); // Generate a unique message ID
    
    let interview = `
      You are being evaluated for your ability to perform the following task:

      "${query}"
      You must respond ONLY with valid JSON following the exact schema below.
      No extra text. No explanations. No markdown. Only JSON.

      Required JSON Schema:
      {
        "understanding": "1–2 sentences describing your interpretation of the task.",
        "capabilities": "List the concrete skills, tools, APIs, or models that directly apply to this task. Irrelevant capabilities will be scored 0.",
        "approach": "A specific, step-by-step actionable plan describing exactly how you would solve the task. Generic or boilerplate reasoning will be scored at most 2.",
        "micro_demo": "A short, self-contained demonstration showing the kind of output or reasoning you would produce for this task. Must be directly task-relevant, executable if code, or a worked example if reasoning. Generic or trivial examples = score 0. Max 4–6 lines.",
        "limitations": "Describe any weaknesses, uncertainties, or constraints. Include only task-relevant limitations."
      }

      Hard Rules:
      - All fields are required and must be quotable by the Orchestrator Judge.
      - Micro_demo must directly address the task. Generic or unrelated examples will get score 0.
      - Capabilities must be domain-relevant; unrelated skills result in capability = 0.
      - Avoid boilerplate, vague, or verbose reasoning. Only task-specific, actionable details are scored fully.
      - Do not exceed:
          - understanding: 2 sentences
          - capabilities: 4 sentences
          - approach: 5 sentences
          - micro_demo: 4–6 lines
          - limitations: 2–3 sentences
      - Do not repeat the task in long form.
      - Do not add extraneous text like “I will do my best.”
      - Remember: irrelevant or generic responses will be scored 0 by the Orchestrator Judge.
      `.trim();

    const messagePayload: Message = {
      messageId: messageId,
      kind: "message", // Required by Message interface
      role: "user",
      parts: [
        {
          kind: "text", // Required by TextPart interface
          text: interview,
        },
      ],
    };

    const interviews = await this.interviewAgents(query);

    const judge = await A2AClient.fromCardUrl(judgeAgentUrl);

    const prompt = `INPUT: \n
    task: "${query}\n
    prior_ranking: ${interviews.map((i, idx) => `${idx + 1}. ${i.agent}`).join("\n")}
    agent_responses (in JSON): ${interviews.map(i => `AGENT: ${i.agent}\nANSWER:\n${i.answer}`).join("\n\n")}
    \n\nEvaluate these responses based on the provided system prompt`;


    const judgeMessageId = generateId();
    const judgeMessagePayload: Message = {
        messageId: judgeMessageId,
        kind: "message",
        role: "user",
        parts: [
            {
                kind: "text",
                text: prompt,
            },
        ],
    };

    const judgeParams: MessageSendParams = {
        message: judgeMessagePayload,
    };

    // const judgeResponse = await judge.sendMessage(judgeParams);
    // const judgeResponse = await withBackoff(() => judge.sendMessage(judgeParams));

    // const judgeResult = extractJudgeJSON(judgeResponse);
    // if (!judgeResult) {
    //   console.error("Failed to extract valid JSON from judge response.");
    //   return [];
    // }

    const judgeResult = await retryUntilValidJSON<JudgeResult>(
      (overrideText?: string) => {
        let paramsToSend: MessageSendParams;

        if (overrideText) {
          // Must reconstruct the whole MessageSendParams exactly
          const firstPart = judgeParams.message.parts[0];
          const originalText = firstPart.kind === "text" ? firstPart.text : "";
          
          paramsToSend = {
            ...judgeParams, // includes conversationId, model, tools, etc.
            message: {
              ...judgeParams.message,
              parts: [
                {
                  kind: "text",
                  text: overrideText + originalText,
                },
              ],
            },
          };
        } else {
          // Normal first try
          paramsToSend = judgeParams;
        }

        return withBackoff(() => judge.sendMessage(paramsToSend));
      },
      extractJudgeJSON,
      3
    );

    const prior_bonus = top_k_agents.reduce((acc, agentName, idx) => {
      acc[agentName] = (top_k_agents.length - idx) * 0.1; // e.g., 0.5, 0.4, ...
      return acc;
    }, {} as Record<string, number>);

    const agent_hybrid_scores = judgeResult.results.map(agent => ({
      ...agent,
      hybrid_score: agent.weighted_score + (prior_bonus[agent.agent] || 0),
    }));

    const final_ranking = agent_hybrid_scores
      .sort((a, b) => b.hybrid_score - a.hybrid_score)
      .map(a => a.agent);


    // console.log("Judge result:", judgeResult);
    await logToFile(`Judge result: ${JSON.stringify(judgeResult)}`);

    const ranking = final_ranking;

    if (!ranking || ranking === undefined || ranking.length === 0) {
      // Handle case where ranking is undefined or empty
      console.error("Judge did not return a valid ranking.");
      return [];
    }


    const bestAgentName = ranking[0];
    console.log('Parsed best agents:', ranking);
    console.log(`Orchestrator selected agent: ${bestAgentName}`);

    return ranking;

}
}

function extractJudgeJSON(response: any): JudgeResult | null {
  try {
    // If response is a string (raw JSON), parse it
    let data: any;
    if (typeof response === "string") {
      data = JSON.parse(response);
    } else if (response?.result?.status?.message?.parts) {
      // Concatenate parts if coming from task-based response
      const rawText = response.result.status.message.parts
        .map((p: any) => p.text)
        .join("\n")
        .trim()
      
      const cleaned = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/, "")
      .trim();

      console.log("Cleaned judge response for JSON parsing:", cleaned);

      // 2. Try normal JSON.parse first
      try {
        data = JSON.parse(cleaned);
        return data;
      } catch (e) {
        console.warn("Normal parse failed, attempting post-processor…", e);
      }

      const maybeJSON = extractFirstJSONObject(cleaned);

      if (maybeJSON) {
        try {
          data = JSON.parse(maybeJSON);
          return data;
        } catch (e) {
          console.error("Extracted JSON still invalid:", e);
          return null;
        }
      }
       
    } else {
      // Already JSON
      data = response;
    }

    return data as JudgeResult;
  } catch (err) {
    console.error("Failed to parse judge response as JSON:", err);
    return null;
  }
}

// Extracts the first valid-looking {...} JSON block from a messy LLM output
function extractFirstJSONObject(text: string): string | null {
  // This regex finds the first {...} block, allowing nested braces
  const regex = /\{(?:[^{}]|(?:\{[^{}]*\}))*\}/g;
  const match = text.match(regex);
  if (!match || match.length === 0) return null;

  return match[0];
}


function extractAgentResponse(response: any): string {
  // Task-based response
  if (response?.result?.kind === 'task') {
    const msg = response.result.status?.message;
    if (msg?.parts && msg.parts.length > 0) {
      // Concatenate all text parts
      return msg.parts.map((p: any) => p.text).join("\n").trim();
    }
  }

  // Fallback to older formats
  if (typeof response.result === "string") {
    return response.result;
  }
  if (typeof response.message === "string") {
    return response.message;
  }

  // Last resort
  return JSON.stringify(response);
}

async function withBackoff<T>(
  fn: () => Promise<T>, 
  maxRetries = 8, 
  initialDelay = 500
): Promise<T> {
  let delay = initialDelay;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await fn();

      // If result is a string or object containing an API error, throw to trigger retry
      const text = typeof result === "string" ? result : JSON.stringify(result);
      if (/\[?(503|429)\s/.test(text)) {
        throw new Error(`Transient API error detected: ${text}`);
      }

      return result;
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      const msg = err?.message || "";

      if ([429, 503, 500].includes(status) || /\[?(503|429)\s/.test(msg)) {
        console.warn(`Retry ${i + 1}/${maxRetries} after error: ${msg || status}... waiting ${delay}ms`);
        if (i === maxRetries - 1) throw err;
        await new Promise((r) => setTimeout(r, delay + Math.random() * 200));
        delay *= 2;
      } else {
        throw err;
      }
    }
  }

  console.error("Exceeded maximum retries");
  throw new Error("Exceeded maximum retries");
}


async function retryUntilValidJSON<T>(
  sendMessage: (overrideText?: string) => Promise<any>,
  parseJSON: (response: any) => T | null,
  maxRetries = 3
): Promise<T> {

  let lastRaw: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {

    const prefix =
      attempt === 1
        ? undefined
        : `Your previous output was NOT valid JSON.\nReturn ONLY a JSON object.\nNo explanations, no markdown.\n\n`;

    try{
    const response = await sendMessage(prefix);
    lastRaw = response;

    const parsed = parseJSON(response);

    if (parsed) return parsed;
    throw new Error("Parsed JSON is null");
    } catch (err) {
      console.warn(`❌ parse or send failure (attempt ${attempt}/${maxRetries}):`, err);
    }

    console.warn(`❌ parse failed (attempt ${attempt}/${maxRetries})`);

    

    if (attempt === maxRetries) {
      throw new Error(
        `Failed to extract valid JSON after ${maxRetries} attempts.\nLast response:\n${JSON.stringify(
          lastRaw,
          null,
          2
        )}`
      );
    }

    await new Promise((r) => setTimeout(r, attempt * 300));
  }

  throw new Error("Unreachable");
}
