import { AgentNamingService } from "../src/ans";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { registerExampleAgents } from "./registerAgents";

const ans = new AgentNamingService();

interface BenchmarkEntry {
  query: string;
  expectedAnswer: string;
}

const dataset: BenchmarkEntry[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "dataset.json"), "utf-8")
);

// Top-K recall cutoff
const K = 3;

/**
 * Utility to extract the agent name from the "Agent Card for ..." string.
 */
function extractAgentName(agentCardString: string): string {
  const match = agentCardString.match(/^Agent Card for ([^:]+):/);
  return match ? match[1] : "";
}

/**
 * Registers example agents (same as your current implementation)
 */
// async function registerExampleAgents(ans: AgentNamingService) {
//   await ans.registerAgent("content-creator-agent", {
//     version: "1.0.0",
//     capabilities: ["text-generation", "summarization", "translation"],
//     description: "AI agent that creates and transforms content",
//     provider: "OpenAI",
//     model: "gpt-4",
//     endpoints: [{ protocol: "https", address: "api.contentcreator.ai", port: 443 }],
//   });

//   await ans.registerAgent("data-processor-agent", {
//     version: "2.1.0",
//     capabilities: ["data-extraction", "data-transformation", "analysis"],
//     description: "Processes and analyzes structured and unstructured data",
//     provider: "DataCorp",
//     model: "data-processor-v2",
//     endpoints: [{ protocol: "https", address: "api.datacorp.com", port: 443 }],
//     rateLimit: { requestsPerMinute: 60, burstLimit: 10 },
//   });

//   await ans.registerAgent("security-admin-agent", {
//     version: "1.0.0",
//     capabilities: ["system-monitoring", "threat-detection", "exploit-research"],
//     description: "Monitors systems for security threats and vulnerabilities",
//     provider: "SecureDefense",
//     model: "security-defender-v1",
//     endpoints: [{ protocol: "https", address: "api.securedefense.com", port: 443 }],
//     permissions: ["file-system-access", "network-monitoring", "execute-scripts"],
//   });

//   console.log("✅ Example agents registered successfully.");
// }

/**
 * Evaluate discovery
 */
async function evaluate_discovery(method: "BM25" | "semantic" | "hybrid") {
  let precisionCount = 0;
  let recallCount = 0;
  let totalLatency = 0;

  for (const { query, expectedAnswer } of dataset) {
    const start = performance.now();
    let results: string[] = [];
    // discoverAgents_BM25 should return a ranked list of agent names or cards
    
    if (method === "BM25") 
    {
      results = await ans.discoverAgents_BM25(query);
    } 
    else if (method === "semantic") 
    {
      results = await ans.discoverAgents_semantic(query);
    }
    else if (method === "hybrid"){
      results = await ans.hybrid_discoverAgents(query);
    }
    

    const latency = (performance.now() - start) / 1000; // seconds
    totalLatency += latency;

    if (!results || results.length === 0) {
      console.log(`⚠️ No results for "${query}"`);
      continue;
    }


    // Precision@1: correct top result
    if (results[0] === expectedAnswer) {
      precisionCount++;
    } else {
      console.log(`Mismatch: query="${query}", expected="${expectedAnswer}", got="${results[0]}"`);
    }

    // Recall@K: correct appears in top K
    if (results.slice(0, K).includes(expectedAnswer)) {
      recallCount++;
    }
  }

  const total = dataset.length;
  const precisionAt1 = (precisionCount / total) * 100;
  const recallAtK = (recallCount / total) * 100;
  const avgLatency = totalLatency / total;

  console.log("\n===== 📊 Benchmark Results for " + method + " =====");
  console.log(`Precision@1: ${precisionAt1.toFixed(2)}%`);
  console.log(`Recall@${K}: ${recallAtK.toFixed(2)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(3)} seconds`);
  console.log("=================================\n");
}

/**
 * Main benchmark runner
 */
async function runBenchmark() {
  console.log("🚀 Starting benchmark...");
  await registerExampleAgents(ans);
  
  console.log("BM25 Discovery Evaluation:");
  await evaluate_discovery("BM25");
  console.log("Semantic Discovery Evaluation:");
  await evaluate_discovery("semantic");
  console.log("Hybrid Discovery Evaluation:");
  await evaluate_discovery("hybrid");
  process.exit(0);
}

// Run the benchmark
runBenchmark().catch((err) => {
  console.error("Error during benchmarking:", err);
});

