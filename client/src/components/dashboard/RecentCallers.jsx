import { Link } from 'react-router-dom';
import { formatTime } from '../../utils/format';

function DirectionChip({ direction }) {
  const inbound = direction === 'gelen';
  return (
    <span className={`chip ${inbound ? 'chip-in' : 'chip-out'}`}>
      <i className={`bi bi-telephone-${inbound ? 'inbound' : 'outbound'}`} aria-hidden="true" />
      {inbound ? 'Gelen' : 'Giden'}
    </span>
  );
}

export default function RecentCallers({ callers }) {
  if (callers.length === 0) return <div className="empty">Bu gün için kayıtlı çağrı yok.</div>;

  return (
    <div className="table-responsive">
      <table className="table align-middle">
        <thead>
          <tr>
            <th scope="col">Müşteri</th>
            <th scope="col">Son çağrı</th>
            <th scope="col">Yön</th>
            <th scope="col" className="text-end">Çağrı</th>
            <th scope="col">Temsilci</th>
          </tr>
        </thead>
        <tbody>
          {callers.map((caller) => (
            <tr key={caller.id}>
              <td>
                <Link to={`/musteriler/${caller.id}`} className="fw-medium">{caller.name}</Link>
                {caller.company && <div className="small text-body-secondary">{caller.company}</div>}
              </td>
              <td>{formatTime(caller.last_call_at)}</td>
              <td><DirectionChip direction={caller.last_direction} /></td>
              <td className="text-end">{caller.calls}</td>
              <td>{caller.last_agent}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
