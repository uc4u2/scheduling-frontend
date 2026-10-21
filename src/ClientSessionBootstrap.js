// Importing the API installs the single session bridge for this document.
// Keep the receiver alive until its parent observes verified completion.
// No login/dashboard routing, branding fetch, or existing-session redirect.
import "./utils/api";

export default function ClientSessionBootstrap() {
  return null;
}
