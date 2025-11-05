import { useEffect } from "react";

const DEFAULT_DESCRIPTION =
  "Schedulaa helps service businesses automate scheduling, payroll, and customer communication.";
const DEFAULT_OG_IMAGE = "https://www.schedulaa.com/og/default.jpg";

const setMetaTag = (attribute, name, content) => {
  if (!name) return null;
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content || "");
  return element;
};

const removeMetaTag = (attribute, name) => {
  const element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (element) document.head.removeChild(element);
};

const resolveCanonical = (explicit) => {
  if (explicit) return explicit;
  if (typeof window === "undefined") return null;
  const { origin, pathname, search } = window.location || {};
  if (!origin) return null;
  return `${origin}${pathname || ""}${search || ""}`.replace(/\/+$/, pathname ? "" : "/");
};

const Meta = ({
  title,
  description,
  canonical,
  keywords,
  og = {},
  twitter = {},
}) => {
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const previousTitle = document.title;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const resolvedCanonical = resolveCanonical(canonical);

    if (title) document.title = title;
    if (resolvedDescription) setMetaTag("name", "description", resolvedDescription);
    if (keywords) setMetaTag("name", "keywords", keywords);

    let previousCanonicalHref = null;
    let canonicalLinkCreated = false;
    if (resolvedCanonical) {
      let link = document.head.querySelector("link[rel='canonical']");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
        canonicalLinkCreated = true;
      } else {
        previousCanonicalHref = link.getAttribute("href");
      }
      link.setAttribute("href", resolvedCanonical);
    }

    const ogPayload = {
      title: title || previousTitle,
      description: resolvedDescription,
      type: "website",
      url: resolvedCanonical || undefined,
      image: DEFAULT_OG_IMAGE,
      ...og,
    };

    const ogEntries = Object.entries(ogPayload).filter(([, value]) => Boolean(value));
    ogEntries.forEach(([key, value]) => setMetaTag("property", `og:${key}`, value));

    const twitterPayload = {
      card: "summary_large_image",
      title: title || previousTitle,
      description: resolvedDescription,
      image: ogPayload.image,
      ...twitter,
    };
    const twitterEntries = Object.entries(twitterPayload).filter(([, value]) => Boolean(value));
    twitterEntries.forEach(([key, value]) => setMetaTag("name", `twitter:${key}`, value));

    return () => {
      document.title = previousTitle;
      if (resolvedDescription) removeMetaTag("name", "description");
      if (keywords) removeMetaTag("name", "keywords");

      if (resolvedCanonical) {
        const link = document.head.querySelector("link[rel='canonical']");
        if (link) {
          if (canonicalLinkCreated) {
            document.head.removeChild(link);
          } else if (previousCanonicalHref) {
            link.setAttribute("href", previousCanonicalHref);
          } else {
            document.head.removeChild(link);
          }
        }
      }

      ogEntries.forEach(([key]) => removeMetaTag("property", `og:${key}`));
      twitterEntries.forEach(([key]) => removeMetaTag("name", `twitter:${key}`));
    };
  }, [title, description, canonical, keywords, og, twitter]);

  return null;
};

export default Meta;
