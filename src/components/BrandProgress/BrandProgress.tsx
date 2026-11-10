import './BrandProgress.css';

/** UI kit progress bar with the "7 / 20" counter on the right. */
export default function BrandProgress({
  value,
  total,
  label,
}: {
  value: number;
  total: number;
  label: string;
}) {
  const percent = total > 0 ? Math.min(100, (value / total) * 100) : 0;

  return (
    <div className="brand-progress">
      <div
        className="brand-progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={value}
      >
        <div className="brand-progress__fill" style={{ width: `${percent}%` }} />
      </div>
      <span className="brand-progress__count" aria-hidden="true">
        {value} / {total}
      </span>
    </div>
  );
}
