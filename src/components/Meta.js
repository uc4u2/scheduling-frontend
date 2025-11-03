import { useEffect } from "react";

const DEFAULT_OG_IMAGE = "https://www.schedulaa.com/og/default.jpg";

const setMetaTag = (attribute, name, content) => {
  if (!name) return;
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content || "");
};

const removeMetaTag = (attribute, name) => {
  const element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (element) document.head.removeChild(element);
};

const Meta = ({
  title,
  description,
  canonical,
  og = {},
}) => {
  useEffect(() => {
    const previousTitle = document.title;
    if (title) document.title = title;
    if (description) setMetaTag("name", "description", description);
    if (canonical) {
      let link = document.head.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonical);
    }

    const ogData = { ...(og || {}) };
    if (!ogData.image) {
      ogData.image = DEFAULT_OG_IMAGE;
    }

    const ogEntries = Object.entries(ogData).filter(([, value]) => Boolean(value));
    ogEntries.forEach(([key, value]) => {
      setMetaTag("property", `og:${key}`, value);
    });

    return () => {
      document.title = previousTitle;
      if (description) removeMetaTag("name", "description");
      if (canonical) {
        const link = document.head.querySelector("link[rel='canonical']");
        if (link) document.head.removeChild(link);
      }
      ogEntries.forEach(([key]) => removeMetaTag("property", `og:${key}`));
    };
  }, [title, description, canonical, og]);

  return null;
};

export default Meta;
