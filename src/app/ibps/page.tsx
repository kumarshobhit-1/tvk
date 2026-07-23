import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { ArrowRight, Home, Layers3 } from "lucide-react";
import { Hero } from "@/components/ibps/Hero";
import { Overview } from "@/components/ibps/Overview";
import { ImportantDates } from "@/components/ibps/ImportantDates";
import { VacancyTable } from "@/components/ibps/VacancyTable";
import { Eligibility } from "@/components/ibps/Eligibility";
import { ExamPattern } from "@/components/ibps/ExamPattern";
import { MeritPath } from "@/components/ibps/MeritPath";
import { Syllabus } from "@/components/ibps/Syllabus";
import { Salary } from "@/components/ibps/Salary";
import { SelectionProcess } from "@/components/ibps/SelectionProcess";
import { Strategy } from "@/components/ibps/Strategy";
import { FAQ } from "@/components/ibps/FAQ";
import { CTA } from "@/components/ibps/CTA";
import {
  IBPS_SITE,
  faqItems,
  ibpsBreadcrumbs,
} from "@/components/ibps/data";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildEducationalOrganizationJsonLd,
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildOrganizationJsonLd,
  buildWebPageJsonLd,
  buildWebsiteJsonLd,
  jsonLd,
} from "@/lib/seo/structuredData";
import Image from "next/image";

const PAGE_TITLE = "IBPS SO IT Officer 2026: Notification, Exam Pattern, Syllabus & Salary";
const PAGE_DESCRIPTION =
  "IBPS SO IT Officer (Scale I) 2026 — 301 vacancies, revised exam pattern with Professional Knowledge in Prelims, full syllabus, eligibility, salary and selection process.";
const PAGE_KEYWORDS = [
  "IBPS",
  "IBPS SO",
  "IBPS SO IT Officer",
  "IBPS SO IT Officer 2026",
  "IBPS SO Syllabus",
  "IBPS SO Salary",
  "IBPS SO Exam Pattern",
  "IBPS SO Eligibility",
  "IBPS SO Notification",
  "IBPS SO Vacancy",
  "IBPS SO Mock Test",
  "IBPS SO Notes",
];

export const dynamic = "force-static";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    metadataBase: new URL(IBPS_SITE.siteUrl),
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    keywords: PAGE_KEYWORDS,
    alternates: {
      canonical: IBPS_SITE.canonicalUrl,
    },
    category: "education",
    authors: [{ name: IBPS_SITE.siteName }],
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      type: "article",
      url: IBPS_SITE.canonicalUrl,
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      siteName: IBPS_SITE.siteName,
      locale: "en_IN",
      images: [
        {
          url: IBPS_SITE.ogImageUrl,
          width: 1200,
          height: 630,
          alt: "IBPS SO IT Officer 2026 by The Victory Key",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      images: [IBPS_SITE.ogImageUrl],
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
      apple: "/favicon.ico",
    },
    other: {
      "geo.region": "IN",
      "geo.placename": "India",
    },
  };
}

