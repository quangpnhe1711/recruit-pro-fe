import { useEffect } from "react";

type SeoProps = {
  /** Document title; ` · RecruitPro` is appended unless it already mentions the brand. */
  title?: string;
  description?: string;
  /** Absolute or path-only canonical URL. Path-only values are resolved against the origin. */
  canonical?: string;
  /** Private/internal pages set this so crawlers skip them. */
  noindex?: boolean;
  ogImage?: string;
  /** JSON-LD structured data (e.g. schema.org JobPosting). */
  jsonLd?: object | null;
};

const MANAGED_ATTR = "data-rp-seo";

function upsertMeta(selector: string, create: () => HTMLElement, content: string) {
  let el = document.head.querySelector<HTMLElement>(`${selector}[${MANAGED_ATTR}]`);
  if (!el) {
    el = create();
    el.setAttribute(MANAGED_ATTR, "true");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function removeManaged(selector: string) {
  document.head
    .querySelectorAll(`${selector}[${MANAGED_ATTR}]`)
    .forEach((el) => el.remove());
}

/**
 * SPA head manager. Each routed page renders one <Seo>; tags it manages are
 * marked and replaced on navigation.
 *
 * Limitation (documented in the runbook): this is client-side only — most
 * crawlers see the static index.html shell first. Server-side rendering or
 * prerendering is required for guaranteed SEO on public pages.
 */
function Seo({ title, description, canonical, noindex, ogImage, jsonLd }: SeoProps) {
  useEffect(() => {
    const fullTitle = title
      ? title.includes("RecruitPro")
        ? title
        : `${title} · RecruitPro`
      : "RecruitPro";
    document.title = fullTitle;

    const metaName = (name: string) => () => {
      const el = document.createElement("meta");
      el.setAttribute("name", name);
      return el;
    };
    const metaProp = (property: string) => () => {
      const el = document.createElement("meta");
      el.setAttribute("property", property);
      return el;
    };

    if (description) {
      upsertMeta('meta[name="description"]', metaName("description"), description);
      upsertMeta('meta[property="og:description"]', metaProp("og:description"), description);
      upsertMeta('meta[name="twitter:description"]', metaName("twitter:description"), description);
    } else {
      removeManaged('meta[name="description"]');
      removeManaged('meta[property="og:description"]');
      removeManaged('meta[name="twitter:description"]');
    }

    upsertMeta('meta[property="og:title"]', metaProp("og:title"), fullTitle);
    upsertMeta('meta[property="og:type"]', metaProp("og:type"), "website");
    upsertMeta('meta[name="twitter:card"]', metaName("twitter:card"), "summary");
    upsertMeta('meta[name="twitter:title"]', metaName("twitter:title"), fullTitle);

    if (ogImage) {
      upsertMeta('meta[property="og:image"]', metaProp("og:image"), ogImage);
    } else {
      removeManaged('meta[property="og:image"]');
    }

    upsertMeta(
      'meta[name="robots"]',
      metaName("robots"),
      noindex ? "noindex,nofollow" : "index,follow",
    );

    // Canonical + og:url
    removeManaged('link[rel="canonical"]');
    if (canonical && !noindex) {
      const url = canonical.startsWith("http")
        ? canonical
        : `${window.location.origin}${canonical}`;
      const link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", url);
      link.setAttribute(MANAGED_ATTR, "true");
      document.head.appendChild(link);
      upsertMeta('meta[property="og:url"]', metaProp("og:url"), url);
    } else {
      removeManaged('meta[property="og:url"]');
    }

    // JSON-LD structured data
    removeManaged('script[type="application/ld+json"]');
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(MANAGED_ATTR, "true");
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, canonical, noindex, ogImage, jsonLd]);

  return null;
}

export default Seo;
