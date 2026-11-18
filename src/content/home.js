// Home page copy and settings, in one place so text can be updated without touching layout.
// Source: "Gajju website: content for the developer" (DOC-website-content-v4, Nov 18 2026) and the
// Gajju brand guidelines. Section titles are the document's approved wording. Eyebrow labels
// (the small line above a title) are not in the document; they only name the section.
//
// Values left as null are not available yet; the page hides what depends on them.

export const LINKS = {
  github: null, // repository URL, once live. The "See it on GitHub" button appears when set.
  applyForm: '/founding', // founding teacher or maker form (not connected to a form service yet)
  privacyPolicy: '/privacy', // draft until the lawyer-approved text is supplied
  walkVideo: WALK_LOOP, // the walking simulation loop (content/media.js)
};

import { MILESTONES, POSTS } from './build-log.js';
import { WALK_LOOP } from './media.js';

/** Latest Build log posts for the Home page cards (source: content/build-log.js). */
export const BUILD_LOG_POSTS = POSTS.map((p) => ({
  title: p.title,
  date: p.date,
  href: `/build-log#${p.slug}`,
  image: p.cover?.src,
  imageAlt: p.cover?.alt,
  label: p.cover?.label,
}));

export const PHYSICAL_AI = 'AI that sees, decides and moves in the real world';

export const HERO = {
  eyebrow: 'Gajju Mini',
  title: 'Physical AI you can build.',
  lead:
    "Meet Gajju Mini, a baby elephant robot that walks on four legs, sees, hears, talks and picks things up with its trunk. It's Physical AI, AI that sees, decides and moves in the real world. Build it from the kit or get it ready-made, then teach it new skills.",
  primary: 'Join the first-batch list',
  secondary: 'Watch Gajju walk',
  mediaLabel: 'Simulation', // the hero shows the walking simulation loop (content/media.js)
  strip: ['Designed in Hyderabad, India', 'Tested in simulation', 'First robot December 2026', 'Open design files'],
};

export const ACTIVITIES = {
  eyebrow: 'What Gajju does',
  title: "At home it's a helper. In school it's a lab.",
  status: 'In development',
  note: 'Activities are in development; the launch set will be confirmed with the first kits.',
  items: [
    { icon: 'door-open', name: 'Door watch', line: 'Tells you when someone is at the door', skill: 'Person detection' },
    { icon: 'book-open-check', name: 'Study buddy', line: 'Reminds a child who picks up a phone during study time', skill: 'Object recognition' },
    { icon: 'circle-dot', name: 'Gully cricket', line: 'Swings a small bat held in its trunk', skill: 'Sensing, timing and grip' },
    { icon: 'hand', name: 'Namaste and games', line: 'Greets you and plays stone-paper-scissors', skill: 'Gesture recognition' },
    { icon: 'audio-lines', name: 'Teach it a new sound', line: 'You record a sound and train Gajju to know it', skill: 'Machine learning' },
    { icon: 'cooking-pot', name: 'Cooker whistle counter', line: "Counts the whistles and tells you when it's done", skill: 'Sound recognition' },
  ],
};

export const OPEN_DESIGN = {
  eyebrow: 'Open design',
  title: 'Every design file is open.',
  lead:
    "Gajju Mini's design is open source. Download the 3D designs, the wiring diagrams and the parts list for free. Print the parts, change the design and share it back. The software that runs Gajju is free to download.",
  items: [
    { icon: 'cuboid', name: '3D designs', line: 'Files for all the printed parts, each sized for a home 3D printer', status: 'Being prepared for release' },
    { icon: 'cable', name: 'Wiring and parts list', line: 'Every bought part named, with Indian shops that sell it', status: 'Being prepared for release' },
    { icon: 'list-checks', name: 'Build guide', line: 'Step by step', status: 'Coming with the first kits' },
    { icon: 'brain-circuit', name: 'AI training tools', line: 'The trained AI models, plus the simulation and training tools to teach Gajju new skills', status: 'Being prepared for release' },
    { icon: 'code', name: 'Program it', line: 'A documented command list and example programs, so you can make Gajju move, react and speak from your own code', status: 'Being written' },
  ],
  why:
    'We share the design and the AI tools so students can see how it is built, repair it and teach it new skills, the way Arduino and Raspberry Pi grew.',
  software:
    'The software that runs Gajju is free to download and use under the Gajju Software Licence. Its source code is not published.',
  licence:
    'Designs under CERN-OHL-S 2.0; AI models, training tools and example programs under Apache 2.0; guides and lessons under CC BY-SA 4.0. The software that runs Gajju is free under the Gajju Software Licence.',
};

