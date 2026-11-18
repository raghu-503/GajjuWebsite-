// Founding teachers and makers programme. Source: content document v4, Home section 9 and the
// "Founding teacher or maker form" in Site-wide parts. Only what the document says is shown.
// Everything the document leaves open is listed in OPEN_QUESTIONS and shown (while pending text
// is visible) as "to be confirmed": nothing about benefits, selection, commitments, deadlines
// or the number of places is assumed.
//
// Entry points: the Home page "Apply" button (section 9) is the only one today. /founding is
// deliberately NOT in the header, footer or mobile menu (content document site map).
// Later: the /open-source page (published only when the GitHub repository is live) gets a main
// button "Apply as a founding maker" linking to /founding. Don't add that page before then.

export const FOUNDING_PAGE = {
  eyebrow: 'Founding teachers and makers',
  title: 'Apply to build the first Gajjus with us.',
  // Home section 9: "We are giving [20–25] Gajjus to teachers and makers who will build it first,
  // use it with students and tell us honestly what to fix."
  textBefore: 'We are giving',
  count: '20–25',
  countNote: 'number to be confirmed',
  textAfter: 'Gajjus to teachers and makers who will build it first, use it with students and tell us honestly what to fix.',
  formTitle: 'Your application',
};

/** What the document says founding teachers and makers do (Home section 9). */
export const WHAT_FOUNDERS_DO = [
  { icon: 'wrench', text: 'Build Gajju first.' },
  { icon: 'users', text: 'Use it with students.' },
  { icon: 'book-open-check', text: 'Tell us honestly what to fix.' },
];

/** Not in the content document yet; shown as "to be confirmed", never guessed. */
export const OPEN_QUESTIONS = [
  'How many places there are',
  'How applications are chosen',
  'What founding teachers and makers receive',
  'What we ask of you, and for how long',
  'When applications close',
];
