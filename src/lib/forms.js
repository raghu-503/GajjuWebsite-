// Sends form entries to the form service. The service isn't chosen yet ("[form tool / email list
// to decide]" in the content document), so until an endpoint is configured nothing is sent or
// stored, and callers must tell the visitor that honestly.
//
// To connect: set VITE_SIGNUP_ENDPOINT (an HTTPS URL that accepts a JSON POST) in .env.

const ENDPOINTS = {
  signup: import.meta.env.VITE_SIGNUP_ENDPOINT || null,
  founding: import.meta.env.VITE_FOUNDING_ENDPOINT || null, // founding teacher or maker applications
  schools: import.meta.env.VITE_SCHOOLS_ENDPOINT || null, // schools "Book a call" enquiries
};

export const isFormConnected = (kind) => !!ENDPOINTS[kind];

/**
 * @returns {Promise<{ status: 'sent' | 'not-connected' }>}  rejects if the service fails
 */
export async function submitForm(kind, data) {
  const url = ENDPOINTS[kind];
  if (!url) return { status: 'not-connected' };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ form: kind, ...data, page: window.location.pathname }),
  });
  if (!res.ok) throw new Error(`Form service responded ${res.status}`);
  return { status: 'sent' };
}
