import {
  normalizeStarterMediaReferences,
  starterMediaRef,
} from "./starterMedia";

export const forgeMotionStarterRef = (role) => starterMediaRef("forge-motion", role);

// Kept as a compatibility export while Forge's existing blueprints migrate to
// the shared marker. Resolution into a tenant Media Library URL is backend-owned.
export function resolveForgeMotionStarterMedia(value) {
  return normalizeStarterMediaReferences(value, "forge-motion");
}
