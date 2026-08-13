export const canonicalWebsitePagePath = (pageId) =>
  `/api/website/pages/${encodeURIComponent(String(pageId))}`;
