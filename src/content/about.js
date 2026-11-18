// About page content. Source: content document v4, "About page" (hero, story, vision and
// mission, Neonflake, what's next, contact, press kit). The "Build, program, teach" section
// reuses approved lines from the document's For schools page and Open source section.
// No team members, biographies, awards or partners are named: none are in the document.

export const NEONFLAKE_URL = 'https://neonflake.com';

export const HERO = {
  eyebrow: 'About Gajju',
  title: 'We build robots people can understand.',
  lead: 'Gajju is made by Neonflake AI Labs Pvt Ltd in Hyderabad.',
  primary: 'Contact',
  secondary: 'Visit neonflake.com',
};

export const STORY = {
  title: 'Our story',
  paragraphs: [
    'AI is moving off screens and into the real world: robots that see, decide and move. We call this Physical AI. Every country will need millions of people who can build and program machines like these. We think the best way to learn is to build one yourself.',
    "We chose a baby elephant because it's loved everywhere, and because its trunk is a natural way for a robot to pick things up. Four legs keep it steady, so a beginner's robot doesn't fall over all the time.",
  ],
};

export const VALUES = {
  title: 'Vision, mission and how we work',
  items: [
    { icon: 'search', name: 'Vision', text: 'A world where anyone curious about how a robot works can open one up and find out.' },
    { icon: 'users', name: 'Mission', text: 'Make capable, honest robots at a price schools, families and students can say yes to.' },
    {
      icon: 'wrench',
      name: 'How we work',
      text: 'Open design by default. Every design file, wiring diagram and parts list is published, every part can be printed again or bought, and every owner can program their robot. The software that runs Gajju is free. We test in simulation before we print, and on the real robot before we sell.',
    },
  ],
};

export const LEARNING = {
  eyebrow: 'Build, program, teach',
  title: 'One project, every subject.',
  items: [
    { icon: 'wrench', name: 'Build', text: 'Students assemble it (mechanics) and wire it (electronics).' },
    { icon: 'code', name: 'Program', text: 'They program it (coding) through a documented command list with open example programs.' },
    { icon: 'brain-circuit', name: 'Teach', text: 'They train it (AI) with things from their own lives: spotting a visitor, playing gully cricket, counting cooker whistles.' },
  ],
  open:
    'We share the design and the AI tools so students can see how it is built, repair it and teach it new skills, the way Arduino and Raspberry Pi grew. Nothing is sealed: broken parts are printed again or replaced.',
  software: 'The software that runs Gajju is free to download; its source code is not published.',
};

export const NEONFLAKE = {
  title: 'About Neonflake',
  text: 'Neonflake AI Labs Pvt Ltd is the Hyderabad company behind Gajju. Neonflake builds IoT hardware, connected devices and software products. Gajju brings that together: hardware we design, software we write, and products we deliver.',
  next: "Gajju Mini is our first robot. We're also working on bigger Gajju robots for bigger jobs.",
};

export const CONTACT = {
  title: 'Contact',
  // The document gives "ello@getgajju.com", which looks like a typo for hello@; it is shown
  // as unconfirmed and not linked until the address is checked.
  general: { value: 'ello@getgajju.com', confirmed: false },
  schools: 'schools@getgajju.com',
  press: 'press@getgajju.com',
  address: [
    'Neonflake AI Labs Pvt Ltd',
    '303, 3rd Floor, Meridian Plaza',
    'Greenlands, Ameerpet',
    'Hyderabad, Telangana, India 500 016',
  ],
};

export const PRESS = {
  title: 'Press kit',
  text: 'One download with logo files, photos and renders, a one-page fact sheet, a founder photo and short bio, how to say "Gajju", and a press contact.',
  status: 'Files to be supplied',
  available: false, // true (with a download link) once the press kit files are supplied
};
