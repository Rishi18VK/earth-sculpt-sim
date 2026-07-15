import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfile from "./tools/get-profile";
import getStats from "./tools/get-stats";
import listDonations from "./tools/list-donations";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "terracraft-mcp",
  title: "TerraCraft 3D MCP",
  version: "0.1.0",
  instructions:
    "Tools for the signed-in TerraCraft 3D user. Use `get_profile` for their profile, `get_stats` for gameplay stats, and `list_donations` to review their support history.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getProfile, getStats, listDonations],
});
