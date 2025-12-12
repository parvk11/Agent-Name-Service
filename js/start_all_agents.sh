#!/bin/bash

# start_all_agents.sh
# Script to start all A2A agents

echo "=========================================="
echo "Starting All A2A Agents"
echo "=========================================="

# Array of agent names
agents=(
  "code_debugger"
  "api_design"
  "performance_diagnostics_engineer"
  "frontend"
  "devops"
  "secure_agents"
  "test_automation"
  "software_consultant"
)

# Array of ports
ports=(12001 12002 12003 12004 12005 12006 12007 12008)

# Store PIDs for cleanup
pids=()

# Function to cleanup on exit
cleanup() {
  echo ""
  echo "=========================================="
  echo "Shutting down all agents..."
  echo "=========================================="
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
      echo "Stopped process $pid"
    fi
  done
  echo "All agents stopped."
  exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup SIGINT SIGTERM

# Start each agent
for i in "${!agents[@]}"; do
  agent="${agents[$i]}"
  port="${ports[$i]}"
  
  echo "Starting ${agent} on port ${port}..."
  npx tsx "src/agents/${agent}/index.ts" &
  pid=$!
  pids+=($pid)
  echo "  ✓ Started with PID ${pid}"
  
  # Small delay to avoid overwhelming the system
  sleep 0.5
done

echo ""
echo "=========================================="
echo "All agents started successfully!"
echo "=========================================="
echo ""
echo "Agent Endpoints:"
for i in "${!agents[@]}"; do
  agent="${agents[$i]}"
  port="${ports[$i]}"
  echo "  ${agent}: http://localhost:${port}"
done

echo ""
echo "Press Ctrl+C to stop all agents"
echo "=========================================="

# Wait for all background processes
wait