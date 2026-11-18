// Founding teacher or maker application (content document, "Site-wide parts": "Apply").
// Fields exactly as the document lists them. The form service isn't chosen yet, so nothing is
// sent or stored: after a valid submit the visitor is told plainly that the application has NOT
// been submitted. The document's thank-you message is shown only once a service is connected.
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

const ROLES = ['Teacher', 'Atal Tinkering Lab in-charge', 'Maker', 'Student', 'Other'];
const PLAN_MAX = 2000; // a practical limit for a long answer, not a requirement from the document

const THANK_YOU = "Thank you for applying. We'll read every application and reply by email.";
const NOT_CONNECTED =
  "Your application has not been submitted. The application form isn't connected yet, so nothing you entered was sent or saved. Please keep your answers and come back soon.";
const FAILED = "Sorry, that didn't go through. Please check your connection and try again.";

/** Accepts "example.com/me" or "https://example.com/me". */
function isWebLink(value) {
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `https://${value}`);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
}

function validate(f) {
  const errors = {};
  if (!valueOf(f, 'name')) errors.name = 'Please enter your name.';
  if (!EMAIL.test(valueOf(f, 'email'))) errors.email = 'Please enter a valid email address.';
  checkPhone(f, errors);
  if (!valueOf(f, 'city')) errors.city = 'Please enter your city.';
  if (!valueOf(f, 'role')) errors.role = 'Please choose one.';
  if (!valueOf(f, 'organisation')) errors.organisation = 'Please enter your school, college or channel name.';
  const link = valueOf(f, 'link');
  if (link && !isWebLink(link)) errors.link = 'Please enter a web address, like youtube.com/@yourchannel, or leave it empty.';
  if (!valueOf(f, 'plan')) errors.plan = 'Please tell us what you would do with Gajju Mini.';
  checkAgeAndConsent(f, errors);
  return errors;
}

export default function FoundingForm() {
  const uid = useId();
  const id = (name) => `${uid}-${name}`;
  const formRef = useRef(null);
  const msgRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState(null); // null | 'sending' | 'sent' | 'not-connected' | 'failed'
  const [planLength, setPlanLength] = useState(0);

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
    data.consent = true;
    setState('sending');
    let next;
    try {
      next = (await submitForm('founding', data)).status;
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
    if (name === 'plan') setPlanLength(e.target.value.length);
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
    <form className="gj-form" noValidate ref={formRef} onSubmit={onSubmit} onInput={onInput} onChange={onInput} aria-describedby={id('required-note')}>
      <p className="gj-caption" id={id('required-note')}>
        All fields are required unless marked optional.
      </p>
      <div className="gj-form__row">
        <Field id={id} name="name" label="Name" errors={errors} type="text" autoComplete="name" />
        <Field id={id} name="email" label="Email" errors={errors} type="email" autoComplete="email" inputMode="email" />
      </div>
      <div className="gj-form__row">
        <Field id={id} name="whatsapp" label="WhatsApp number" optional errors={errors} type="tel" autoComplete="tel" inputMode="tel" />
        <Field id={id} name="city" label="City" errors={errors} type="text" autoComplete="address-level2" />
      </div>
      <div className="gj-form__row">
        <Field id={id} name="role" label="I am a…" errors={errors} as="select" defaultValue="">
          <option value="" disabled>
            Choose one
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Field>
        <Field id={id} name="organisation" label="School, college or channel name" errors={errors} type="text" autoComplete="organization" />
      </div>
      <Field
        id={id}
        name="link"
        label="Link to your work or channel"
        optional
        errors={errors}
        type="url"
        inputMode="url"
        autoComplete="url"
        placeholder="e.g. youtube.com/@yourchannel"
      />
      <Field
        id={id}
        name="plan"
        label="What would you do with Gajju Mini?"
        errors={errors}
        as="textarea"
        rows={6}
        maxLength={PLAN_MAX}
        hint={`${planLength} / ${PLAN_MAX} characters`}
      />
      <ChoiceGroup id={id} legend="Age" type="radio" name="age" options={AGE_OPTIONS} errors={errors} />
      <ConsentCheck id={id} errors={errors} />

      <FormMessage state={state} notConnected={NOT_CONNECTED} failed={FAILED} ref={msgRef} />
      <button className="gj-btn gj-btn--primary" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Send my application'}
      </button>
    </form>
  );
}
