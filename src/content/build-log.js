// Build log content. Source: content document v4, "Build log page" and Home section 8.
//
// MILESTONES is the one list of project milestones (also used by the Home page "Where we are").
// Change a status only when the work is really done ("Never present a plan as done").
//
// POSTS: published posts only, newest first. The first post in the content document is a draft
// that Ayyappa must approve, with [CONFIRM] markers, so it is not listed here.
//   { slug, title, date: 'YYYY-MM-DD', summary, cover?: { src, alt, label? }, video?: { src, captions, label } }
//   label: 'Render' | 'Simulation' when the picture or video is not of the real robot.

export const MILESTONES = [
  { status: 'done', label: 'Done', when: 'November 2026', text: 'Designed and tested in simulation' },
  { status: 'planned', label: 'Planned', when: 'December 2026', text: 'First complete Gajju Mini' },
  { status: 'planned', label: 'Planned', when: 'Early 2027', text: 'Smart behaviours, then school pilots' },
];

export const POSTS = [];

export const BUILD_LOG = {
  title: 'Building Gajju Mini, week by week.',
  lead: 'What worked, what broke and what we changed, written by our founder Ayyappa. No polish, just the real build.',
  button: 'Get new posts by email',
  // Adapted from the sign-up form's thank-you message in the content document.
  joinLead: "Join the first-batch list. We'll write when there's news, and we post every step of the build here.",
  milestonesTitle: 'Where we are',
  milestonesNote: 'Dates after November 2026 are plans.',
  postsTitle: 'Posts',
  emptyTitle: 'The first post is on its way.',
  emptyText: "We'll post the first real walk here, whether it goes well or not. Join the list to hear when it's up.",
  templateTitle: 'What every post covers',
  template: [
    { icon: 'play', text: 'One photo or a 30-second video at the top, labelled "render" or "simulation" when it isn\'t the real robot.' },
    { icon: 'list-checks', text: 'What we set out to do this week.' },
    { icon: 'wrench', text: 'What happened, including what went wrong.' },
    { icon: 'cog', text: 'What we changed because of it.' },
    { icon: 'footprints', text: "What's next." },
  ],
};
