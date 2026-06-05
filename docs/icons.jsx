/* global React */
// icons.jsx — simple line icons used throughout. Keep them tiny and consistent
// (24px viewBox, 1.7px stroke, round caps). They render as the *current text color*
// so each call site decides the tint via CSS.

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const Icon = {
  // 化学: a stylized flask
  flask: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M9 3h6" />
      <path d="M10 3v5l-4.5 9a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8V3" />
      <path d="M7.5 14h9" />
      <circle cx="10" cy="17" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="16" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  // 生物: leaf
  leaf: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M5 19c0-9 6-15 15-15 0 9-6 15-15 15Z" />
      <path d="M5 19 13 11" />
    </svg>
  ),
  // 地学: globe (earth)
  earth: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.5 3 2.5 14 0 17M12 3.5c-2.5 3-2.5 14 0 17" />
    </svg>
  ),
  // 授業予定: calendar
  calendar: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  ),
  // 基礎問題: pencil
  pencil: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="m4 20 1-4 11-11a2.121 2.121 0 0 1 3 3l-11 11-4 1Z" />
      <path d="m14 7 3 3" />
    </svg>
  ),
  // 記事: book
  book: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" />
      <path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z" />
    </svg>
  ),
  // シェア: paper plane / share
  share: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="m4 20 17-8L4 4l4 8-4 8Z" />
      <path d="m8 12 13 0" />
    </svg>
  ),
  // 点数報告: chart / target
  chart: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M4 20V8M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  // chevron right
  chevR: (s = 14) => (
    <svg width={s * (8/14)} height={s} viewBox="0 0 8 14" {...stroke}>
      <path d="m1 1 6 6-6 6" />
    </svg>
  ),
  // chevron left
  chevL: (s = 14) => (
    <svg width={s * (8/14)} height={s} viewBox="0 0 8 14" {...stroke}>
      <path d="M7 1 1 7l6 6" />
    </svg>
  ),
  // download
  download: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M12 4v12M6 11l6 6 6-6M4 20h16" />
    </svg>
  ),
  // play / video
  play: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m10 8.5 6 3.5-6 3.5v-7Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  // external link
  ext: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M14 4h6v6M20 4 10 14M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
    </svg>
  ),
  // search
  search: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  ),
  // alert
  alert: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M12 4 2.5 20h19L12 4Z" />
      <path d="M12 10v4M12 17v0.5" />
    </svg>
  ),
  // checkmark
  check: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="m4 12 5 5 11-11" />
    </svg>
  ),
  // person / user
  user: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </svg>
  ),
  // qr code glyph
  qr: (s = 20) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <path d="M6 6.5h1M17 6.5h1M6 17.5h1" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 14h3v3M21 14v0M17 21h4v-4M14 21h0" strokeLinecap="round" />
    </svg>
  ),
  // refresh / reload
  refresh: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M20 11a8 8 0 1 0-.7 3.7" />
      <path d="M20 4v5h-5" />
    </svg>
  ),
  // info
  info: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8v0.5" />
    </svg>
  ),
  // 成績推移: trending line with axis
  trend: (s = 22) => (
    <svg width={s} height={s} viewBox="0 0 24 24" {...stroke}>
      <path d="M4 4v15.5a.5.5 0 0 0 .5.5H20" />
      <path d="m7.5 15 3.5-4 3 2.5L20 7" />
      <path d="M20 7h-3.2M20 7v3.2" />
    </svg>
  ),
};

// Logo mark — the crab mascot (recolored to burnt orange so it matches the
// brand accent). We default to a small soft-sage rounded square that holds
// the orange crab cutout — sage + orange = the brand complementary pair.
function LogoMark({ size = 28, variant = 'badge' }) {
  if (variant === 'plain') {
    return (
      <img
        src="assets/crab-cutout-orange.png"
        width={size} height={size}
        style={{ display: 'block', objectFit: 'contain' }}
        alt="GV Science"
      />
    );
  }
  if (variant === 'app-icon') {
    return (
      <img
        src="assets/crab-orange.png"
        width={size} height={size}
        style={{ display: 'block', borderRadius: size * 0.22 }}
        alt="GV Science"
      />
    );
  }
  // Default 'badge': soft cream square holding the orange crab cutout.
  return (
    <div
      aria-hidden="true"
      style={{
        width: size, height: size,
        borderRadius: size * 0.27,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F4EFE6 100%)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(45,58,42,0.10)',
        border: '0.5px solid rgba(45,58,42,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden', flexShrink: 0,
      }}
    >
      <img
        src="assets/crab-cutout-orange.png"
        width={Math.round(size * 0.82)} height={Math.round(size * 0.82)}
        style={{ display: 'block', objectFit: 'contain' }}
        alt=""
      />
    </div>
  );
}

function Logo({ size = 28, variant }) {
  return (
    <div className="logo">
      <LogoMark size={size} variant={variant} />
      <div className="logo-word">GV <span className="sci">Science</span></div>
    </div>
  );
}

Object.assign(window, { Icon, Logo, LogoMark });
