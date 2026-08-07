import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export const isExternalHref = (href = "") => /^https?:\/\//i.test(String(href || "").trim());

export function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function htmlToParagraphs(value) {
  return String(value || "")
    .split(/<\/p>/i)
    .map((chunk) => stripHtml(chunk))
    .filter(Boolean);
}

export function toArray(value) {
  return Array.isArray(value) ? value : [];
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(Boolean(mq.matches));
    apply();
    mq.addEventListener?.("change", apply);
    mq.addListener?.(apply);
    return () => {
      mq.removeEventListener?.("change", apply);
      mq.removeListener?.(apply);
    };
  }, []);
  return reduced;
}

export function useReveal({ offset = 18, delay = 0 } = {}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [seen, setSeen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion || seen || typeof IntersectionObserver !== "function") {
      return undefined;
    }
    const node = ref.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion, seen]);

  const style = prefersReducedMotion
    ? { opacity: 1, transform: "none" }
    : {
        opacity: seen ? 1 : 0.01,
        transform: seen ? "translate3d(0,0,0)" : `translate3d(0,${offset}px,0)`,
        transition: `opacity ${240 + delay}ms cubic-bezier(0.2, 0.7, 0.2, 1), transform ${240 + delay}ms cubic-bezier(0.2, 0.7, 0.2, 1)`,
      };

  return [ref, style];
}

export function useParallax(multiplier = 0.08) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion || typeof window === "undefined") return undefined;
    const media = window.matchMedia?.("(max-width: 900px)");
    if (media?.matches) return undefined;
    const onScroll = () => setOffset(window.scrollY * multiplier);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [multiplier, prefersReducedMotion]);
  return prefersReducedMotion ? 0 : offset;
}

export function useCountUp(text, active = true, duration = 1200) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const parsed = useMemo(() => {
    const raw = String(text || "").trim();
    const match = raw.match(/^([^0-9-]*)(-?\d+(?:\.\d+)?)(.*)$/);
    if (!match) return null;
    const [, prefix = "", valueText = "", suffix = ""] = match;
    const value = Number(valueText);
    if (!Number.isFinite(value)) return null;
    return {
      prefix,
      suffix,
      value,
      decimals: (valueText.split(".")[1] || "").length,
    };
  }, [text]);
  const [display, setDisplay] = useState(String(text || ""));

  useEffect(() => {
    const finalText = String(text || "");
    if (!active || prefersReducedMotion || !parsed || typeof window === "undefined") {
      setDisplay(finalText);
      return undefined;
    }
    let start = 0;
    let frame = 0;
    const tick = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const current = parsed.value * progress;
      const body =
        parsed.decimals > 0 ? current.toFixed(parsed.decimals) : String(Math.round(current));
      setDisplay(`${parsed.prefix}${body}${parsed.suffix}`);
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      } else {
        setDisplay(finalText);
      }
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [active, duration, parsed, prefersReducedMotion, text]);

  return display;
}

export function FamilyLinkButton({
  href,
  label,
  variant = "contained",
  sx = {},
  endIcon,
  children,
  ...rest
}) {
  if (!label && !children) return null;
  const linkProps = isExternalHref(href)
    ? {
        component: "a",
        href,
        target: "_blank",
        rel: "noreferrer noopener",
      }
    : href
    ? { component: RouterLink, to: href }
    : {};
  return (
    <Button {...linkProps} {...rest} variant={variant} endIcon={endIcon} sx={sx}>
      {children || label}
    </Button>
  );
}