export default function IbpsPage() {
  const pageUrl = IBPS_SITE.canonicalUrl;
  const structuredData = [
    buildOrganizationJsonLd(),
    buildEducationalOrganizationJsonLd(),
    buildWebsiteJsonLd(IBPS_SITE.siteUrl),
    buildWebPageJsonLd({
      url: pageUrl,
      name: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      breadcrumbUrl: pageUrl,
    }),
    buildArticleJsonLd({
      url: pageUrl,
      headline: PAGE_TITLE,
      description: PAGE_DESCRIPTION,
      image: IBPS_SITE.ogImageUrl,
      datePublished: "2026-07-01",
      dateModified: "2026-07-05",
    }),
    buildBreadcrumbJsonLd(ibpsBreadcrumbs.map((item) => ({ name: item.name, url: `${IBPS_SITE.siteUrl}${item.href === "/" ? "" : item.href}` }))),
    buildFaqJsonLd(faqItems),
    buildItemListJsonLd([
      { name: "IBPS SO exam hub", url: `${IBPS_SITE.siteUrl}/exam` },
      { name: "Library", url: `${IBPS_SITE.siteUrl}/library` },
      { name: "Contact", url: `${IBPS_SITE.siteUrl}/contact` },
      { name: "Dashboard", url: `${IBPS_SITE.siteUrl}/dashboard` },
    ]),
  ];

  const tocLinks = [
    ["Overview", "overview"],
    ["Dates", "dates"],
    ["Vacancies", "vacancies"],
    ["Eligibility", "eligibility"],
    ["Pattern", "pattern"],
    ["Syllabus", "syllabus"],
    ["Salary", "salary"],
    ["Selection", "selection"],
    ["Strategy", "strategy"],
    ["FAQ", "faq"],
  ] as const;

  return (
    <main className="bg-background text-foreground">
      {structuredData.map((data, index) => (
        <script
          key={`${data["@type"] ?? "structured-data"}-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(data) }}
        />
      ))}

      <Hero />

            {/* <nav className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="container mx-auto flex items-center gap-2 overflow-x-auto px-4 py-3 text-sm no-scrollbar"> */}
            <nav className="sticky top-0 z-20 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                {/* <div className="container mx-auto flex items-center gap-3 overflow-x-auto px-6 py-4 text-base no-scrollbar"> */}
                <div className="container mx-auto flex items-center gap-4 overflow-x-auto px-8 py-4 no-scrollbar">
                    {/* <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white dark:bg-slate-100 dark:text-slate-950">
                        <Layers3 className="h-3.5 w-3.5" />
                        On this page
                    </span> */}
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.20em] text-white dark:bg-slate-100 dark:text-slate-950">
                        <Layers3 className="h-4 w-4" />
                        On this page
                    </span>
                    {tocLinks.map(([label, id]) => (
                        // <Link
                        //     key={id}
                        //     href={`#${id}`}
                        //     className="rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-sky-300 hover:text-sky-700 dark:hover:text-sky-300"
                        //     >
                        //     {label}
                        //     </Link>
                        <Link
                            key={id}
                            href={`#${id}`}
                            className="rounded-full border border-border/60 px-5 py-2 text-sm font-medium shadow-sm hover:shadow-md text-muted-foreground transition-all duration-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-slate-800 dark:hover:text-sky-300"
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            </nav>

      <article>
        <Overview />
        <ImportantDates />
        <VacancyTable />
        <Eligibility />
        <section id="fee" className="border-b border-border/60 bg-background py-14 md:py-18">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Apply</p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50 md:text-3xl">Application fee &amp; how to apply</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground md:text-base">
                Registration is fully online at ibps.in. You may apply for only one Specialist Officer post — a second application gets you rejected, so choose IT Officer and set your bank preference order carefully.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-border/60 shadow-sm">
                <table className="w-full border-collapse text-sm">
                  <caption className="sr-only">Fee (online only, incl. GST)</caption>
                  <thead className="bg-slate-900 text-white dark:bg-slate-800">
                    <tr>
                      <th scope="col" className="px-5 py-4 text-left font-semibold">Category</th>
                      <th scope="col" className="px-5 py-4 text-right font-semibold">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["SC / ST / PwBD", "₹175"],
                      ["General / OBC / EWS", "₹850"],
                      ["Edit-window correction (if used)", "₹200"],
                    ].map(([category, fee], index) => (
                      <tr key={category} className={index % 2 === 0 ? "bg-white dark:bg-slate-950" : "bg-slate-50 dark:bg-slate-900/60"}>
                        <td className="px-5 py-4 font-medium text-slate-900 dark:text-slate-50">{category}</td>
                        <td className="px-5 py-4 text-right font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>{fee}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-slate-50 p-6 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">Steps to register</p>
                {[
                  "Go to ibps.in → CRP Specialist Officers → new registration.",
                  "Fill personal, qualification and category details; upload photo, signature, left thumb impression and handwritten declaration.",
                  "Set your bank preference order — it is final and cannot be changed later.",
                  "Pay the fee, submit, and save the confirmation for your records.",
                ].map((step, index) => (
                  <div key={step} className="flex gap-3 rounded-2xl border border-border/60 bg-background p-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm font-bold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-7 text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <ExamPattern />
        <MeritPath />
        <Syllabus />
        <Salary />
        <SelectionProcess />
        <Strategy />
        <FAQ />
        <CTA />
      </article>

      {/* <footer className="border-t border-border/60 bg-slate-950 py-10 text-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="text-lg font-semibold text-white">The Victory Key</p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
                Focused coaching for government and PSU technical exams — notes, mock tests and video lessons built for the exam that's actually in front of you.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Explore</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link className="transition-colors hover:text-white" href="/library">Library</Link></li>
                <li><Link className="transition-colors hover:text-white" href="/exam">Exam hub</Link></li>
                <li><Link className="transition-colors hover:text-white" href="/dashboard">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Connect</p>
              <ul className="mt-3 space-y-2 text-sm">
                <li><Link className="transition-colors hover:text-white" href="/contact">Contact</Link></li>
                <li><a className="transition-colors hover:text-white" href="https://www.ibps.in" target="_blank" rel="noreferrer noopener">IBPS official ↗</a></li>
              </ul>
            </div>
          </div>
          <p className="mt-8 border-t border-white/10 pt-6 text-xs leading-6 text-slate-400">
            The Victory Key is a private coaching provider and is not affiliated with IBPS or any participating bank. All exam details are compiled from the official CRP SPL-XVI notification and are indicative; dates and figures are tentative — always verify the latest information at ibps.in before applying.
          </p>
        </div>
      </footer> */}
    </main>
  );
}
