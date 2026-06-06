function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};
const Icon = {
  flask: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M9 3h6"
  }), React.createElement("path", {
    d: "M10 3v5l-4.5 9a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8V3"
  }), React.createElement("path", {
    d: "M7.5 14h9"
  }), React.createElement("circle", {
    cx: "10",
    cy: "17",
    r: "0.6",
    fill: "currentColor",
    stroke: "none"
  }), React.createElement("circle", {
    cx: "13.5",
    cy: "16",
    r: "0.6",
    fill: "currentColor",
    stroke: "none"
  })),
  leaf: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M5 19c0-9 6-15 15-15 0 9-6 15-15 15Z"
  }), React.createElement("path", {
    d: "M5 19 13 11"
  })),
  earth: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "8.5"
  }), React.createElement("path", {
    d: "M3.5 12h17M12 3.5c2.5 3 2.5 14 0 17M12 3.5c-2.5 3-2.5 14 0 17"
  })),
  calendar: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("rect", {
    x: "3.5",
    y: "5",
    width: "17",
    height: "15",
    rx: "2.5"
  }), React.createElement("path", {
    d: "M3.5 9.5h17M8 3v4M16 3v4"
  })),
  pencil: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "m4 20 1-4 11-11a2.121 2.121 0 0 1 3 3l-11 11-4 1Z"
  }), React.createElement("path", {
    d: "m14 7 3 3"
  })),
  book: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"
  }), React.createElement("path", {
    d: "M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5Z"
  })),
  share: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "m4 20 17-8L4 4l4 8-4 8Z"
  }), React.createElement("path", {
    d: "m8 12 13 0"
  })),
  chart: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M4 20V8M10 20V4M16 20v-7M22 20H2"
  })),
  chevR: (s = 14) => React.createElement("svg", _extends({
    width: s * (8 / 14),
    height: s,
    viewBox: "0 0 8 14"
  }, stroke), React.createElement("path", {
    d: "m1 1 6 6-6 6"
  })),
  chevL: (s = 14) => React.createElement("svg", _extends({
    width: s * (8 / 14),
    height: s,
    viewBox: "0 0 8 14"
  }, stroke), React.createElement("path", {
    d: "M7 1 1 7l6 6"
  })),
  download: (s = 18) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M12 4v12M6 11l6 6 6-6M4 20h16"
  })),
  play: (s = 18) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "8.5"
  }), React.createElement("path", {
    d: "m10 8.5 6 3.5-6 3.5v-7Z",
    fill: "currentColor",
    stroke: "none"
  })),
  ext: (s = 14) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M14 4h6v6M20 4 10 14M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"
  })),
  search: (s = 16) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "6.5"
  }), React.createElement("path", {
    d: "m20 20-4.3-4.3"
  })),
  alert: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M12 4 2.5 20h19L12 4Z"
  }), React.createElement("path", {
    d: "M12 10v4M12 17v0.5"
  })),
  check: (s = 16) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "m4 12 5 5 11-11"
  })),
  user: (s = 20) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("circle", {
    cx: "12",
    cy: "8.5",
    r: "3.8"
  }), React.createElement("path", {
    d: "M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"
  })),
  qr: (s = 20) => React.createElement("svg", {
    width: s,
    height: s,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinejoin: "round"
  }, React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7",
    rx: "1.2"
  }), React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "7",
    rx: "1.2"
  }), React.createElement("rect", {
    x: "3",
    y: "14",
    width: "7",
    height: "7",
    rx: "1.2"
  }), React.createElement("path", {
    d: "M6 6.5h1M17 6.5h1M6 17.5h1",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }), React.createElement("path", {
    d: "M14 14h3v3M21 14v0M17 21h4v-4M14 21h0",
    strokeLinecap: "round"
  })),
  refresh: (s = 18) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M20 11a8 8 0 1 0-.7 3.7"
  }), React.createElement("path", {
    d: "M20 4v5h-5"
  })),
  info: (s = 16) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "8.5"
  }), React.createElement("path", {
    d: "M12 11v5M12 8v0.5"
  })),
  trend: (s = 22) => React.createElement("svg", _extends({
    width: s,
    height: s,
    viewBox: "0 0 24 24"
  }, stroke), React.createElement("path", {
    d: "M4 4v15.5a.5.5 0 0 0 .5.5H20"
  }), React.createElement("path", {
    d: "m7.5 15 3.5-4 3 2.5L20 7"
  }), React.createElement("path", {
    d: "M20 7h-3.2M20 7v3.2"
  }))
};
function CrabSVG({
  size = 22
}) {
  return React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    style: {
      display: 'block'
    },
    "aria-hidden": "true"
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "gvCrabGrad",
    x1: "0",
    y1: "0",
    x2: "0",
    y2: "1"
  }, React.createElement("stop", {
    offset: "0",
    stopColor: "#FF9A4E"
  }), React.createElement("stop", {
    offset: "1",
    stopColor: "#F26B1D"
  }))), React.createElement("g", {
    fill: "url(#gvCrabGrad)"
  }, React.createElement("path", {
    d: "M7.6 14.6 4.1 15.7 3.8 14.4 6.9 13.4Z"
  }), React.createElement("path", {
    d: "M7.7 16 4.6 17.7 4.1 16.6 6.9 15Z"
  }), React.createElement("path", {
    d: "M8 17.2 5.6 19.2 4.9 18.2 7.4 16.4Z"
  }), React.createElement("path", {
    d: "M16.4 14.6 19.9 15.7 20.2 14.4 17.1 13.4Z"
  }), React.createElement("path", {
    d: "M16.3 16 19.4 17.7 19.9 16.6 17.1 15Z"
  }), React.createElement("path", {
    d: "M16 17.2 18.4 19.2 19.1 18.2 16.6 16.4Z"
  }), React.createElement("path", {
    d: "M7.2 11.3C5.2 10.4 4 8.9 4.2 7.4",
    stroke: "url(#gvCrabGrad)",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    fill: "none"
  }), React.createElement("path", {
    d: "M16.8 11.3C18.8 10.4 20 8.9 19.8 7.4",
    stroke: "url(#gvCrabGrad)",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    fill: "none"
  }), React.createElement("path", {
    d: "M4.3 4.5c1.4-.2 2.6.8 2.7 2.2.05.9-.4 1.6-1.2 1.8.3-.55.05-1.25-.6-1.5.15.7-.25 1.35-.95 1.5-1 .2-2-.45-2.2-1.55-.2-1.1.6-2.2 2.25-2.45Z"
  }), React.createElement("path", {
    d: "M19.7 4.5c-1.4-.2-2.6.8-2.7 2.2-.05.9.4 1.6 1.2 1.8-.3-.55-.05-1.25.6-1.5-.15.7.25 1.35.95 1.5 1 .2 2-.45 2.2-1.55.2-1.1-.6-2.2-2.25-2.45Z"
  }), React.createElement("path", {
    d: "M5.5 13.1c0-3.4 2.8-5.4 6.5-5.4s6.5 2 6.5 5.4c0 2.7-2.9 4.6-6.5 4.6s-6.5-1.9-6.5-4.6Z"
  })), React.createElement("circle", {
    cx: "9.9",
    cy: "11.3",
    r: "1.05",
    fill: "#73340F"
  }), React.createElement("circle", {
    cx: "14.1",
    cy: "11.3",
    r: "1.05",
    fill: "#73340F"
  }), React.createElement("circle", {
    cx: "9.6",
    cy: "11.0",
    r: "0.34",
    fill: "#fff"
  }), React.createElement("circle", {
    cx: "13.8",
    cy: "11.0",
    r: "0.34",
    fill: "#fff"
  }));
}
const CRAB_PNG = 'assets/crab-cutout-orange.png';
function CrabImg({
  size,
  round = 0
}) {
  const [failed, setFailed] = React.useState(false);
  if (failed) return React.createElement(CrabSVG, {
    size: size
  });
  return React.createElement("img", {
    src: CRAB_PNG,
    width: size,
    height: size,
    onError: () => setFailed(true),
    style: {
      display: 'block',
      objectFit: 'contain',
      borderRadius: round || undefined
    },
    alt: ""
  });
}
function LogoMark({
  size = 28,
  variant = 'badge'
}) {
  if (variant === 'plain') {
    return React.createElement(CrabImg, {
      size: size
    });
  }
  if (variant === 'app-icon') {
    return React.createElement("div", {
      "aria-hidden": "true",
      style: {
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: 'linear-gradient(135deg, #FFFFFF 0%, #F4EFE6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0
      }
    }, React.createElement(CrabImg, {
      size: Math.round(size * 0.82)
    }));
  }
  return React.createElement("div", {
    "aria-hidden": "true",
    style: {
      width: size,
      height: size,
      borderRadius: size * 0.27,
      background: 'linear-gradient(135deg, #FFFFFF 0%, #F4EFE6 100%)',
      boxShadow: '0 1px 0 rgba(255,255,255,0.7) inset, 0 1px 2px rgba(45,58,42,0.10)',
      border: '0.5px solid rgba(45,58,42,0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      flexShrink: 0
    }
  }, React.createElement(CrabImg, {
    size: Math.round(size * 0.82)
  }));
}
function Logo({
  size = 28,
  variant
}) {
  return React.createElement("div", {
    className: "logo"
  }, React.createElement(LogoMark, {
    size: size,
    variant: variant
  }), React.createElement("div", {
    className: "logo-word"
  }, "GV ", React.createElement("span", {
    className: "sci"
  }, "Science")));
}
Object.assign(window, {
  Icon,
  Logo,
  LogoMark
});