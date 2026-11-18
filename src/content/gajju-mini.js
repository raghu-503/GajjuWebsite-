// Gajju Mini page content. Source: content document v4, "Gajju Mini page" (hero, what it does,
// see it walk, kit or ready-made, specifications, safe by design, FAQ). The learning section
// reuses the Home page learning ladder, also from the document.
//
// Status words follow the document's rules ("Say where we are"):
//   'design'  — shown in the 3D design (checked against the model's part list)
//   'planned' — a plan or design value, to be checked on the first robot (December 2026)
//   'tbc'     — the document and the 3D model disagree, so it needs engineering confirmation

export const HERO = {
  eyebrow: 'Gajju Mini',
  title: 'Meet Gajju Mini.',
  lead: "A baby elephant robot that walks on four legs, sees, hears, talks and picks things up with its trunk. It's Physical AI (AI that sees, decides and moves in the real world) that you can hold, open up and teach.",
  primary: 'Join the first-batch list',
  secondary: 'Watch it walk',
  mediaLabel: 'Render of the 3D design',
};

export const WHAT_IT_DOES = {
  title: 'What it does',
  text: 'Gajju Mini walks the way a real elephant does, one foot at a time. It turns its head to look around, curls its trunk, and grips small things gently. It hears sounds, recognises people and things, and talks back.',
  intro: 'Out of the box, it will come with activities like these:',
  status: 'In development',
  note: 'The launch set will be confirmed with the first kits.',
  items: [
    { icon: 'door-open', name: 'Door watch', line: 'Tells you when someone is at the door.', skill: 'Person detection' },
    { icon: 'book-open-check', name: 'Study buddy', line: 'Reminds a child who picks up a phone during study time.', skill: 'Object recognition' },
    { icon: 'circle-dot', name: 'Gully cricket', line: 'Swings a small bat held in its trunk.', skill: 'Sensing, timing and grip' },
    { icon: 'hand', name: 'Namaste and games', line: 'Greets you and plays stone-paper-scissors.', skill: 'Gesture recognition' },
    { icon: 'audio-lines', name: 'Teach it a new sound', line: 'Record a sound, train Gajju to know it, and watch it react.', skill: 'Machine learning' },
    { icon: 'cooking-pot', name: 'Cooker whistle counter', line: "Counts the whistles and tells you when it's done. It never touches the stove.", skill: 'Sound recognition' },
  ],
};

export const SEE_IT = {
  title: 'See it walk',
  viewerTitle: 'Every part has a job.',
  videoTitle: 'Walking, in simulation',
  // Content document: "(simulation): a computer video, not the real robot".
  videoText: 'A computer simulation of Gajju Mini walking, not the real robot. The video has no sound.',
  hint: 'Drag to turn. Scroll or pinch to zoom. Tap any part to see what it is and what it does.',
};

export const KIT = {
  title: 'Kit or ready-made',
  lead: 'Both are the same robot, with the same open design files and the same software. Pick the one that fits you.',
  options: [
    {
      name: 'Kit',
      rows: [
        ['For', 'Students, makers and labs who want to build it'],
        // The "[kit contents: printed parts included or not]" blank is still open; until it is filled,
        // visitors see only the confirmed part of the answer (`fallback`).
        ['You get', { pending: 'Kit contents: printed parts included or not', note: 'to be confirmed', after: ', all electronics, motors, battery, screws and a build guide', fallback: 'All electronics, motors, battery, screws and a build guide' }],
        ['You need', 'A screwdriver, a small hex key, and an adult to help with wiring for younger builders'],
        ['Can you open it and program it?', 'Yes'],
      ],
    },
    {
      name: 'Ready-made',
      rows: [
        ['For', 'Families and schools who want to start using it on day one'],
        ['You get', 'Gajju Mini fully assembled and tested'],
        ['You need', 'Nothing, just charge it'],
        ['Can you open it and program it?', 'Yes'],
      ],
    },
  ],
  note: 'We will share the price when reservations open.',
};

