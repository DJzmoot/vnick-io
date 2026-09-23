/**
 * Shared structured-data building blocks.
 *
 * Every page that emits JSON-LD references the same Person and WebSite nodes by
 * @id, so search engines treat them as one entity across the site rather than a
 * new person on each page.
 */

export const SITE_URL = 'https://vnick.io';
export const PERSON_ID = `${SITE_URL}/#nick`;
export const SITE_ID = `${SITE_URL}/#website`;

export const FULL_NAME = 'Nick Manganiello';

/**
 * Other names people search for. Nick is what he goes by — these exist so a
 * search for the formal name still resolves to the same person.
 */
export const NAME_VARIANTS = ['Nicolas Manganiello', 'vNick'];

export const LINKEDIN_URL = 'https://www.linkedin.com/in/nick-manganiello/';

export const person = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: FULL_NAME,
  alternateName: NAME_VARIANTS,
  familyName: 'Manganiello',
  url: `${SITE_URL}/`,
  mainEntityOfPage: `${SITE_URL}/about/`,
  email: 'nick@vnick.io',
  image: `${SITE_URL}/og-image.png`,
  jobTitle: 'Principal Infrastructure Architect',
  description:
    'Infrastructure architect and systems builder: data centers, networks, virtualization, BCDR, cloud and endpoint management, plus live production, lighting and AV systems.',
  homeLocation: { '@type': 'Place', name: 'Long Island, New York' },
  address: {
    '@type': 'PostalAddress',
    addressRegion: 'NY',
    addressCountry: 'US',
  },
  sameAs: [
    LINKEDIN_URL,
    'https://github.com/DJzmoot',
    'https://stratora.io',
    'https://djneventproductions.com/',
  ],
  knowsAbout: [
    'Network infrastructure',
    'SD-WAN',
    'Virtualization',
    'VMware',
    'Business continuity and disaster recovery',
    'Cloud infrastructure',
    'Endpoint management',
    'Data center and facility design',
    'Structured cabling',
    'Wi-Fi design',
    'Lighting design and programming',
    'Live event production',
  ],
};

export const website = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  url: `${SITE_URL}/`,
  name: 'vNick.io',
  alternateName: FULL_NAME,
  description:
    'The personal site and engineering notebook of Nick Manganiello — infrastructure architecture, networks, virtualization, BCDR, cloud, lighting and live production.',
  inLanguage: 'en-US',
  publisher: { '@id': PERSON_ID },
  author: { '@id': PERSON_ID },
};

/** Wrap nodes in a single @graph document so each page emits one script tag. */
export function graph(...nodes: object[]) {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes });
}

/** Home → Writing → post, for the breadcrumb trail in search results. */
export function breadcrumb(trail: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
