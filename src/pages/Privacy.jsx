// Privacy Policy (/privacy): draft until the lawyer-approved text is supplied.
import PolicyPage from '../components/gajju/PolicyPage.jsx';
import { PRIVACY } from '../content/policies.js';

export default function Privacy() {
  return <PolicyPage policy={PRIVACY} path="/privacy" />;
}
