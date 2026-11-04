import './BrandInfoChip.css';

/** Read-only pill (same look as BrandChip) used to list the host's preferences. */
export default function BrandInfoChip({ children }) {
  return <span className="brand-info-chip">{children}</span>;
}
