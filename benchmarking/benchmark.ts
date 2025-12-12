import { AgentNamingService } from "../src/ans";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { registerExampleAgents } from "./registerAgents";
import { registerRealAgents } from "./register_real_agents";
import { logToFile } from "../src/ans";
import { log } from "console";

const ans = new AgentNamingService();

interface BenchmarkEntry {
  id: string;
  text: string;
  correctAgentName: string;
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
async function evaluate_discovery(method: "BM25" | "semantic" | "hybrid" | "agentic") {
  let precisionCount = 0;
  let recallCount = 0;
  let totalLatency = 0;
  let count = 0;

  for (const { id, text, correctAgentName } of dataset) {
    const query = text;

    const start = performance.now();
    let results: string[] = [];
    // discoverAgents_BM25 should return a ranked list of agent names or cards
    console.log(`\n🔍 [${id}] Querying for: "${query}" using ${method} method`);
    await logToFile(`\n🔍 [${id}] Querying for: "${query}" using ${method} method`);
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
    else if (method === "agentic"){
      results = await ans.discoverAgentsOrchestrator(query, 5);
    }

    if (results.length > 0) {
      count++;
    }


    const latency = (performance.now() - start) / 1000; // seconds
    totalLatency += latency;

    if (!results || results.length === 0) {
      console.log(`⚠️ No results for "${query}"`);
      continue;
    }


    // Precision@1: correct top result
    if (results[0] === correctAgentName) {
      precisionCount++;
    } else {
      console.log(`Mismatch: query="${query}", expected="${correctAgentName}", got="${results[0]}"`);
      await logToFile(`Mismatch: query="${query}", expected="${correctAgentName}", got="${results[0]}"`);
    }

    // Recall@K: correct appears in top K
    if (results.slice(0, K).includes(correctAgentName)) {
      recallCount++;
    }
    else{
      console.log(`Recall@${K} Miss: query="${query}", expected="${correctAgentName}", got top-${K}="${results.slice(0, K).join(", ")}"`);
      await logToFile(`Recall@${K} Miss: query="${query}", expected="${correctAgentName}", got top-${K}="${results.slice(0, K).join(", ")}"`);
    }
  }

  const total = count;
  const precisionAt1 = (precisionCount / total) * 100;
  const recallAtK = (recallCount / total) * 100;
  const avgLatency = totalLatency / total;

  console.log("\n===== 📊 Benchmark Results for " + method + " =====");
  console.log(`Precision@1: ${precisionAt1.toFixed(2)}%`);
  console.log(`Recall@${K}: ${recallAtK.toFixed(2)}%`);
  console.log(`Average Latency: ${avgLatency.toFixed(3)} seconds`);
  console.log("=================================\n");

  await logToFile(`\n===== 📊 Benchmark Results for ${method} =====`) ;
  await logToFile(`Precision@1: ${precisionAt1.toFixed(2)}%`);
  await logToFile(`Recall@${K}: ${recallAtK.toFixed(2)}%`);
  await logToFile(`Average Latency: ${avgLatency.toFixed(3)} seconds`);
  await logToFile(`=================================\n`);

  return { precisionAt1, recallAtK, avgLatency  };
}

/**
 * Main benchmark runner
 */
async function runBenchmark(num_trials: number = 1) {

  console.log("🚀 Starting benchmark...");
  // await registerExampleAgents(ans);
  await registerRealAgents(ans);

  let bm_25_results_all_trials = [];
  let semantic_results_all_trials = [];
  let hybrid_results_all_trials = [];
  let agentic_results_all_trials = [];


  for (let i = 0; i < num_trials; i++) {
    console.log(`\n--- Trial ${i + 1} of ${num_trials} ---`);
    const bm_25_results = await evaluate_discovery("BM25");
    bm_25_results_all_trials.push(bm_25_results);
    const semantic_results = await evaluate_discovery("semantic");
    semantic_results_all_trials.push(semantic_results);
    const hybrid_results = await evaluate_discovery("hybrid");
    hybrid_results_all_trials.push(hybrid_results);
    const agentic_results = await evaluate_discovery("agentic");
    agentic_results_all_trials.push(agentic_results);
  }
  console.log("\n===== 📊 Aggregate Benchmark Results over " + num_trials + " trials =====")

  function aggregateResults(resultsArray: any[]) {
    const aggregate = { precisionAt1: 0, recallAtK: 0, avgLatency: 0 };
    for (const result of resultsArray) {
      aggregate.precisionAt1 += result.precisionAt1;
      aggregate.recallAtK += result.recallAtK;
      aggregate.avgLatency += result.avgLatency;
    }
    aggregate.precisionAt1 /= resultsArray.length;
    aggregate.recallAtK /= resultsArray.length;
    aggregate.avgLatency /= resultsArray.length;
    return aggregate;
  }
  const bm25_aggregate = aggregateResults(bm_25_results_all_trials);
  console.log("BM25 Aggregate Results:", bm25_aggregate); 
  await logToFile(`BM25 Aggregate Results: ${JSON.stringify(bm25_aggregate)}`);
  const semantic_aggregate = aggregateResults(semantic_results_all_trials);
  console.log("Semantic Aggregate Results:", semantic_aggregate);
  await logToFile(`Semantic Aggregate Results: ${JSON.stringify(semantic_aggregate)}`);
  const hybrid_aggregate = aggregateResults(hybrid_results_all_trials);
  console.log("Hybrid Aggregate Results:", hybrid_aggregate);
  await logToFile(`Hybrid Aggregate Results: ${JSON.stringify(hybrid_aggregate)}`);
  const agentic_aggregate = aggregateResults(agentic_results_all_trials);
  console.log("Agentic Aggregate Results:", agentic_aggregate);
  await logToFile(`Agentic Aggregate Results: ${JSON.stringify(agentic_aggregate)}`);

  
  process.exit(0);
}

// Run the benchmark
runBenchmark().catch((err) => {
  console.error("Error during benchmarking:", err);
});

//testing benchmark

// async function test() {
//   console.log("🚀 Starting benchmark with real agents...")
//   await registerRealAgents(ans);
//   let query = "Generate and summarize code snippets using GPT-4.";
//   console.log("Orchestrator Discovery Evaluation:");
//   const result = await ans.discoverAgentsOrchestrator(query);
//   console.log(`Best agent for query "${query}": ${result}`);
//   process.exit(0);
// }

// test().catch((err) => {
//   console.error("Error during benchmarking:", err);
// });

