// Terms of Use (/terms): draft until the lawyer-approved text is supplied.
import PolicyPage from '../components/gajju/PolicyPage.jsx';
import { TERMS } from '../content/policies.js';

export default function Terms() {
  return <PolicyPage policy={TERMS} path="/terms" />;
}
