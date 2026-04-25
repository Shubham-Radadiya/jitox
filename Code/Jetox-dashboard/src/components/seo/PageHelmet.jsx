import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { resolveRouteSeo, buildBreadcrumbJsonLd } from "../../seo/resolveRouteSeo";
import {
  SITE_NAME,
  absoluteUrl,
  getOgImageAbsolute,
  getGaMeasurementId,
  getGscVerification,
  getSiteUrl,
} from "../../seo/siteConfig";

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Jitox?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jitox is an agri-business ERP and dashboard for managing orders, inventory, accounts, vouchers, field teams, and reports for dealers and distributors.",
      },
    },
    {
      "@type": "Question",
      name: "Who is Jitox for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Agricultural input distributors, dealers, stockists, and teams selling fertilizers, pesticides, seeds, and related products in India.",
      },
    },
  ],
};

/**
 * Per-route title, description, keywords, canonical, Open Graph, Twitter, robots, JSON-LD.
 */
export default function PageHelmet() {
  const { pathname } = useLocation();
  const pathOnly = pathname.split("?")[0] || "/";
  const seo = resolveRouteSeo(pathOnly);
  const pathForCanonical = pathOnly === "/" ? "" : pathOnly.replace(/^\//, "");
  const canonicalClean = absoluteUrl(pathForCanonical);
  const ogImage = getOgImageAbsolute();
  const gaId = getGaMeasurementId();
  const gsc = getGscVerification();

  const breadcrumbLd = buildBreadcrumbJsonLd(pathOnly, getSiteUrl());

  const showFaq = pathOnly === "/login" || pathOnly === "/register";

  return (
    <Helmet prioritizeSeoTags>
      <html lang="en" />
      <title>{seo.title}</title>
      <meta name="description" content={seo.description} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="robots" content={seo.robots} />
      <link rel="canonical" href={canonicalClean} />

      {gsc ? (
        <meta name="google-site-verification" content={gsc} />
      ) : null}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:title" content={seo.title} />
      <meta property="og:description" content={seo.description} />
      <meta property="og:url" content={canonicalClean} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={`${SITE_NAME} logo`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.title} />
      <meta name="twitter:description" content={seo.description} />
      <meta name="twitter:image" content={ogImage} />

      <script type="application/ld+json">
        {JSON.stringify(breadcrumbLd)}
      </script>
      {showFaq ? (
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      ) : null}

      {gaId ? (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <script>
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}', { anonymize_ip: true });
            `}
          </script>
        </>
      ) : null}
    </Helmet>
  );
}
