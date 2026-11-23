import { formatDuration } from '../../utils/format';

const percent = (part, whole) => `${(part / whole) * 100}%`;

export default function AgentList({ agents }) {
  if (agents.length === 0) return <div className="empty">Bu gün çağrı yapan temsilci yok.</div>;

  const busiest = Math.max(...agents.map((a) => a.incoming + a.outgoing));

  return (
    <ul className="list-unstyled mb-0">
      {agents.map((agent) => {
        const total = agent.incoming + agent.outgoing;
        return (
          <li key={agent.id} className="agent">
            <div className="agent-row">
              <span>{agent.name}</span>
              <span className="agent-total">{total} çağrı</span>
            </div>
            <div className="agent-bar" style={{ width: percent(total, busiest) }} aria-hidden="true">
              <span className="in" style={{ width: percent(agent.incoming, total) }} />
              <span className="out" style={{ width: percent(agent.outgoing, total) }} />
            </div>
            <div className="agent-meta">
              {agent.incoming} gelen, {agent.outgoing} giden, {formatDuration(agent.duration_sec)} görüşme
            </div>
          </li>
        );
      })}
    </ul>
  );
}
