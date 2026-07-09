export type StructuredDataRecord = Record<string, unknown>;

export const SITE_NAME = "The Victory Key";
export const SITE_URL = "https://thevictorykey.com";

export function jsonLd(data: StructuredDataRecord): string {
  return JSON.stringify(data);
}

export function buildOrganizationJsonLd(): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [
      "https://www.youtube.com/@TheVictoryKey",
      "https://t.me/TheVictoryKey",
    ],
  };
}

export function buildEducationalOrganizationJsonLd(): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: SITE_NAME,
    url: SITE_URL,
    description: "Preparation platform for government, banking, PSU and technical exams.",
    sameAs: [
      "https://www.youtube.com/@TheVictoryKey",
      "https://t.me/TheVictoryKey",
    ],
  };
}

export function buildWebsiteJsonLd(searchUrl: string): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${searchUrl}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildWebPageJsonLd(input: {
  url: string;
  name: string;
  description: string;
  breadcrumbUrl?: string;
}): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: input.url,
    name: input.name,
    description: input.description,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    breadcrumb: input.breadcrumbUrl ?? input.url,
    inLanguage: "en-IN",
  };
}

export function buildArticleJsonLd(input: {
  url: string;
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
}): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: input.url,
    headline: input.headline,
    description: input.description,
    image: [input.image],
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/favicon.ico`,
      },
    },
    datePublished: input.datePublished,
    dateModified: input.dateModified,
    inLanguage: "en-IN",
  };
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqJsonLd(items: Array<{ question: string; answer: string }>): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildItemListJsonLd(items: Array<{ name: string; url: string }>): StructuredDataRecord {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}
