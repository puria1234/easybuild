import { eveChannel } from "eve/channels/eve";
import { none } from "eve/channels/auth";

/**
 * `none()` admits anonymous requests to the eve routes. That's acceptable
 * here only because `proxy.ts` already requires a signed-in Supabase session
 * before the browser ever loads the page that calls this agent (/build), and
 * EasyBuild's agent handles no private or regulated data, just PC part
 * picks. A public-facing eve app without that upstream gate should verify
 * its own auth here instead.
 */
export default eveChannel({
  auth: [none()],
});
