// import { AgentNamingService } from "../src/ans.js";

// export async function registerRealAgents(ans: AgentNamingService) {
  
//   // New Software Engineering Agents
//   await ans.registerAgent("code-debugging-assistant", {
//     version: "1.0.0",
//     capabilities: ["debugging", "multi-language-support", "runtime-error-analysis", "logic-bug-detection", "performance-profiling-support"],
//     description: "Specialized agent for debugging software issues, stack traces, and runtime errors across multiple languages",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12001 }],
//   });

//   await ans.registerAgent("api-design-advisor", {
//     version: "1.0.0",
//     capabilities: ["api-design", "rest", "graphql", "grpc", "pagination", "error-handling"],
//     description: "Agent focused on REST, GraphQL, and gRPC API design, including versioning, pagination, and best practices",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12002 }],
//   });

//   await ans.registerAgent("backend-database-optimizer", {
//     version: "1.0.0",
//     capabilities: ["database-optimization", "schema-design", "sql-explains", "caching", "backend-performance"],
//     description: "Agent specialized in backend performance, database schema tuning, and query optimization",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12003 }],
//   });

//   await ans.registerAgent("frontend-ux-refiner", {
//     version: "1.0.0",
//     capabilities: ["frontend", "react", "accessibility", "ui-ux-review", "performance-tuning"],
//     description: "Agent focused on frontend code quality, accessibility, and UI/UX improvements",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12004 }],
//   });

//   await ans.registerAgent("devops-ci-cd-orchestrator", {
//     version: "1.0.0",
//     capabilities: ["ci-cd", "devops", "deployment", "kubernetes-concepts", "infrastructure-as-code"],
//     description: "Agent that helps design, debug, and optimize CI/CD pipelines and DevOps workflows",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12005 }],
//   });

//   await ans.registerAgent("secure-code-auditor", {
//     version: "1.0.0",
//     capabilities: ["security-review", "threat-modeling", "secure-coding", "vulnerability-detection"],
//     description: "Agent oriented around secure coding practices, threat modeling, and vulnerability detection",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12006 }],
//   });

//   await ans.registerAgent("test-automation-engineer", {
//     version: "1.0.0",
//     capabilities: ["testing", "unit-tests", "integration-tests", "e2e-tests", "test-strategy"],
//     description: "Agent focused on unit/integration testing, test strategy, and automation frameworks",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12007 }],
//   });

//   await ans.registerAgent("software-architecture-consultant", {
//     version: "1.0.0",
//     capabilities: ["system-design", "architecture", "scalability", "reliability", "tradeoff-analysis"],
//     description: "Agent for high-level software architecture decisions, design tradeoffs, and system diagrams",
//     provider: "A2A Samples",
//     model: "gemini",
//     endpoints: [{ protocol: "http", address: "localhost", port: 12008 }],
//   });

//   console.log("✅ All agents registered successfully!");
// }

import { AgentNamingService } from "../src/ans.js";

export async function registerRealAgents(ans: AgentNamingService) {

  // New Software Engineering Agents
  await ans.registerAgent("code-debugging-assistant", {
    version: "1.0.0",
    capabilities: ["debugging", "multi-language-support", "runtime-error-analysis", "logic-bug-detection", "performance-profiling-support", "stack-trace-interpretation"],
    description: "Automates debugging of runtime errors, stack traces, and logic bugs across multiple programming languages including JavaScript, Python, Java, and C++",
    provider: "A2A Samples",
    model: "gemini",
    endpoints: [{ protocol: "http", address: "localhost", port: 12001 }],
  });

  await ans.registerAgent("api-design-advisor", {
    version: "1.0.0",
    capabilities: ["api-design", "rest", "graphql", "grpc", "pagination", "error-handling", "versioning", "endpoint-modeling"],
    description: "Analyzes and advises on REST, GraphQL, and gRPC API design, including versioning, endpoint modeling, pagination, and error-handling best practices",
    provider: "A2A Samples",
    model: "gemini",
    endpoints: [{ protocol: "http", address: "localhost", port: 12002 }],
  });

 await ans.registerAgent("performance-diagnostics-engineer", {
  version: "1.0.0",
  capabilities: [
    "bottleneck-analysis",
    "latency-profiling",
    "throughput-diagnostics",
    "resource-utilization",
    "backend-performance",
    "query-tuning",
    "system-observability"
  ],
  description:
    "Acts as a performance diagnostics engineer specializing in identifying bottlenecks, analyzing latency and throughput issues, profiling database and backend systems, and recommending targeted optimizations for reliability and scalability.",
  provider: "A2A Samples",
  model: "gemini",
  endpoints: [{ protocol: "http", address: "localhost", port: 12003 }],
});

  await ans.registerAgent("frontend-ux-refiner", {
    version: "1.0.0",
    capabilities: ["frontend", "react", "accessibility", "ui-ux-review", "performance-tuning", "react-testing-library", "cypress", "a11y", "ui-debugging"],
    description: "Analyzes and improves frontend code quality, React performance, accessibility, and UI/UX, including automated testing with React Testing Library and Cypress",
    provider: "A2A Samples",
    model: "gemini",
    endpoints: [{ protocol: "http", address: "localhost", port: 12004 }],
  });

  await ans.registerAgent("devops-ci-cd-orchestrator", {
    version: "1.0.0",
    capabilities: ["ci-cd", "devops", "deployment", "kubernetes-concepts", "infrastructure-as-code", "github-actions", "jenkins", "terraform", "pipeline-debugging"],
    description: "Designs, debugs, and optimizes CI/CD pipelines and DevOps workflows, including GitHub Actions, Jenkins, Terraform, and Kubernetes deployments",
    provider: "A2A Samples",
    model: "gemini",
    endpoints: [{ protocol: "http", address: "localhost", port: 12005 }],
  });

  await ans.registerAgent("secure-code-auditor", {
    version: "1.0.0",
    capabilities: ["security-review", "threat-modeling", "secure-coding", "vulnerability-detection", "static-analysis", "dependency-audit"],
    description: "Reviews code for security vulnerabilities, performs threat modeling, enforces secure coding practices, and audits dependencies for risks",
    provider: "A2A Samples",
    model: "gemini",
    endpoints: [{ protocol: "http", address: "localhost", port: 12006 }],
  });

  await ans.registerAgent("test-automation-engineer", {
    version: "1.0.0",
    capabilities: ["testing", "unit-tests", "integration-tests", "e2e-tests", "test-strategy", "jest", "cypress", "selenium", "async-component-testing"],
    description: "Automates unit, integration, and E2E testing for web applications, including React, Node.js, and asynchronous UI components, with frameworks like Jest, Cypress, and Selenium",
    provider: "A2A Samples",
    model: "gemini",
    endpoints: [{ protocol: "http", address: "localhost", port: 12007 }],
  });

  await ans.registerAgent("software-architecture-consultant", {
    version: "1.0.0",
    capabilities: ["system-design", "architecture", "scalability", "reliability", "tradeoff-analysis", "microservices", "cloud-architecture"],
    description: "Advises on high-level software architecture, system design tradeoffs, scalability, reliability, and cloud or microservices architecture decisions",
    provider: "A2A Samples",
    model: "gemini",
    endpoints: [{ protocol: "http", address: "localhost", port: 12008 }],
  });

  console.log("✅ All agents registered successfully!");
}
