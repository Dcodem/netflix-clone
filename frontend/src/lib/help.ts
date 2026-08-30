export type HelpArticle = {
  id: string
  title: string
  body: string
}

export type HelpTopic = {
  id: string
  title: string
  articles: HelpArticle[]
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'start',
    title: 'Getting started',
    articles: [
      {
        id: 'what-is-flix',
        title: 'What is FLIX?',
        body: 'FLIX is a browser-only demo. Titles play in this window with overlay chrome. There is no TV app, and FLIX is not affiliated with Netflix.',
      },
      {
        id: 'whos-watching',
        title: 'Who’s watching?',
        body: 'Pick a profile on Who’s Watching. Use Exit Profile or Switch Profiles to change who’s watching without signing out. Manage Profiles can add, edit, or lock a profile with a PIN.',
      },
    ],
  },
  {
    id: 'account',
    title: 'Account & billing',
    articles: [
      {
        id: 'manage-account',
        title: 'Manage your account',
        body: 'Open Account from the profile menu or footer to change email, password, phone, plan, and payment last four. Plan prices stay on this device. FLIX does not charge a card.',
      },
      {
        id: 'gift-cards',
        title: 'Redeem a gift card',
        body: 'On Account, choose Redeem gift card or promo code. Credit stays on this device. Gift cards are not sold here.',
      },
      {
        id: 'comms-privacy',
        title: 'Communication and privacy',
        body: 'Communication settings choose which emails this account would receive. Privacy controls personalized recommendations and sharing viewing activity. Recommendations off uses popular titles instead of your taste.',
      },
    ],
  },
  {
    id: 'watch',
    title: 'Watching',
    articles: [
      {
        id: 'report',
        title: 'Report a problem',
        body: 'While watching, use the flag in the top bar to report a problem. Choose video, buffering, picture, sound, captions, or something else. FLIX does not send the report anywhere.',
      },
      {
        id: 'shortcuts',
        title: 'Keyboard shortcuts',
        body: 'While watching, press ? for shortcuts: Space or K play/pause, F full screen, P miniplayer, C captions, M mute, N next episode, S skip intro, Esc back. Digit keys 0–9 jump by 10%.',
      },
      {
        id: 'captions',
        title: 'Audio and subtitles',
        body: 'Open Audio & Subtitles in the player. Caption size, background, font, and color stay in that panel. The C key cycles captions. Audio tracks are local to this device.',
      },
      {
        id: 'autoplay',
        title: 'Autoplay, skip intros, and data usage',
        body: 'Account Playback settings control autoplay next episode, autoplay previews, auto-skip recaps and intros, and data usage per screen. Data usage is a preference only — playback stays in this browser.',
      },
    ],
  },
  {
    id: 'lists',
    title: 'My List & notifications',
    articles: [
      {
        id: 'downloads',
        title: 'Downloads',
        body: 'On a phone, Download on a title adds it to My Netflix. Account Download settings choose Standard or Higher quality and Smart Downloads. FLIX does not store video files.',
      },
      {
        id: 'my-list',
        title: 'My List and Remind Me',
        body: 'Add titles with My List. Coming soon titles use Remind Me instead of Play. Reminded titles land on My List and in Notifications.',
      },
      {
        id: 'notifications',
        title: 'Notifications',
        body: 'The header bell shows Remind Me, new episodes, and coming soon. Opening the panel marks those items seen so the red badge clears. Phone notifications live on My Netflix.',
      },
    ],
  },
  {
    id: 'browse',
    title: 'Finding titles',
    articles: [
      {
        id: 'search',
        title: 'Search',
        body: 'Use the header search. Phone search shows Recent Searches and Top Searches when the box is empty. Cast, genre, and creator names in a title also open search.',
      },
      {
        id: 'languages',
        title: 'Browse by Languages',
        body: 'Browse by Languages lists titles in their original language. The menu only offers languages that have a title. Sort by Suggestions, year, A–Z, or Z–A.',
      },
    ],
  },
]

export function filterHelpTopics(query: string): HelpTopic[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return HELP_TOPICS
  return HELP_TOPICS.map((topic) => ({
    ...topic,
    articles: topic.articles.filter(
      (article) =>
        article.title.toLowerCase().includes(needle) ||
        article.body.toLowerCase().includes(needle) ||
        topic.title.toLowerCase().includes(needle),
    ),
  })).filter((topic) => topic.articles.length)
}
