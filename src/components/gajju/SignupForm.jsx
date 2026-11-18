// "Join the first-batch list": the shared sign-up form (content document, "Site-wide parts").
// Fields, wording and the thank-you message come from the document. Entries go to the form
// service through lib/forms.js; until one is connected, nothing is sent or saved and the
// visitor is told so. The message is shown inline, never in a pop-up.
//
// `tags`: list tags for the entry (e.g. ['build-log'] on the Build log page, as the content
// document asks). They travel with the entry and are shown on the form as data-tags.
import { useEffect, useId, useRef, useState } from 'react';
import { submitForm } from '../../lib/forms.js';
import {
  EMAIL,
  AGE_OPTIONS,
  valueOf,
  checkPhone,
  checkAgeAndConsent,
  Field,
  ChoiceGroup,
  ConsentCheck,
  FormMessage,
  focusFirstError,
} from './FormParts.jsx';

const ROLES = ['Parent', 'Teacher', 'School', 'Student', 'Maker', 'Other'];
const INTERESTS = [
  { value: 'Gajju Mini', label: 'Gajju Mini' },
  { value: 'The bigger Gajju (later)', label: 'The bigger Gajju (later)' },
];
const THANK_YOU =
  "Thank you! You're on the list. We'll write when there's news, and we post every step of the build in the build log.";
const NOT_CONNECTED =
  "Thank you. Sign-ups aren't switched on yet, so your details have not been sent or saved. Please come back soon.";
const FAILED = "Sorry, that didn't go through. Please check your connection and try again.";

function validate(f) {
  const errors = {};
  if (!valueOf(f, 'name')) errors.name = 'Please enter your name.';
  if (!EMAIL.test(valueOf(f, 'email'))) errors.email = 'Please enter a valid email address.';
  checkPhone(f, errors);
  if (!valueOf(f, 'city')) errors.city = 'Please enter your city.';
  if (!valueOf(f, 'role')) errors.role = 'Please choose one.';
  if (!f.querySelectorAll('input[name="interest"]:checked').length) errors.interest = 'Please tick at least one.';
  checkAgeAndConsent(f, errors);
  if (errors.consent) errors.consent = 'Please agree to the Privacy Policy to join.';
  return errors;
}

export default function SignupForm({ tags = [] }) {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const formRef = useRef(null);
  const msgRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState(null); // null | 'sending' | 'sent' | 'not-connected' | 'failed'

  async function onSubmit(e) {
    e.preventDefault();
    const f = formRef.current;
    const found = validate(f);
    setErrors(found);
    if (Object.keys(found).length) {
      setState(null);
      focusFirstError(f, found);
      return;
    }
    const data = Object.fromEntries(new FormData(f));
    data.interest = [...f.querySelectorAll('input[name="interest"]:checked')].map((i) => i.value);
    data.consent = true;
    if (tags.length) data.tags = tags;
    setState('sending');
    let next;
    try {
      next = (await submitForm('signup', data)).status;
    } catch (error) {
      console.error(error);
      next = 'failed';
    }
    setState(next);
    if (next === 'sent') f.reset();
  }

  // Move focus to the result message once it has rendered, so screen readers announce it.
  useEffect(() => {
    if (state && state !== 'sending') msgRef.current?.focus();
  }, [state]);

  const onInput = (e) => {
    const name = e.target.name;
    if (errors[name]) setErrors(({ [name]: _, ...rest }) => rest);
  };

  if (state === 'sent') {
    return (
      <p className="gj-form__msg is-ok" role="status" tabIndex={-1} ref={msgRef}>
        {THANK_YOU}
      </p>
    );
  }

  return (
    <form
      className="gj-form"
      noValidate
      ref={formRef}
      onSubmit={onSubmit}
      onInput={onInput}
      onChange={onInput}
      data-tags={tags.join(' ') || undefined}
    >
      <div className="gj-form__row">
        <Field id={id} name="name" label="Name" errors={errors} type="text" autoComplete="name" />
        <Field id={id} name="email" label="Email" errors={errors} type="email" autoComplete="email" inputMode="email" />
      </div>
      <div className="gj-form__row">
        <Field id={id} name="whatsapp" label="WhatsApp number" optional errors={errors} type="tel" autoComplete="tel" inputMode="tel" />
        <Field id={id} name="city" label="City" errors={errors} type="text" autoComplete="address-level2" />
      </div>
      <Field id={id} name="role" label="I am a…" errors={errors} as="select" defaultValue="">
        <option value="" disabled>
          Choose one
        </option>
        {ROLES.map((r) => (
          <option key={r} value={r.toLowerCase()}>
            {r}
          </option>
        ))}
      </Field>
      <ChoiceGroup id={id} legend="I'm interested in" type="checkbox" name="interest" options={INTERESTS} errors={errors} />
      <ChoiceGroup id={id} legend="Age" type="radio" name="age" options={AGE_OPTIONS} errors={errors} />
      <ConsentCheck id={id} errors={errors} />

      <FormMessage state={state} notConnected={NOT_CONNECTED} failed={FAILED} ref={msgRef} />
      <button className="gj-btn gj-btn--primary" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Join the list'}
      </button>
    </form>
  );
}
