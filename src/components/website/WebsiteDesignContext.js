import React, { createContext, useContext } from "react";
import {
  normalizeWebsiteDesignMetadata,
  resolveWebsiteDesignTokens,
} from "./websiteDesign";

const defaultDesign = normalizeWebsiteDesignMetadata({});

const WebsiteDesignContext = createContext({
  design: defaultDesign,
  familyModule: null,
  resolveTokens: () => resolveWebsiteDesignTokens(),
});

export function WebsiteDesignProvider({ value, children }) {
  return (
    <WebsiteDesignContext.Provider value={value}>
      {children}
    </WebsiteDesignContext.Provider>
  );
}

export function useWebsiteDesign() {
  return useContext(WebsiteDesignContext);
}
