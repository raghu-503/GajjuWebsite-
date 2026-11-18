// Schools form: "Book a call" (content document, Site-wide parts). Fields exactly as listed:
// name · school · city · role · classes you teach · number of students · 3D printer (yes/no) ·
// what would you like to do with Gajju Mini? · email · phone · privacy consent.
// No booking link exists ("[booking link]") and no form service is connected ("[form tool to
// decide]"), so after a valid submit the visitor is told plainly that nothing was sent or stored.
// The document's thank-you promises a reply "within [number] working days": that number is not
// confirmed, so the connected message makes no time promise.
import { useEffect, useId, useRef, useState } from 'react';
import { submitForm } from '../../lib/forms.js';
import { EMAIL, valueOf, Field, ChoiceGroup, ConsentCheck, FormMessage, focusFirstError } from './FormParts.jsx';

const ROLES = ['Teacher', 'Lab in-charge', 'Principal', 'Other'];
const PRINTER = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];
const PLAN_MAX = 2000;

const THANK_YOU = "Thank you. We'll contact you to set up a call.";
const NOT_CONNECTED =
  'Your enquiry has not been sent. This form is not connected yet, so nothing you entered was sent or stored. Please keep your answers and come back soon.';
const FAILED = "Sorry, that didn't go through. Please check your connection and try again.";

function validate(f) {
  const errors = {};
  if (!valueOf(f, 'name')) errors.name = 'Please enter your name.';
  if (!valueOf(f, 'school')) errors.school = 'Please enter your school name.';
  if (!valueOf(f, 'city')) errors.city = 'Please enter your city.';
  if (!valueOf(f, 'role')) errors.role = 'Please choose your role.';
  if (!valueOf(f, 'classes')) errors.classes = 'Please tell us which classes you teach.';
  const students = valueOf(f, 'students');
  if (!/^\d+$/.test(students) || Number(students) < 1) errors.students = 'Please enter the number of students, as a whole number.';
  if (!f.querySelector('input[name="printer"]:checked')) errors.printer = 'Please choose yes or no.';
  if (!valueOf(f, 'plan')) errors.plan = 'Please tell us what you would like to do with Gajju Mini.';
  if (!EMAIL.test(valueOf(f, 'email'))) errors.email = 'Please enter a valid email address.';
  if (valueOf(f, 'phone').replace(/\D/g, '').length < 10) errors.phone = 'Please enter a full phone number.';
  if (!f.elements.namedItem('consent').checked) errors.consent = 'Please agree to the Privacy Policy to continue.';
  return errors;
}

export default function SchoolsForm() {
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
      next = (await submitForm('schools', data)).status;
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
        All fields are required.
      </p>
      <div className="gj-form__row">
        <Field id={id} name="name" label="Name" errors={errors} type="text" autoComplete="name" />
        <Field id={id} name="school" label="School name" errors={errors} type="text" autoComplete="organization" />
      </div>
      <div className="gj-form__row">
        <Field id={id} name="city" label="City" errors={errors} type="text" autoComplete="address-level2" />
        <Field id={id} name="role" label="Your role" errors={errors} as="select" defaultValue="">
          <option value="" disabled>
            Choose one
          </option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Field>
      </div>
      <div className="gj-form__row">
        <Field id={id} name="classes" label="Classes you teach" errors={errors} type="text" placeholder="e.g. Class 6 to 8" />
        <Field id={id} name="students" label="Number of students" errors={errors} type="number" inputMode="numeric" min="1" step="1" />
      </div>
      <ChoiceGroup id={id} legend="Does your lab have a 3D printer?" type="radio" name="printer" options={PRINTER} errors={errors} />
      <Field
        id={id}
        name="plan"
        label="What would you like to do with Gajju Mini?"
        errors={errors}
        as="textarea"
        rows={5}
        maxLength={PLAN_MAX}
        hint={`${planLength} / ${PLAN_MAX} characters`}
      />
      <div className="gj-form__row">
        <Field id={id} name="email" label="Email" errors={errors} type="email" autoComplete="email" inputMode="email" />
        <Field id={id} name="phone" label="Phone" errors={errors} type="tel" autoComplete="tel" inputMode="tel" />
      </div>
      <ConsentCheck id={id} errors={errors} />

      <FormMessage state={state} notConnected={NOT_CONNECTED} failed={FAILED} ref={msgRef} />
      <button className="gj-btn gj-btn--primary" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending…' : 'Book a call'}
      </button>
    </form>
  );
}
