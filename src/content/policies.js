// Privacy Policy and Terms of Use page content.
//
// ─── LEGAL STATUS: NOT LAWYER-APPROVED ──────────────────────────────────────────────────────────
// The content document (v4, "Policies pages") says: "A lawyer writes the final text of every
// policy" and "Privacy and Terms of use must be live on day one, because the sign-up form
// collects personal data". The text below is NOT that final text. It contains only:
//   • facts from the content document (the policy topics, the DPDP Act consent rule, the
//     licences and their "in short" summary from the Open source page, the trademark note and
//     the "own risk" line), and
//   • facts about this website that are true today (the forms are not connected to any
//     service, so nothing is sent or stored; see lib/forms.js).
// No legal wording has been invented: no warranties, indemnities, liability limits,
// governing law, retention periods, recipients, contact details or cookie statements.
//
// Outstanding before launch (replace the matching text when the lawyer's version arrives):
//   Privacy  — full purposes (incl. what WhatsApp number, city and role are used for); who can
//              access entries and which form service stores them; retention period; how to
//              request deletion (contact, steps, timing); cookies and analytics; final wording
//              of the children's section; confirm the policy covers the founding-application
//              fields (the content document's list names only name, email, phone, city, role).
//   Terms    — the general website terms; the terms for using the design files, example
//              programs and AI tools; final wording of the "own risk" line.
//   Also     — don't switch on a form service (lib/forms.js) before the approved Privacy
//              Policy is published; don't add a "last updated" or "approved" line until then.
// ─────────────────────────────────────────────────────────────────────────────────────────────

const COMPANY_LINE = 'Gajju is made by Neonflake AI Labs Pvt Ltd, Hyderabad.';

export const PRIVACY = {
  title: 'Privacy Policy',
  intro: [
    `${COMPANY_LINE} This page explains what the forms on this website ask for, and why.`,
    'The forms on this website are not switched on yet. Right now, nothing you type into them is sent or saved.',
  ],
  sections: [
    {
      id: 'information',
      title: 'Information we collect',
      blocks: [
        { p: 'When the forms on this website are switched on, the sign-up form will ask for:' },
        {
          list: [
            'Your name',
            'Your email address',
            'Your phone number for WhatsApp, if you choose to give it',
            'Your city',
            'Your role: parent, teacher, school, student, maker or other',
            'Which robots you are interested in: Gajju Mini, and the bigger Gajju (later)',
            'Your age confirmation: 18 or older, or under 18 with a parent or guardian agreeing',
          ],
        },
        { p: 'The founding teacher or maker application also asks for:' },
        {
          list: [
            'Your school, college or channel name',
            'A link to your work or channel, if you choose to give one',
            'What you would do with Gajju Mini',
          ],
        },
      ],
      // LEGAL: confirm the final policy covers every field above (see header).
    },
    {
      id: 'why',
      title: 'Why we collect this information',
      blocks: [
        {
          list: [
            'To email you when the first Gajju Minis can be reserved, and to write when there\'s news.',
            'To send you new build log posts by email, if you sign up on the Build log page.',
            'To read founding teacher and maker applications and reply by email.',
          ],
        },
      ],
      // LEGAL: full list of purposes, including the WhatsApp number, city and role.
    },
    {
      id: 'access',
      title: 'Who can access your information',
      blocks: [
        { p: 'The forms are not switched on, so no one receives information through them today.' },
        { p: 'Before they are switched on, we will set out here who can see what you send.' },
      ],
      // LEGAL: authorised people at Neonflake and any service provider (form tool not chosen).
    },
    {
      id: 'retention',
      title: 'How long we keep your information',
      blocks: [
        { p: 'We do not hold any form entries today, because the forms are not switched on.' },
        { p: 'Before they are switched on, we will set out here how long entries are kept.' },
      ],
      // LEGAL: retention period.
    },
    {
      id: 'deletion',
      title: 'Asking us to delete your information',
      blocks: [
        { p: 'You can leave the first-batch list any time.' },
        { p: 'Before the forms are switched on, we will set out here how to ask us to delete your information.' },
      ],
      // LEGAL: contact method, steps and timing. Do not publish an address until confirmed.
    },
    {
      id: 'cookies',
      title: 'Cookies and analytics',
      blocks: [{ p: 'We will set out here whether this website uses cookies or analytics, and what they record.' }],
      // LEGAL: cookie and analytics details (content document: prefer a cookie-free analytics tool).
    },
    {
      id: 'children',
      title: 'Children and parental consent',
      blocks: [
        {
          p: "If you are under 18, you can sign up only if your parent or guardian agrees. This is required under India's Digital Personal Data Protection Act, 2023.",
        },
        { p: 'That is why every form asks you to confirm your age before you send it.' },
      ],
      // LEGAL: lawyer to verify the final wording.
    },
  ],
};

export const TERMS = {
  title: 'Terms of Use',
  intro: [`${COMPANY_LINE} These terms cover this website and the Gajju files shared from it.`],
  sections: [
    {
      id: 'general',
      title: 'Using this website',
      blocks: [{ p: 'The full terms for using this website will be published on this page.' }],
      // LEGAL: general website terms, to be written by the lawyer.
    },
    {
      id: 'designs',
      title: 'Gajju design files',
      blocks: [
        {
          p: 'The 3D designs, wiring diagrams and parts list are being prepared for release. They will be shared under the CERN Open Hardware Licence (CERN-OHL-S 2.0).',
        },
        {
          p: 'In short: you can use, change and share them, even commercially, as long as you credit Gajju and share your changes under the same licence.',
        },
        {
          p: 'The licences cover the files, not the name. Gajju and the Gajju logo are trademarks of Neonflake AI Labs Pvt Ltd. You are welcome to say your robot is "based on Gajju"; please don\'t sell it as "Gajju".',
        },
      ],
      // LEGAL: terms for using the design files.
    },
    {
      id: 'examples',
      title: 'Example programs',
      blocks: [
        {
          p: 'The command list and example programs are being written. They will be shared under the Apache License 2.0.',
        },
        { p: 'In short: you can use, change and share them, even commercially, as long as you credit Gajju.' },
      ],
      // LEGAL: terms for using the example programs.
    },
    {
      id: 'ai-tools',
      title: 'AI tools',
      blocks: [
        {
          p: 'The trained AI models and the training and simulation tools are being prepared for release. They will be shared under the Apache License 2.0.',
        },
        { p: 'In short: you can use, change and share them, even commercially, as long as you credit Gajju.' },
      ],
      // LEGAL: terms for using the AI tools.
    },
    {
      id: 'changes',
      title: 'Changes you make',
      blocks: [{ quote: 'Changes owners make to the designs, example programs or AI tools are at their own risk.' }],
      // Documented principle (content document, "Terms of use"): keep this sentence exactly.
    },
  ],
  note: 'The full licence details will be published when the files are released.',
};
