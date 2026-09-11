import { defineAgent } from "eve";

/**
 * Same model EasyBuild already used through the Vercel AI Gateway
 * (see the previous AI_MODEL env var). Kept as a static string so the
 * model choice stays explicit and compiles ahead of time.
 */
export default defineAgent({
  model: "openai/gpt-5.6-luna",
});
