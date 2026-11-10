import { anthropic } from "@ai-sdk/anthropic";
import { defineAgent } from "eve";

// Runtime config for the eve agent.
// Calls Anthropic directly via @ai-sdk/anthropic — set ANTHROPIC_API_KEY in .env.local.
export default defineAgent({
  model: anthropic("claude-sonnet-4-6"),
});