export const LADDER = {
  eyebrow: 'The learning ladder',
  title: 'One robot, from Class 6 to college.',
  lead:
    'Most robot toys are forgotten in two weeks. Gajju Mini grows with you, from building it in Class 6 to improving its walking in college.',
  steps: [
    { icon: 'wrench', name: 'Build', level: 'Class 6 and up', line: 'Assemble and wire it' },
    { icon: 'code', name: 'Program', level: 'Class 8 and up', line: 'Make it move, react and speak' },
    { icon: 'audio-lines', name: 'Teach', level: 'Class 10 and up', line: 'Train it to recognise sounds, faces and gestures' },
    { icon: 'footprints', name: 'Train', level: 'College', line: 'Improve its walking in simulation' },
  ],
};

export const INSIDE = {
  eyebrow: 'Inside Gajju Mini',
  title: 'Every part has a job.',
  hint: 'Drag to turn. Scroll or pinch to zoom. Tap any part to see what it is and what it does.',
  factsTitle: 'Key facts',
  factsNote: 'From the design and simulation. We will confirm each one on the first robot in December 2026.',
  // Strings, or { text, tbc } for a figure that needs engineering confirmation before publishing.
  facts: [
    '4 legs',
    '12 motors',
    'A camera eye and a depth-sensor eye',
    'Microphone and speaker',
    'Raspberry Pi Zero 2 W "brain" and ESP32 "spinal cord"',
    { text: 'About 56 printed parts', tbc: true },
    'About 32 cm long',
  ],
  // The viewer's 3D model has 104 parts; that is not the printed-part count.
  modelNote:
    'The 3D model above has 104 parts in all, because it also includes the motors, electronics, screws and nuts. It is not the count of printed parts.',
};

export const BUILD_STEPS = {
  eyebrow: 'Build steps',
  title: 'From a box of parts to a walking elephant.',
  lead: 'Seven steps in the real build order, each shown on the 3D design.',
  count: 7,
  awaiting: 'Awaiting confirmation from our mechanical engineer',
  pictureLabel: 'Shown on the 3D design',
  note: 'After the first build in December, these will be replaced with real photos and a time-lapse.',
};

export const SMALL_HANDS = {
  eyebrow: 'Safety by design',
  title: 'Made for small hands.',
  items: [
    { icon: 'hand', text: "Every moving joint is shaped so it can't trap a finger." },
    { icon: 'wrench', text: 'No glue: everything is screwed, so it can be opened and repaired.' },
    { icon: 'cog', text: 'Easy to repair: print any part again, and every electronic part is sold by Indian shops.' },
    { icon: 'wifi-off', text: 'Works without a phone, and without home Wi-Fi.' },
    { icon: 'plug-zap', text: 'It never controls gas or mains power. It counts the cooker whistles; it never touches the stove.' },
  ],
  note: 'These are design goals. Each one is checked on the first robot before any sale.',
};

export const WHERE = {
  eyebrow: null, // the title already says "Where we are"
  title: 'Where we are.',
  timeline: MILESTONES, // shared with the Build log page
  postsTitle: 'Latest from the build log',
};

export const FOUNDING = {
  eyebrow: 'Founding teachers and makers',
  title: 'Build the first Gajjus with us.',
  // The number is a proposal ("[20–25]" in the content document) until it is confirmed.
  count: '20–25',
  countNote: 'Number to be confirmed',
  textBefore: 'We are giving',
  textAfter: 'Gajjus to teachers and makers who will build it first, use it with students and tell us honestly what to fix.',
  apply: 'Apply',
  applyPending: 'The application form opens soon.',
};

export const JOIN = {
  eyebrow: 'Join the list',
  title: 'Be first to hear when reservations open.',
  lead: "We'll email you when the first Gajju Minis can be reserved. No spam, and you can leave the list any time.",
  faqTitle: 'Questions',
};

export const FAQ = [
  {
    q: 'When can I get one?',
    a: "The first robot is being built in December 2026. Join the list and you'll hear first when reservations open.",
  },
  {
    q: 'Kit or ready-made: which is right for me?',
    a: 'Choose the kit if you want to build it yourself; building is where most of the learning starts. Choose ready-made to start using it on day one. Both are the same robot, and both can be opened and programmed.',
  },
  {
    q: 'What age is it for?',
    a: 'Building the kit suits Class 6 and up, with an adult helping. Young children should use the ready-made robot with an adult around.',
  },
  {
    q: 'Do I need a 3D printer?',
    a: 'Not for the ready-made Gajju Mini.',
    pending: { text: 'Kit answer depends on whether printed parts are included.', note: 'Waiting on the kit contents' },
    after: 'If you have a printer, you can print spare or custom parts from our free files.',
  },
];
