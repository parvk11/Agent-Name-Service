import { AgentNamingService } from "../src/ans.js";

export async function registerExampleAgents(ans: AgentNamingService) {
  await ans.registerAgent("content-creator-agent", {
    version: "1.0.0",
    capabilities: ["text-generation", "summarization"],
    description: "Generates and summarizes content",
    provider: "OpenAI",
    model: "gpt-4",
    endpoints: [{ protocol: "https", address: "api.contentcreator.ai", port: 443 }],
  });

  await ans.registerAgent("translator-agent", {
    version: "1.0.0",
    capabilities: ["translation", "text-conversion"],
    description: "Translates text between languages",
    provider: "LinguaTech",
    model: "lingua-1",
    endpoints: [{ protocol: "https", address: "api.translator.ai", port: 443 }],
  });

  await ans.registerAgent("data-visualization-agent", {
    version: "1.0.0",
    capabilities: ["charts", "plots", "visualization"],
    description: "Creates charts and visualizations",
    provider: "DataVizCorp",
    model: "viz-1",
    endpoints: [{ protocol: "https", address: "api.dataviz.ai", port: 443 }],
  });

  await ans.registerAgent("data-cleaning-agent", {
    version: "1.0.0",
    capabilities: ["data-cleaning", "transformation"],
    description: "Cleans and transforms datasets",
    provider: "DataLabs",
    model: "cleaner-1",
    endpoints: [{ protocol: "https", address: "api.dataclean.ai", port: 443 }],
  });

  await ans.registerAgent("data-analysis-agent", {
    version: "1.0.0",
    capabilities: ["analysis", "statistics"],
    description: "Analyzes datasets and statistics",
    provider: "AnalyticsPro",
    model: "analyzer-1",
    endpoints: [{ protocol: "https", address: "api.dataanalysis.ai", port: 443 }],
  });

  await ans.registerAgent("security-monitor-agent", {
    version: "1.0.0",
    capabilities: ["system-monitoring", "threat-detection"],
    description: "Monitors systems and detects security threats",
    provider: "SecureDefense",
    model: "security-1",
    endpoints: [{ protocol: "https", address: "api.securemonitor.ai", port: 443 }],
  });

  await ans.registerAgent("malware-scanner-agent", {
    version: "1.0.0",
    capabilities: ["malware-detection", "file-scanning"],
    description: "Scans files for malware",
    provider: "CyberSafe",
    model: "malware-1",
    endpoints: [{ protocol: "https", address: "api.malwarescan.ai", port: 443 }],
  });

  await ans.registerAgent("network-security-agent", {
    version: "1.0.0",
    capabilities: ["network-monitoring", "firewall"],
    description: "Manages network security",
    provider: "NetSecure",
    model: "network-1",
    endpoints: [{ protocol: "https", address: "api.networksec.ai", port: 443 }],
  });

  await ans.registerAgent("customer-support-agent", {
    version: "1.0.0",
    capabilities: ["support", "ticketing"],
    description: "Handles customer support tickets",
    provider: "HelpDesk",
    model: "support-1",
    endpoints: [{ protocol: "https", address: "api.customersupport.ai", port: 443 }],
  });

  await ans.registerAgent("faq-agent", {
    version: "1.0.0",
    capabilities: ["faq", "automated-response"],
    description: "Answers frequently asked questions automatically",
    provider: "HelpBot",
    model: "faq-1",
    endpoints: [{ protocol: "https", address: "api.faq.ai", port: 443 }],
  });

  await ans.registerAgent("recommendation-agent", {
    version: "1.0.0",
    capabilities: ["recommendation", "personalization"],
    description: "Recommends products to users",
    provider: "RecTech",
    model: "rec-1",
    endpoints: [{ protocol: "https", address: "api.recommend.ai", port: 443 }],
  });

  await ans.registerAgent("personalization-agent", {
    version: "1.0.0",
    capabilities: ["personalization", "user-preferences"],
    description: "Personalizes shopping experiences",
    provider: "RecTech",
    model: "personal-1",
    endpoints: [{ protocol: "https", address: "api.personalize.ai", port: 443 }],
  });

  await ans.registerAgent("calendar-agent", {
    version: "1.0.0",
    capabilities: ["calendar-management", "scheduling"],
    description: "Schedules and manages calendar events",
    provider: "TimeManage",
    model: "calendar-1",
    endpoints: [{ protocol: "https", address: "api.calendar.ai", port: 443 }],
  });

  await ans.registerAgent("reminder-agent", {
    version: "1.0.0",
    capabilities: ["reminders", "alerts"],
    description: "Sends reminders and alerts",
    provider: "TimeManage",
    model: "remind-1",
    endpoints: [{ protocol: "https", address: "api.reminder.ai", port: 443 }],
  });

  await ans.registerAgent("email-assistant-agent", {
    version: "1.0.0",
    capabilities: ["email", "drafting", "writing"],
    description: "Drafts emails and messages",
    provider: "MailBot",
    model: "email-1",
    endpoints: [{ protocol: "https", address: "api.emailassist.ai", port: 443 }],
  });

  await ans.registerAgent("legal-summarizer-agent", {
    version: "1.0.0",
    capabilities: ["legal-text", "summarization"],
    description: "Summarizes legal documents",
    provider: "LegalAI",
    model: "legal-1",
    endpoints: [{ protocol: "https", address: "api.legalsummarizer.ai", port: 443 }],
  });

  await ans.registerAgent("finance-analyst-agent", {
    version: "1.0.0",
    capabilities: ["finance", "analysis"],
    description: "Analyzes financial reports",
    provider: "FinTech",
    model: "finance-1",
    endpoints: [{ protocol: "https", address: "api.finance.ai", port: 443 }],
  });

  await ans.registerAgent("stock-predictor-agent", {
    version: "1.0.0",
    capabilities: ["stocks", "prediction"],
    description: "Predicts stock trends",
    provider: "FinTech",
    model: "stocks-1",
    endpoints: [{ protocol: "https", address: "api.stockpredict.ai", port: 443 }],
  });

  await ans.registerAgent("task-manager-agent", {
    version: "1.0.0",
    capabilities: ["task-management", "todo"],
    description: "Manages to-do lists",
    provider: "ProductiveAI",
    model: "task-1",
    endpoints: [{ protocol: "https", address: "api.taskmanager.ai", port: 443 }],
  });

  await ans.registerAgent("text-to-speech-agent", {
    version: "1.0.0",
    capabilities: ["text-to-speech", "audio-output"],
    description: "Converts text to speech",
    provider: "VoiceTech",
    model: "tts-1",
    endpoints: [{ protocol: "https", address: "api.texttospeech.ai", port: 443 }],
  });

  await ans.registerAgent("speech-to-text-agent", {
    version: "1.0.0",
    capabilities: ["speech-to-text", "transcription"],
    description: "Transcribes audio recordings",
    provider: "VoiceTech",
    model: "stt-1",
    endpoints: [{ protocol: "https", address: "api.speechtotext.ai", port: 443 }],
  });

  await ans.registerAgent("presentation-agent", {
    version: "1.0.0",
    capabilities: ["slides", "presentation"],
    description: "Creates presentation slides",
    provider: "SlideAI",
    model: "presentation-1",
    endpoints: [{ protocol: "https", address: "api.presentation.ai", port: 443 }],
  });

  await ans.registerAgent("image-editor-agent", {
    version: "1.0.0",
    capabilities: ["image-editing", "photo-editing"],
    description: "Edits images and photos",
    provider: "PhotoAI",
    model: "image-1",
    endpoints: [{ protocol: "https", address: "api.imageedit.ai", port: 443 }],
  });

  await ans.registerAgent("code-generator-agent", {
    version: "1.0.0",
    capabilities: ["code-generation", "programming"],
    description: "Generates code snippets",
    provider: "DevAI",
    model: "code-1",
    endpoints: [{ protocol: "https", address: "api.codegen.ai", port: 443 }],
  });

  await ans.registerAgent("debugger-agent", {
    version: "1.0.0",
    capabilities: ["debugging", "error-finding"],
    description: "Helps debug code",
    provider: "DevAI",
    model: "debug-1",
    endpoints: [{ protocol: "https", address: "api.debugger.ai", port: 443 }],
  });

  await ans.registerAgent("cloud-manager-agent", {
    version: "1.0.0",
    capabilities: ["cloud-management", "deployment"],
    description: "Manages cloud infrastructure",
    provider: "CloudOps",
    model: "cloud-1",
    endpoints: [{ protocol: "https", address: "api.cloudmanager.ai", port: 443 }],
  });

  console.log("✅ All example agents registered successfully.");
}
