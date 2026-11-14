import './AccountStats.css';

interface Props {
  /** up to three numbers with a caption each, e.g. { value: 12, label: 'sessions' } */
  items: { value: number; label: string }[];
}

/** The rounded strip of counters at the top of the Sessions and Session details pages. */
export default function AccountStats({ items }: Props) {
  return (
    <dl className="account-stats">
      {items.map(({ value, label }) => (
        <div key={label} className="account-stats__item">
          <dt className="account-stats__label">{label}</dt>
          <dd className="account-stats__value">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
