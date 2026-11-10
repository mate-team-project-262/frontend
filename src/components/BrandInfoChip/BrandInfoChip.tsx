import type { ReactNode } from 'react';
import './BrandInfoChip.css';

/** Read-only pill (same look as BrandChip) used to list the host's preferences. */
export default function BrandInfoChip({ children }: { children: ReactNode }) {
  return <span className="brand-info-chip">{children}</span>;
}
