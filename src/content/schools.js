// For schools and labs page (/schools). Source: content document v4, "For schools and labs page"
// and the "Schools form" in Site-wide parts. Phase 2 (Appendix A).
//
// Not published (review mode only, see components/gajju/Labels.jsx):
//   - "How many students per robot?": the answer is a "[To decide after the first pilots.]" blank.
//   - Named contact: "[name, role, email]" blank.
//   - The booking link and the reply time ("within [number] working days") in the thank-you message.
// Plans are labelled as plans: school pilots and certificates/competitions are "Planned", and
// the founding-school benefits are described as what the programme is planned to offer.

export const HERO = {
  eyebrow: 'For schools and labs',
  title: 'A Physical AI lab that fits on a desk.',
  lead: 'Physical AI is AI that sees, decides and moves in the real world. With one robot, students learn mechanics, electronics, coding and AI by building and teaching Gajju Mini.',
  primary: 'Book a call',
  secondary: 'Become a founding school',
};

export const WHY = {
  title: 'Why Gajju Mini for your lab',
  items: [
    { icon: 'boxes', name: 'One project, every subject.', text: 'Students assemble it (mechanics), wire it (electronics), program it (coding) and train it (AI).' },
    { icon: 'search', name: 'Students see how it works.', text: 'Nothing is sealed. Every design file is open, and students program Gajju through a documented command list with open example programs.' },
    { icon: 'wrench', name: 'It lasts.', text: 'Broken parts are printed again or replaced. If your lab has a 3D printer, students can print spare and custom parts themselves.' },
    { icon: 'door-open', name: 'It feels familiar.', text: 'Students teach it things from their own lives: spotting a visitor, playing gully cricket, counting cooker whistles.' },
  ],
};

export const STAGES = {
  title: 'From Class 6 to college',
  steps: [
    { icon: 'wrench', name: 'Build', level: 'Class 6 and up', line: 'Assemble and wire Gajju Mini; learn what each part does' },
    { icon: 'code', name: 'Program', level: 'Class 8 and up', line: 'Make it move, react and speak' },
    { icon: 'audio-lines', name: 'Teach', level: 'Class 10 and up', line: 'Train it to recognise sounds, faces and gestures' },
    { icon: 'footprints', name: 'Train', level: 'College', line: 'Improve its walking in simulation, the way robot companies do' },
  ],
  status: 'Being written',
  note: 'Lesson plans for each stage are being written and will come with the first kits.',
};

export const PILOTS = {
  title: 'School pilots',
  status: 'Planned',
  text: 'In early 2027 we will run pilots with a small number of schools. We will use what we learn with you to shape the full school programme.',
  includesTitle: 'A pilot will include',
  includes: ['20-25 Gajju Mini robots', 'A teacher training session', 'The first lesson plans', 'Direct support from our team'],
  note: 'Pilots are planned and not open for booking yet. Tell us you are interested with the form below.',
};

export const FOUNDING = {
  eyebrow: 'Founding schools',
  title: 'Build the first Gajju Minis with your students.',
  text: 'We are looking for teachers and Atal Tinkering Lab in-charges who want to build the first Gajju Minis with their students and tell us honestly what works.',
  plannedTitle: 'What founding schools are planned to get',
  planned: ['Early robots', 'Direct access to our engineers', 'A say in the lessons'],
  status: 'Planned',
  cta: 'Become a founding school',
  contact: { pending: 'Named contact: name, role, email', note: 'to be confirmed' },
};

export const FAQ = [
  { q: 'Do students need to know coding?', a: 'No. Younger students start by building it and running ready-made activities. Older students write their own code.' },
  // "[To decide after the first pilots.]": shown only in review mode.
  { q: 'How many students per robot?', a: '', pending: { text: 'To decide after the first pilots.', note: 'awaiting confirmation' }, reviewOnly: true },
  {
    q: 'Is it safe in a classroom?',
    a: 'Every moving joint is designed so it can\'t trap a finger, and Gajju Mini never controls gas or mains power. Each safety feature is checked on the real robot before any sale.',
  },
  { q: "Does it need the school's Wi-Fi?", a: 'No. It can make its own network.' },
  { q: 'Will there be certificates or competitions?', a: 'They are planned as part of the full school programme.' },
];

export const ENQUIRY = {
  title: "Let's explore Gajju Mini for your school.",
  lead: 'Tell us about your school and what you would like to do with Gajju Mini.',
};
