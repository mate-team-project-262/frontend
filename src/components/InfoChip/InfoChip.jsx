import './InfoChip.css';

/** Read-only pill used to list people and preferences. */
export default function InfoChip({ children }) {
  return <span className="info-chip">{children}</span>;
}
