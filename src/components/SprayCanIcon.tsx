type Props = { color: string; className?: string; label?: string };

/** Flat illustrated spray can (original drawing). */
export default function SprayCanIcon({ color, className, label = "ELD" }: Props) {
  return (
    <svg viewBox="0 0 120 260" className={className} aria-hidden="true" focusable="false">
      {/* nozzle */}
      <rect x="52" y="6" width="16" height="14" rx="3" fill="#f4f1ea" stroke="#0b0b0b" strokeWidth="4" />
      {/* cap */}
      <path d="M22 62 C22 30 98 30 98 62 Z" fill={color} stroke="#0b0b0b" strokeWidth="5" />
      <rect x="40" y="18" width="40" height="22" rx="6" fill={color} stroke="#0b0b0b" strokeWidth="5" />
      {/* body */}
      <rect x="14" y="60" width="92" height="190" rx="14" fill="#1b1b1b" stroke="#0b0b0b" strokeWidth="5" />
      <rect x="14" y="96" width="92" height="104" fill={color} stroke="#0b0b0b" strokeWidth="5" />
      <path d="M14 180 q12 14 24 0 t24 0 t24 0 t20 0 V200 H14Z" fill="#0b0b0b" opacity=".25" />
      <text
        x="60"
        y="158"
        textAnchor="middle"
        fontFamily="var(--ff-block)"
        fontSize="30"
        fill="#0b0b0b"
        transform="rotate(-8 60 150)"
      >
        {label}
      </text>
      {/* shine */}
      <rect x="26" y="70" width="8" height="170" rx="4" fill="#fff" opacity=".35" />
      <rect x="38" y="70" width="3" height="170" rx="2" fill="#fff" opacity=".2" />
    </svg>
  );
}
