// For parents page (/parents). Source: content document v4, "For parents page", plus approved
// FAQ answers from the "Gajju Mini page" where the brief asks for the same question.
// Phase 2 (Appendix A).
//
// Not published: "Your privacy" statement, which is "[Waiting on Ayyappa's decision]" (review
// mode only). The page links to the Privacy Policy instead and makes no camera/microphone claims.
// Safety points are presented as design goals, not tested or certified facts.

export const HERO = {
  eyebrow: 'For parents',
  title: 'A robot your child builds, understands and keeps learning from.',
  lead: 'Most robot toys are forgotten in two weeks. Gajju Mini grows with your child, from building it in Class 6 to teaching it new skills in college.',
  primary: 'Join the first-batch list',
  mediaLabel: 'Render of the 3D design',
};

export const LEARNS = {
  title: 'What your child learns',
  items: [
    { icon: 'cog', name: 'How machines work', line: 'Motors, joints, balance and power, by putting them together.' },
    { icon: 'footprints', name: 'How to make things move', line: 'Simple programs that make Gajju Mini walk, turn its head and talk.' },
    { icon: 'audio-lines', name: 'How AI learns', line: 'Teaching Gajju Mini to recognise a sound or a gesture, then watching it react.' },
    { icon: 'wrench', name: 'How to fix things', line: 'When something goes wrong, they open it up and find out why.' },
  ],
};

export const CHILDREN = {
  title: 'Built with children in mind',
  items: [
    { icon: 'hand', text: 'Moving joints are designed with rounded shapes so they can\'t trap a finger.' },
    { icon: 'wrench', text: 'No glue anywhere: every part is screwed together, so it can be opened and repaired.' },
    { icon: 'circle-dot', text: "The trunk's gripper is designed to close slowly and let go on its own." },
    { icon: 'plug-zap', text: 'It never controls gas or mains power. It counts the cooker whistles; it never touches the stove.' },
    { icon: 'book-open-check', text: 'Gajju Mini will be safety-certified before we deliver it to children.' },
  ],
  status: 'Design goals',
  note: 'These are design goals, not test results yet. Each one is checked on the first robot before any sale, and Gajju Mini goes to children only after safety certification.',
};

export const HOME_HELP = {
  title: 'Helpful at home too',
  text: 'Gajju Mini tells you when someone is at the door, nudges your child back to study when a phone comes out, and counts cooker whistles. Each of these is also a lesson in Physical AI: AI that sees, decides and moves in the real world.',
  items: [
    { icon: 'door-open', name: 'Door watch', line: 'Tells you when someone is at the door.', skill: 'Person detection' },
    { icon: 'book-open-check', name: 'Study buddy', line: 'Reminds a child who picks up a phone during study time.', skill: 'Object recognition' },
    { icon: 'cooking-pot', name: 'Cooker whistle counter', line: "Counts the whistles and tells you when it's done. It never touches the stove.", skill: 'Sound recognition' },
  ],
  status: 'In development',
  note: 'Activities are in development; the launch set will be confirmed with the first kits.',
};

export const KIT = {
  title: 'Kit or ready-made?',
  lead: 'Both are the same robot, with the same open design files and the same software.',
  options: [
    {
      name: 'Kit',
      points: [
        'Choose the kit if your child (with you) wants to build it. Building is where most of the learning starts.',
        'You need a screwdriver, a small hex key, and an adult to help with wiring for younger builders.',
      ],
    },
    {
      name: 'Ready-made',
      points: [
        'Choose ready-made for a younger child, or to start using it on day one.',
        'Your child can still open it up, explore it and program it later.',
      ],
    },
  ],
  note: 'We will share the price when reservations open.',
};

export const PRIVACY = {
  title: 'Your privacy',
  text: 'The Privacy Policy explains what the forms on this website ask for, and why.',
  link: 'Read the Privacy Policy',
  // "[Waiting on Ayyappa's decision]": shown only in review mode, marked as a proposal.
  proposed:
    "Gajju Mini's camera and microphone work inside the robot. Pictures and sounds are not sent to the internet unless you choose to share them.",
};

export const FAQ = [
  { q: 'When can I get one?', a: "The first robot is being built in December 2026. Join the list and you'll hear first when reservations open." },
  { q: 'How much will it cost?', a: 'We will share the price when reservations open.' },
  {
    q: 'What age is it for?',
    a: 'Building the kit suits Class 6 and up, with an adult helping. The ready-made robot is for every age; young children should use it with an adult around.',
  },
  { q: 'How long does it take to build?', a: "We'll share real build times after the first builds in December 2026." },
  { q: 'Do I need a 3D printer?', a: 'Not for the ready-made Gajju Mini. If you have a printer, you can print spare or custom parts from our free files.' },
  { q: 'Does it need the internet or a phone?', a: 'No. It works on its own. An app may come later as an extra.' },
  { q: 'What if a part breaks?', a: 'Print it again from the free files, or order a spare from us (coming).' },
  { q: 'Is it a good gift?', a: 'Yes, for a child who likes taking things apart or asking "how does it work?"' },
  { q: 'Is there a bigger Gajju?', a: 'We\'re working on robots for bigger jobs. Join the list and tick "the bigger Gajju" to hear about it.' },
];
