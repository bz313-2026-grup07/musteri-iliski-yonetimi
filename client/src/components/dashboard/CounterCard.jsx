import { Link } from 'react-router-dom';

export default function CounterCard({ to, icon, tone, value, label }) {
  return (
    <Link to={to} className="counter">
      <span className={`counter-icon ${tone}`} aria-hidden="true"><i className={`bi bi-${icon}`} /></span>
      <span>
        <span className="counter-value d-block">{value}</span>
        <span className="counter-label">{label}</span>
      </span>
    </Link>
  );
}
