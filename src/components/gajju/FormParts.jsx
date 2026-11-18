// Shared pieces for the Gajju forms (sign-up and founding application): labelled fields with
// inline errors, choice groups, the age check and privacy consent from the content document,
// and the status message. Nothing here sends data; see lib/forms.js.
import { forwardRef } from 'react';
import { LINKS } from '../../content/home.js';
import { Pending } from './Labels.jsx';

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Age check, required under India's Digital Personal Data Protection Act, 2023 (content document). */
export const AGE_OPTIONS = [
  { value: 'adult', label: 'I am 18 or older' },
  { value: 'minor-with-consent', label: 'I am under 18 and my parent or guardian agrees' },
];

/** Reads a trimmed value from a form control by name. */
export const valueOf = (form, name) => (form.elements.namedItem(name)?.value || '').trim();

/** Common checks: optional WhatsApp number, age and consent. Adds messages to `errors`. */
export function checkPhone(form, errors) {
  const phone = valueOf(form, 'whatsapp');
  if (phone && phone.replace(/\D/g, '').length < 10) errors.whatsapp = 'Please enter a full WhatsApp number, or leave it empty.';
}
export function checkAgeAndConsent(form, errors) {
  if (!form.querySelector('input[name="age"]:checked')) errors.age = 'Please confirm your age.';
  if (!form.elements.namedItem('consent').checked) errors.consent = 'Please agree to the Privacy Policy to continue.';
}

/**
 * Error wiring for one form: `describedBy(name)` for aria-describedby and `Err` to render the
 * message under the field.
 */
export function errorHelpers(id, errors) {
  const errId = (name) => id(`${name}-err`);
  return {
    describedBy: (name) => (errors[name] ? errId(name) : undefined),
    Err: ({ name }) =>
      errors[name] ? (
        <p className="gj-error" id={errId(name)}>
          {errors[name]}
        </p>
      ) : null,
  };
}

/** A labelled text input, select or textarea with its error. */
export const Field = forwardRef(function Field(
  { id, name, label, optional, hint, errors, as: Tag = 'input', children, ...props },
  ref,
) {
  const { describedBy, Err } = errorHelpers(id, errors);
  const hintId = hint ? id(`${name}-hint`) : undefined;
  return (
    <div className="gj-field">
      <label htmlFor={id(name)}>
        {label} {optional && <span className="gj-field__opt">(optional)</span>}
      </label>
      {hint && (
        <p className="gj-field__hint" id={hintId}>
          {hint}
        </p>
      )}
      <Tag
        ref={ref}
        className="gj-input"
        id={id(name)}
        name={name}
        required={!optional}
        aria-invalid={!!errors[name]}
        aria-describedby={[hintId, describedBy(name)].filter(Boolean).join(' ') || undefined}
        {...props}
      >
        {children}
      </Tag>
      <Err name={name} />
    </div>
  );
});

/** Checkbox or radio group with a legend and one error for the group. */
export function ChoiceGroup({ id, legend, type, name, options, errors }) {
  const { describedBy, Err } = errorHelpers(id, errors);
  return (
    <fieldset className="gj-fieldset" aria-describedby={describedBy(name)}>
      <legend>{legend}</legend>
      {options.map((o) => (
        <label className="gj-check" key={o.value}>
          <input type={type} name={name} value={o.value} />
          <span>{o.label}</span>
        </label>
      ))}
      <Err name={name} />
    </fieldset>
  );
}

/** "I agree to the Privacy Policy" (linked once the policy page exists). */
export function ConsentCheck({ id, errors }) {
  const { describedBy, Err } = errorHelpers(id, errors);
  return (
    <div className="gj-field">
      <label className="gj-check">
        <input type="checkbox" name="consent" value="yes" aria-invalid={!!errors.consent} aria-describedby={describedBy('consent')} />
        <span>
          I agree to the{' '}
          {LINKS.privacyPolicy ? (
            // Opens in a new tab so the visitor doesn't lose what they've typed. (The policy is not
            // lawyer-approved yet; see content/policies.js. The forms send nothing until it is.)
            <a href={LINKS.privacyPolicy} target="_blank" rel="noopener">
              Privacy Policy
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          ) : (
            <Pending note="page not published yet">Privacy Policy</Pending>
          )}
        </span>
      </label>
      <Err name="consent" />
    </div>
  );
}

/** Status message after submitting (not connected / failed). Receives focus when shown. */
export const FormMessage = forwardRef(function FormMessage({ state, notConnected, failed }, ref) {
  if (!state || state === 'sending' || state === 'sent') return null;
  const isFail = state === 'failed';
  return (
    <p className={`gj-form__msg ${isFail ? 'is-error' : 'is-info'}`} role={isFail ? 'alert' : 'status'} tabIndex={-1} ref={ref}>
      {isFail ? failed : notConnected}
    </p>
  );
});

/** Focus the first control whose name has an error. */
export function focusFirstError(form, errors) {
  const first = Object.keys(errors)[0];
  if (first) form.querySelector(`[name="${first}"]`)?.focus();
}