export const SPECS = {
  title: 'Specifications',
  note: 'These values come from the design and simulation. We will confirm each one on the first robot in December 2026.',
  legend: [
    ['design', 'In the 3D design', 'The part is in the 3D design. It still has to be checked on the first robot.'],
    ['planned', 'Planned', 'A design value or a behaviour that is planned, not yet checked on a real robot.'],
    ['tbc', 'To be confirmed', "The content document and the 3D design don't match yet; waiting for our engineers."],
  ],
  rows: [
    { label: 'Size', value: 'About 32 cm long, 22 cm tall, 19 cm wide', status: 'design' },
    { label: 'Weight', value: 'About 1.3 kg', status: 'planned' },
    {
      label: 'Legs',
      value: '4, each with a hip motor, a knee motor and a free-moving ankle',
      status: 'tbc',
      why: 'The 3D design shows the hip and knee motors but no separate ankle part.',
    },
    { label: 'Motors', value: '12 TowerPro servo motors', status: 'design' },
    {
      label: 'Brain',
      value: 'Raspberry Pi Zero 2 W: sight, hearing, voice, Wi-Fi',
      status: 'tbc',
      why: 'The 3D design also has an ESP32-CAM camera board in the head; which board runs the camera is to be confirmed.',
    },
    { label: 'Spinal cord', value: 'ESP32: walking, balance and safety', status: 'planned' },
    {
      label: 'Eyes',
      value: 'A camera in the left eye, a distance sensor in the right eye',
      status: 'tbc',
      why: 'The camera and distance sensor are in the 3D design; which eye each sits behind, and which board runs the camera, are to be confirmed.',
    },
    { label: 'Ears and voice', value: 'Microphone and speaker', status: 'design' },
    { label: 'Balance', value: 'Two motion sensors, one in the body and one in the head', status: 'design' },
    { label: 'Head', value: 'Turns left and right, nods up and down', status: 'design' },
    { label: 'Trunk', value: 'Curls up, with a gripper that closes gently', status: 'planned' },
    { label: 'Power', value: 'Rechargeable 7.4 V lithium-ion battery pack with built-in protection', status: 'planned' },
    { label: 'Connection', value: "Wi-Fi. When there's no home Wi-Fi, it makes its own network. No phone needed.", status: 'planned' },
    {
      label: 'Printed parts',
      value: 'About 56, each sized for a home 3D printer',
      status: 'tbc',
      why: 'The 3D model has 104 parts in all, because it also includes motors, electronics, screws and nuts; the printed-part count is to be confirmed.',
    },
    {
      label: 'Software',
      value: 'Free to download and update. The command list, example programs and AI training tools are open source; the core software is not.',
      status: 'planned',
    },
  ],
};

export const SAFE = {
  title: 'Safe by design',
  items: [
    { icon: 'hand', text: "Every moving joint is rounded so it can't trap a finger." },
    { icon: 'footprints', text: "If Gajju Mini tips over, its leg motors go soft, so they don't keep pushing." },
    { icon: 'wrench', text: 'The gripper closes slowly, stops if it meets resistance, and lets go on its own after a few seconds.' },
    { icon: 'plug-zap', text: 'It never controls gas or mains power.' },
  ],
  status: 'Design goals',
  note: 'Each of these is checked on the first robot before any sale.',
};

export const LEARN = {
  eyebrow: 'The learning ladder',
  title: 'One robot, from Class 6 to college.',
  lead: 'Gajju Mini grows with you, from building it in Class 6 to improving its walking in college. Lesson plans for each stage are being written and will come with the first kits.',
};

export const FAQ = [
  { q: 'When can I get one?', a: "The first robot is being built in December 2026. Join the list and you'll hear first when reservations open." },
  { q: 'How much will it cost?', a: 'We will share the price when reservations open.' },
  { q: 'What age is it for?', a: "It's designed for everyone. Building the kit suits Class 6 and up, with an adult helping. Young children should use it with an adult around." },
  { q: 'Do I need a 3D printer?', a: 'Not for the ready-made Gajju Mini. If you have a printer, you can print spare or custom parts from our free files.' },
  { q: 'Does it need the internet or a phone?', a: 'No. It works on its own. An app may come later as an extra.' },
  { q: 'What if a part breaks?', a: 'Print it again from the free files, or order a spare from us (coming).' },
  { q: 'Is there a bigger Gajju?', a: 'We\'re working on robots for bigger jobs. Join the list and tick "the bigger Gajju" to hear about it.' },
];
