import {
  invalidateActiveClientSession,
  isAccountDisabledResponse,
  markActiveClientSessionRequest,
  wasClientSessionRequest,
} from "./clientSession";

export const installClientSessionInterceptors = (apiClient) => {
  apiClient.interceptors.request.use((config) =>
    markActiveClientSessionRequest(config)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const data = error?.response?.data || {};
      const code = data.code || data.error || data.error_code;
      const userMessage = data.user_message || data.message || data.detail;
      const isAccountDisabled = isAccountDisabledResponse(error);
      const originatedFromClientSession = wasClientSessionRequest(error);
      const clientSessionInvalidated = invalidateActiveClientSession(error, {
        reason: isAccountDisabled ? "account-disabled" : "authentication-rejected",
        code: code || null,
      });

      if (clientSessionInvalidated) {
        error.clientSessionInvalidated = true;
        error.accountDisabled = isAccountDisabled;
        return Promise.reject(error);
      }

      // A request marked with a client-session token must never fall through
      // to the generic manager/employee account handler. It may now be stale
      // because a newer client logged in or the active role changed while it
      // was pending.
      if (isAccountDisabled && !originatedFromClientSession) {
        if (typeof window !== "undefined" && !error?.config?.noAuth) {
          try {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("company_id");
          } catch {}
          window.dispatchEvent(
            new CustomEvent("schedulaa:account-disabled", {
              detail: {
                code: code || null,
                message:
                  userMessage ||
                  data?.error_description ||
                  "This account is currently disabled.",
              },
            })
          );
          const currentPath = String(window.location?.pathname || "");
          if (!currentPath.startsWith("/login")) {
            const reason = encodeURIComponent(
              userMessage ||
                data?.error_description ||
                "This account is currently disabled."
            );
            window.location.assign(`/login?reason=${reason}`);
          }
        }
        error.accountDisabled = true;
      }

      return Promise.reject(error);
    }
  );
};
