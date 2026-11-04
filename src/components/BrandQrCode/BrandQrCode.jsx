import qrcode from 'qrcode-generator';
import { useMemo } from 'react';
import './BrandQrCode.css';

const QUIET_ZONE = 1; // empty modules around the code (inside the tile)

/** Builds the QR code of `value`: an SVG path with one square per dark module. */
function buildQr(value) {
  const qr = qrcode(0, 'L'); // type 0: the smallest version that fits the text
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  let path = '';
  for (let row = 0; row < count; row += 1) {
    for (let column = 0; column < count; column += 1) {
      if (qr.isDark(row, column)) path += `M${column} ${row}h1v1h-1z`;
    }
  }
  return { count, path };
}

/**
 * Real, scannable QR code of the invite link: light squares on the violet tile (as in the
 * design). Most phone cameras read it; it is decoded in the tests with both colour orders.
 */
export default function BrandQrCode({ value }) {
  const { count, path } = useMemo(() => buildQr(value), [value]);
  const size = count + QUIET_ZONE * 2;

  return (
    <div className="brand-qr" role="img" aria-label={`QR code of the invite link ${value}`}>
      <svg
        className="brand-qr__svg"
        viewBox={`${-QUIET_ZONE} ${-QUIET_ZONE} ${size} ${size}`}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <path d={path} />
      </svg>
    </div>
  );
}
