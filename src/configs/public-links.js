const DEFAULT_ORIGIN =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || DEFAULT_ORIGIN;
const APP_SITE_URL = import.meta.env.VITE_APP_SITE_URL || DEFAULT_ORIGIN;

const withTrailingSlash = (value) => (value.endsWith("/") ? value : `${value}/`);

export const PUBLIC_LINKS = {
  publicSite: PUBLIC_SITE_URL,
  appSite: APP_SITE_URL,
  contact: import.meta.env.VITE_CONTACT_URL || `${withTrailingSlash(PUBLIC_SITE_URL)}contact/`,
  insightsBase:
    import.meta.env.VITE_INSIGHTS_BASE_URL || `${withTrailingSlash(PUBLIC_SITE_URL)}insights/`,
  blog: import.meta.env.VITE_BLOG_URL || `${withTrailingSlash(PUBLIC_SITE_URL)}blog`,
  license: import.meta.env.VITE_LICENSE_URL || `${withTrailingSlash(PUBLIC_SITE_URL)}license`,
};

export const DOWNLOAD_LINKS = {
  macrocycles1m:
    import.meta.env.VITE_DOWNLOAD_MACROCYCLES_1M ||
    `${withTrailingSlash(PUBLIC_SITE_URL)}wp-content/uploads/2025/02/Macrocycles-Final-1M-Compounds.zip`,
  macrocycles10k:
    import.meta.env.VITE_DOWNLOAD_MACROCYCLES_10K ||
    `${withTrailingSlash(PUBLIC_SITE_URL)}wp-content/uploads/2025/01/Macrocycles-Final-10k-Compounds.zip`,
};
