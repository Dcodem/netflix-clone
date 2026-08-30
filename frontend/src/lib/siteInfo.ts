export type SiteInfoPage = {
  slug: string
  title: string
  lead: string
  sections: { heading: string; body: string }[]
}

export const SITE_INFO_PAGES: Record<string, SiteInfoPage> = {
  terms: {
    slug: 'terms',
    title: 'Terms of Use',
    lead: 'These terms cover how this FLIX demo works in your browser. FLIX is not Netflix and is not a paid service.',
    sections: [
      {
        heading: 'The service',
        body: 'FLIX is a front-end demonstration that plays catalog titles in this browser. There is no FLIX app store listing, TV app, or paid membership. Artwork and titles come from the local catalog and TMDB.',
      },
      {
        heading: 'Your account',
        body: 'Sign-in, profiles, My List, and watch history stay in this browser’s storage. Clearing site data removes them. Do not use a password you use anywhere else.',
      },
      {
        heading: 'Playback',
        body: 'Titles play through the catalog watch page in an iframe. There is no download of real Netflix streams and no license to Netflix content.',
      },
      {
        heading: 'Not affiliated',
        body: 'FLIX is an independent demo. It is not affiliated with, endorsed by, or sponsored by Netflix, Inc.',
      },
    ],
  },
  privacy: {
    slug: 'privacy',
    title: 'Privacy Statement',
    lead: 'What stays on this device, and what may load from the network while you browse.',
    sections: [
      {
        heading: 'Stored on this device',
        body: 'Email, profile names, PINs, My List, viewing activity, player preferences, cookie choices, and gift balance are saved in localStorage on this browser only.',
      },
      {
        heading: 'Network requests',
        body: 'The catalog API, title art, and optional TMDB or trailer requests may leave this device. FLIX does not sell that activity and does not run a FLIX account server.',
      },
      {
        heading: 'Cookies',
        body: 'Use Cookie Preferences in the footer to turn performance, functional, and targeting cookies on or off. Strictly necessary cookies stay on so you can remain signed in.',
      },
    ],
  },
  legal: {
    slug: 'legal',
    title: 'Legal Notices',
    lead: 'Notices about branding, catalog credits, and this demonstration.',
    sections: [
      {
        heading: 'Trademarks',
        body: 'Netflix and the N logo are trademarks of Netflix, Inc. FLIX is a demo brand used only in this project.',
      },
      {
        heading: 'Catalog and artwork',
        body: 'Title names, synopses, and images may come from the bundled catalog or TMDB. Those parties retain their rights. This demo does not grant you those rights.',
      },
      {
        heading: 'No warranty',
        body: 'FLIX is provided as-is for demonstration. Playback, search, and account tools can change or break without notice.',
      },
    ],
  },
  corporate: {
    slug: 'corporate',
    title: 'Corporate Information',
    lead: 'There is no FLIX corporation. This app is a browser-only demonstration.',
    sections: [
      {
        heading: 'Company',
        body: 'FLIX is not a registered company and has no officers, offices, or employees. The interface runs locally in your browser.',
      },
      {
        heading: 'Contact',
        body: 'There is no corporate switchboard. The number on the login footer is a demo label only.',
      },
    ],
  },
  investors: {
    slug: 'investors',
    title: 'Investor Relations',
    lead: 'FLIX is not a public company and has no investor site, filings, or stock.',
    sections: [
      {
        heading: 'Securities',
        body: 'There are no FLIX shares, earnings calls, or SEC filings. Do not treat anything in this demo as financial information.',
      },
      {
        heading: 'Updates',
        body: 'Product changes ship as commits to this repository. They are not investor communications.',
      },
    ],
  },
  jobs: {
    slug: 'jobs',
    title: 'Jobs',
    lead: 'There are no open roles for this demo.',
    sections: [
      {
        heading: 'Openings',
        body: 'FLIX does not hire. Pages that look like a careers board on Netflix are not available here.',
      },
      {
        heading: 'Internships',
        body: 'There is no internship or contractor program. Building on this clone is local only.',
      },
    ],
  },
  contact: {
    slug: 'contact',
    title: 'Contact Us',
    lead: 'There is no support inbox for this demo. Account and Help stay on this device.',
    sections: [
      {
        heading: 'Phone',
        body: 'The login footer lists 1-844-505-2993 as a Netflix-style label. Calling it will not reach a FLIX support team.',
      },
      {
        heading: 'Help on this device',
        body: 'After you sign in, Help Center and FAQ cover watching, captions, profiles, and Account. While watching, press ? for player shortcuts.',
      },
    ],
  },
  media: {
    slug: 'media',
    title: 'Media Center',
    lead: 'There is no press kit, screenshot pack, or talent booking desk for FLIX.',
    sections: [
      {
        heading: 'Press',
        body: 'FLIX does not issue press releases. Title artwork in the catalog is not a FLIX original stills library.',
      },
      {
        heading: 'Assets',
        body: 'Use FAQ and Help Center for product descriptions. Do not treat this demo as a Netflix media portal.',
      },
    ],
  },
}

export const SITE_INFO_HREFS: Record<string, string> = {
  'Terms of Use': '/terms',
  Privacy: '/privacy',
  'Legal Notices': '/legal',
  'Corporate Information': '/corporate',
  'Investor Relations': '/investors',
  Jobs: '/jobs',
  'Contact Us': '/contact',
  'Media Center': '/media',
}
