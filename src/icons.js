// The game's icon set: small inked drawings in the same style as the 3D models (a dark
// outline, flat colours, one highlight). Every emoji in the game's text is swapped for one of
// these as it appears on screen, so data files can keep using emoji as shorthand.

const K = '#2a1d14';                       // ink
const S = `stroke="${K}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"`;
const line = (d, color, w = 1.8) => `<path d="${d}" fill="none" stroke="${K}" stroke-width="${w + 1.7}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shine = (d, w = 1.1) => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="${w}" stroke-linecap="round"/>`;
const rays = (n, r0, r1, color) => {
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    d += `M${(12 + Math.cos(a) * r0).toFixed(2)} ${(12 + Math.sin(a) * r0).toFixed(2)}L${(12 + Math.cos(a) * r1).toFixed(2)} ${(12 + Math.sin(a) * r1).toFixed(2)}`;
  }
  return line(d, color, 1.6);
};
const star = (n, r0, r1, rot = -Math.PI / 2, cx = 12, cy = 12) => {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r1 : r0;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(2)},${(cy + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
};
const gearPts = () => {
  const pts = [];
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2, r = [9, 9, 7, 7][i % 4];
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)},${(12 + Math.sin(a) * r).toFixed(2)}`);
  }
  return pts.join(' ');
};
const snowArm = '<path d="M12 12V3.4M12 6.8 9.7 4.6M12 6.8l2.3-2.2M12 9.6l-1.6-1.5M12 9.6l1.6-1.5"/>';
const snowArms = [0, 60, 120, 180, 240, 300].map(a => `<g transform="rotate(${a} 12 12)">${snowArm}</g>`).join('');

export const ICONS = {
  coin: `<circle cx="12" cy="12" r="8.6" fill="#e3b04b" ${S}/><circle cx="12" cy="12" r="5.9" fill="#d19a35" stroke="#9a6a1c" stroke-width="1"/><path d="M12 8.2v7.6M9.8 9.8h4.4M9.8 14.2h4.4" stroke="#8a5a14" stroke-width="1.4" stroke-linecap="round"/>${shine('M6.4 9.4a6.3 6.3 0 0 1 3.8-3.5')}`,
  token: `<circle cx="12" cy="12" r="8.6" fill="#b8703c" ${S}/><circle cx="12" cy="12" r="5.9" fill="#a05f30" stroke="#6e3c18" stroke-width="1"/><path d="M9 9l6 6M15 9l-6 6" stroke="#f2d49a" stroke-width="1.5" stroke-linecap="round"/>${shine('M6.4 9.4a6.3 6.3 0 0 1 3.8-3.5')}`,
  skull: `<path d="M12 3.4c-4.4 0-7.6 3-7.6 7 0 2.4 1.1 4 2.6 5v2.9c0 .7.5 1.2 1.2 1.2h7.6c.7 0 1.2-.5 1.2-1.2v-2.9c1.5-1 2.6-2.6 2.6-5 0-4-3.2-7-7.6-7z" fill="#efe6d2" ${S}/><path d="M7.7 11.3c0-1.2 1-1.9 2.1-1.9s1.6.9 1.6 1.9-.8 1.8-1.9 1.8-1.8-.7-1.8-1.8zM16.3 11.3c0-1.2-1-1.9-2.1-1.9s-1.6.9-1.6 1.9.8 1.8 1.9 1.8 1.8-.7 1.8-1.8zM12 13.4l-1 1.8h2z" fill="${K}"/><path d="M10 17.6v1.8M12 17.6v1.8M14 17.6v1.8" stroke="${K}" stroke-width="1.1"/>`,
  dragon: `<path d="M9.6 8.6 10.6 3.2l2 5.2z" fill="#8f2f22" ${S}/><path d="M3 20.6C3.4 16 5 12.4 8 10L6.6 3.6l4 4.6c2.4-1 5.4-.8 7.8.8l3 1.4-.8 1.6-3.2.4 3.6 2c-3.2 1.2-6.4 1-8.4-.2-1 3-3.2 5.2-5.8 6.6z" fill="#b8412e" ${S}/><path d="M18.4 12.4l-.5 1M16.6 12.6l-.4 1.1" stroke="#fff" stroke-width=".9" stroke-linecap="round"/><path d="M5.2 16.4l-2-.4M6.4 13.6l-1.8-.8" stroke="${K}" stroke-width="1.2" stroke-linecap="round"/><path d="M11.8 9.6c1-.6 2.4-.8 3.4-.4" stroke="${K}" stroke-width="1.1" fill="none" stroke-linecap="round"/><circle cx="13.8" cy="10.8" r="1.1" fill="#ffd23d" stroke="${K}" stroke-width=".8"/>`,
  spiral: `<circle cx="12" cy="12" r="9" fill="#4a3a78" ${S}/><path d="M12.6 12.3c-.6.5-1.6.2-1.7-.7-.2-1.3 1.2-2.2 2.4-1.9 1.9.4 2.5 2.7 1.6 4.2-1.3 2.1-4.4 2.2-6 .6-2.2-2.2-1.7-6 .8-7.6 3-1.9 7.2-.6 8.5 2.6" fill="none" stroke="#d9c8ff" stroke-width="1.6" stroke-linecap="round"/>`,
  orb: `<path d="M7.2 17.2h9.6l1.4 3.3H5.8z" fill="#8a5a2b" ${S}/><circle cx="12" cy="10.4" r="6.8" fill="#7cc6dc" ${S}/><circle cx="12" cy="10.4" r="3.6" fill="#b8e6f2" opacity=".6"/>${shine('M8.2 8.2a4.8 4.8 0 0 1 3-2.6', 1.3)}`,
  chest: `<rect x="3.5" y="10" width="17" height="9.8" rx="1" fill="#95592b" ${S}/><path d="M3.5 10.6V9c0-2.5 2.5-4.5 5-4.5h7c2.5 0 5 2 5 4.5v1.6z" fill="#b8763a" ${S}/><path d="M8 4.8v15M16 4.8v15" stroke="#d8a94c" stroke-width="1.7"/><rect x="10.4" y="9.4" width="3.2" height="3.8" rx=".6" fill="#e3b04b" ${S}/>`,
  shield: `<path d="M12 3l7.6 2.7v5.6c0 4.8-3.2 8.3-7.6 9.9-4.4-1.6-7.6-5.1-7.6-9.9V5.7z" fill="#4f6f9a" ${S}/><path d="M12 5.4v14.2M6.8 10.6h10.4" stroke="#e3b04b" stroke-width="1.6"/>${shine('M7 7.2l3-1')}`,
  potion: `<rect x="9.6" y="2.2" width="4.8" height="2.3" rx=".7" fill="#9a6a3a" ${S}/><path d="M10.2 4.5v4.8C7.2 10.3 5 12.9 5 15.9 5 19.3 8.1 21.6 12 21.6s7-2.3 7-5.7c0-3-2.2-5.6-5.2-6.6V4.5z" fill="#dcecef" ${S}/><path d="M5.5 15c1.8-.9 4.1-.4 6.5.4 2.4.8 4.6.9 6.5-.1.4 3.4-2.8 5.8-6.5 5.8S5.1 18.5 5.5 15z" fill="#cf4238"/><circle cx="14.2" cy="17.4" r=".8" fill="#ff9a8a"/>${shine('M8 12.7c.6-.9 1.4-1.5 2.3-1.9')}`,
  swords: `<path d="M4 4l2.6.3 9.9 9.9-2.3 2.3-9.9-9.9zM20 4l-.3 2.6-9.9 9.9-2.3-2.3 9.9-9.9z" fill="#d6dde6" ${S}/>${line('M13.6 18.8l5.2-5.2M10.4 18.8 5.2 13.6', '#d8a94c', 1.6)}${line('M17.2 17.2 19.8 19.8M6.8 17.2 4.2 19.8', '#7a4a22', 2)}`,
  star: `<polygon points="${star(5, 9.6, 4.2)}" fill="#f0c04a" ${S}/><polygon points="${star(5, 5.2, 2.3)}" fill="#ffe28e"/>`,
  sparkle: `<path d="M11 3c.9 5 3 7.1 8.2 8-5.2.9-7.3 3-8.2 8-.9-5-3-7.1-8.2-8 5.2-.9 7.3-3 8.2-8z" fill="#ffe28e" ${S}/><path d="M19 13.8l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z" fill="#fff" stroke="${K}" stroke-width=".9" stroke-linejoin="round"/>`,
  block: `<path d="M12 3.4l8.2 4.1-8.2 4.1-8.2-4.1z" fill="#cf9460" ${S}/><path d="M3.8 7.5v9.2l8.2 4.1v-9.2z" fill="#9a6236" ${S}/><path d="M20.2 7.5v9.2L12 20.8v-9.2z" fill="#7c4a28" ${S}/><path d="M6 12.4l4 2M14 14.4l4-2M8 9.3l4 2" stroke="${K}" stroke-width=".8" opacity=".5"/>`,
  trophy: `<path d="M7 5.4H4.4c0 2.7 1.4 4.1 3.1 4.5M17 5.4h2.6c0 2.7-1.4 4.1-3.1 4.5" fill="none" ${S}/><path d="M7 3.8h10v4.8c0 3-2.2 5.4-5 5.4s-5-2.4-5-5.4z" fill="#e3b04b" ${S}/><rect x="10.8" y="13.8" width="2.4" height="3.4" fill="#c9962f" ${S}/><rect x="7.5" y="17.2" width="9" height="3.3" rx=".6" fill="#7a4a22" ${S}/>${shine('M9.3 5.8v2.6')}`,
  scroll: `<rect x="6" y="5" width="12" height="14" fill="#efe0bd" ${S}/><rect x="4.4" y="2.9" width="15.2" height="3.6" rx="1.8" fill="#d8c197" ${S}/><rect x="4.4" y="17.5" width="15.2" height="3.6" rx="1.8" fill="#d8c197" ${S}/><path d="M8.5 9.6h7M8.5 12.1h7M8.5 14.6h4.4" stroke="#8a6a44" stroke-width="1.1" stroke-linecap="round"/>`,
  flame: `<path d="M12 2.4c.6 3-1.8 4.6-3.2 6.6-1.3 1.8-2.3 3.6-2.3 5.9 0 3.6 2.6 6.6 5.5 6.6s5.5-2.7 5.5-6.4c0-2.2-1-3.8-2-5 .1 1.4-.4 2.6-1.4 3.2.5-3.8-.6-8.4-2.1-10.9z" fill="#e2582a" ${S}/><path d="M12 21.4c-1.8 0-3-1.5-3-3.3 0-1.9 1.4-3 2.2-4.4.4 1.2 1.2 1.7 2 1.9.3-.9.2-1.9-.1-2.7 1.3 1 2 2.6 2 4.4 0 2.3-1.3 4.1-3.1 4.1z" fill="#ffc94a"/>`,
  rock: `<path d="M3.4 16.6l2.6-7.1 5-3.5 6 1.5 3.6 5.6-1.6 5.5-7 2-6.1-1.5z" fill="#8d8a92" ${S}/><path d="M6 9.5l4.6 3.5 5.5-1.3 4.5 1.3M10.6 13l.5 8" stroke="${K}" stroke-width="1" fill="none" stroke-linejoin="round"/><circle cx="14.3" cy="15.4" r="1.1" fill="#e3b04b"/><circle cx="7.8" cy="15.7" r=".8" fill="#e3b04b"/><circle cx="16.6" cy="9.4" r=".7" fill="#e3b04b"/>`,
  log: `<path d="M6.5 8h11c1.9 0 3.5 2.2 3.5 5s-1.6 5-3.5 5h-11z" fill="#8a5a30" ${S}/><ellipse cx="6.5" cy="13" rx="3.5" ry="5" fill="#dcb47c" ${S}/><ellipse cx="6.5" cy="13" rx="2" ry="3" fill="none" stroke="#a57a45"/><circle cx="6.5" cy="13" r=".7" fill="#a57a45"/><path d="M10.5 10.3h5M12 15.6h6M10 13h2.5" stroke="#5e3b1c" stroke-width="1.1" stroke-linecap="round"/>`,
  tree: `<path d="M12 2.8l6 7.2h-2.6l4.2 5.4H4.4l4.2-5.4H6z" fill="#4f8a3a" ${S}/><rect x="10.8" y="15.4" width="2.4" height="5.4" fill="#7a4a22" ${S}/><path d="M9 9.8l3-3.4" stroke="#8fc46a" stroke-width="1.1" stroke-linecap="round"/>`,
  snowflake: `<g stroke="${K}" stroke-width="3.6" stroke-linecap="round" fill="none">${snowArms}</g><g stroke="#cdeeff" stroke-width="1.7" stroke-linecap="round" fill="none">${snowArms}</g>`,
  bolt: `<path d="M13.6 2.4 5.4 13.6h5.1l-2 8 9.1-11.7h-5.3l2.3-7.5z" fill="#ffd23d" ${S}/>${shine('M12.1 5.2l-3.3 4.6')}`,
  paw: `<path d="M12 12.5c-2.8 0-5.2 2.6-5.2 5 0 1.8 1.4 2.8 3 2.8 1 0 1.5-.5 2.2-.5s1.2.5 2.2.5c1.6 0 3-1 3-2.8 0-2.4-2.4-5-5.2-5z" fill="#8a5a30" ${S}/><ellipse cx="6.6" cy="10" rx="1.7" ry="2.2" transform="rotate(-25 6.6 10)" fill="#8a5a30" ${S}/><ellipse cx="10" cy="6.6" rx="1.7" ry="2.3" fill="#8a5a30" ${S}/><ellipse cx="14" cy="6.6" rx="1.7" ry="2.3" fill="#8a5a30" ${S}/><ellipse cx="17.4" cy="10" rx="1.7" ry="2.2" transform="rotate(25 17.4 10)" fill="#8a5a30" ${S}/>`,
  fish: `<path d="M21.2 12c-2.2-3.2-5.3-5-8.7-5-3.4 0-6 2-7.5 4.1L2.6 8.5v7l2.4-2.6C6.5 15 9.1 17 12.5 17c3.4 0 6.5-1.8 8.7-5z" fill="#6ea6c6" ${S}/><path d="M14.6 9.2c-.9 1.8-.9 3.8 0 5.6" stroke="${K}" stroke-width="1" fill="none"/><circle cx="17.4" cy="11" r="1" fill="${K}"/>${shine('M9 9.4c1.3-.7 2.7-1 4-1')}`,
  pickaxe: `${line('M11.8 7.8 19.8 20', '#7a4a22', 2)}<path d="M3.6 9.6C6.4 5.2 12 3.2 17.2 4.4c1.4.3 2.6 1 3.4 1.9-5-.6-9.8 1.1-13.2 4.8z" fill="#b9c2cc" ${S}/>`,
  axe: `${line('M5 21 15.4 4.6', '#7a4a22', 2)}<path d="M12.2 9.6 14.8 5.4l5.6 1.6c1.5 2.2 1.3 5.3-.9 7.1z" fill="#b9c2cc" ${S}/><path d="M19.6 7.4c.9 1.7.8 3.8-.5 5.2" stroke="#fff" stroke-opacity=".7" stroke-width="1" fill="none" stroke-linecap="round"/>`,
  food: `<path d="M9 7.8c-.8-1 .8-2 0-3.2M12 7.3c-.8-1 .8-2 0-3.2M15 7.8c-.8-1 .8-2 0-3.2" stroke="#efe6d2" stroke-width="1.2" stroke-linecap="round" fill="none"/><path d="M3.5 11.5h17c0 4.6-3.8 8.3-8.5 8.3s-8.5-3.7-8.5-8.3z" fill="#8a5a30" ${S}/><ellipse cx="12" cy="11.5" rx="8.5" ry="1.9" fill="#d98a3a" ${S}/><circle cx="9.4" cy="11.3" r=".8" fill="#6ea64a"/><circle cx="13.6" cy="11.6" r=".8" fill="#c0392b"/>`,
  moon: `<path d="M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 0 1 15.5 3.2z" fill="#f0dd9a" ${S}/><circle cx="9" cy="14.5" r="1.3" fill="#d8c27a"/><circle cx="12.5" cy="18.2" r=".9" fill="#d8c27a"/>`,
  target: `<circle cx="12" cy="12" r="9" fill="#efe6d2" ${S}/><circle cx="12" cy="12" r="6.1" fill="#c0392b" ${S}/><circle cx="12" cy="12" r="3.2" fill="#efe6d2" ${S}/><circle cx="12" cy="12" r="1.1" fill="${K}"/>`,
  heart: `<path d="M12 20.6S3.4 15.2 3.4 9.2C3.4 6.3 5.6 4 8.4 4c1.6 0 2.9.8 3.6 2 .7-1.2 2-2 3.6-2 2.8 0 5 2.3 5 5.2 0 6-8.6 11.4-8.6 11.4z" fill="#d2433a" ${S}/>${shine('M6.8 7.4c-.8.5-1.3 1.3-1.4 2.3')}`,
  horse: `<path d="M16.4 3.4l-1 2.3C11.6 6.5 8.4 9.2 6.2 12.8L4 16.4c-.4.7-.1 1.5.6 1.8l1.6.6c.6.2 1.2 0 1.6-.5l1.8-2.3c1.2.4 2.5.2 3.6-.4l.8 5.9H19c.9-4.5 1.6-9.5.2-13.8l.8-3.5-2 1.4z" fill="#b07a45" ${S}/><path d="M16 6c1.8 1.3 2.8 3.6 3.2 6.2" stroke="#5e3b1c" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="12.8" cy="9.8" r=".9" fill="${K}"/>`,
  gem: `<path d="M7 4h10l4.5 5.5L12 21 2.5 9.5z" fill="#48b0d2" ${S}/><path d="M2.5 9.5h19M9.5 9.5 12 21l2.5-11.5M7 4l2.5 5.5L12 4l2.5 5.5L17 4" fill="none" stroke="#1d5e75" stroke-width=".9" stroke-linejoin="round"/><path d="M8 5l1.2 3.2" stroke="#fff" stroke-opacity=".8" stroke-width="1" stroke-linecap="round"/>`,
  pack: `<path d="M10 4.2V2.8h4v1.4" fill="none" ${S}/><path d="M5.8 8.6c0-2.5 2-4.6 4.6-4.6h3.2c2.6 0 4.6 2.1 4.6 4.6V19c0 1.1-.9 2-2 2H7.8c-1.1 0-2-.9-2-2z" fill="#8a5a30" ${S}/><path d="M5.8 9.6c0-2 2.7-3.6 6.2-3.6s6.2 1.6 6.2 3.6v2.6H5.8z" fill="#a8703c" ${S}/><rect x="8.4" y="14.2" width="7.2" height="4.6" rx="1" fill="#6e4524" ${S}/><rect x="10.9" y="11.2" width="2.2" height="2.4" rx=".4" fill="#e3b04b" stroke="${K}" stroke-width=".8"/>`,
  pouch: `<path d="M9 6.2c-.6-1.2-1.6-2-2.8-2.4 1.8-.8 3.8-.5 5.8.6 2-1.1 4-1.4 5.8-.6-1.2.4-2.2 1.2-2.8 2.4z" fill="#a8703c" ${S}/><path d="M9 6.2h6c3.4 2.2 5.5 5.6 5.5 9 0 3.4-3.2 5.6-8.5 5.6s-8.5-2.2-8.5-5.6c0-3.4 2.1-6.8 5.5-9z" fill="#8a5a30" ${S}/><path d="M8.6 7.4c2.2.7 4.6.7 6.8 0" stroke="#e3b04b" stroke-width="1.4" fill="none" stroke-linecap="round"/><circle cx="12" cy="8" r="1" fill="#e3b04b" stroke="${K}" stroke-width=".7"/>${shine('M7 13.4c.3-1.4 1-2.6 2-3.6')}`,
  leaf: `<path d="M4.8 19.2C3.9 11 9 4.4 20.2 3.8c.3 9.6-5.6 15.7-15.4 15.4z" fill="#62a24a" ${S}/><path d="M4.8 19.2c3-4.5 7-8.8 12.2-12.2M9.6 14.3l-.3-3.6M12.5 11.6l3.4.2M11.2 13l-.2-3" stroke="#3a6a2a" stroke-width="1.1" fill="none" stroke-linecap="round"/>`,
  drop: `<path d="M12 3c-3 4.5-6.2 7.8-6.2 11.3A6.2 6.2 0 0 0 12 20.5a6.2 6.2 0 0 0 6.2-6.2C18.2 10.8 15 7.5 12 3z" fill="#4c98d0" ${S}/>${shine('M8.8 14.4c0 1.6.8 2.8 2 3.3', 1.2)}`,
  coffin: `<path d="M8.5 2.5h7l3 5-2.5 14h-8l-2.5-14z" fill="#5e4030" ${S}/><path d="M12 7v8.2M9.5 9.6h5" stroke="#d8a94c" stroke-width="1.6" stroke-linecap="round"/>`,
  chain: `<g fill="none" stroke-linecap="round"><rect x="2.8" y="8.6" width="10.4" height="6.8" rx="3.4" stroke="${K}" stroke-width="3.6"/><rect x="10.8" y="8.6" width="10.4" height="6.8" rx="3.4" stroke="${K}" stroke-width="3.6"/><rect x="2.8" y="8.6" width="10.4" height="6.8" rx="3.4" stroke="#b9c2cc" stroke-width="1.8"/><rect x="10.8" y="8.6" width="10.4" height="6.8" rx="3.4" stroke="#b9c2cc" stroke-width="1.8"/></g>`,
  scales: `${line('M12 4v15.6M8 20.5h8M4.4 7h15.2', '#d8a94c', 1.6)}<path d="M5 7.2 2.6 13M5 7.2 7.4 13M19 7.2 16.6 13M19 7.2 21.4 13" stroke="${K}" stroke-width=".9" fill="none"/><path d="M2.4 13a2.6 2.6 0 0 0 5.2 0zM16.4 13a2.6 2.6 0 0 0 5.2 0z" fill="#e3b04b" ${S}/>`,
  warning: `<path d="M12 3l9.6 17.2H2.4z" fill="#e8b84a" ${S}/><path d="M12 9.2v5.3" stroke="${K}" stroke-width="2.2" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.2" fill="${K}"/>`,
  burst: `<polygon points="${star(8, 10, 5.2, -Math.PI / 2)}" fill="#ef8a2c" ${S}/><polygon points="${star(8, 5.6, 2.8, -Math.PI / 2 + 0.2)}" fill="#ffd23d"/>`,
  wind: line('M3 8.6h11.4a2.6 2.6 0 1 0-2.6-2.6M3 12.6h15a2.6 2.6 0 1 1-2.6 2.6M5 16.8h5.6', '#dcecf4', 1.8),
  crown: `<path d="M3.5 8l4.2 4 4.3-6.6 4.3 6.6 4.2-4-1.8 10H5.3z" fill="#e3b04b" ${S}/><rect x="5.3" y="16" width="13.4" height="2.6" fill="#c9962f" ${S}/><circle cx="12" cy="17.3" r=".9" fill="#c0392b"/><circle cx="3.5" cy="7.6" r="1.1" fill="#e3b04b" stroke="${K}" stroke-width=".8"/><circle cx="12" cy="5" r="1.1" fill="#e3b04b" stroke="${K}" stroke-width=".8"/><circle cx="20.5" cy="7.6" r="1.1" fill="#e3b04b" stroke="${K}" stroke-width=".8"/>`,
  ghost: `<path d="M5.5 20.5V11a6.5 6.5 0 0 1 13 0v9.5l-2.2-1.6-2.1 1.6-2.2-1.6-2.2 1.6-2.1-1.6z" fill="#e6ecf6" ${S}/><ellipse cx="9.8" cy="11" rx="1.1" ry="1.5" fill="${K}"/><ellipse cx="14.2" cy="11" rx="1.1" ry="1.5" fill="${K}"/><ellipse cx="12" cy="14.8" rx="1" ry="1.3" fill="${K}"/>`,
  book: `<path d="M5 4.5c0-.8.7-1.5 1.5-1.5H19v15.5H6.8c-1 0-1.8.8-1.8 1.7z" fill="#7a2f2f" ${S}/><path d="M5 20.2c0-.9.8-1.7 1.8-1.7H19V21H6.7C5.8 21 5 20.9 5 20.2z" fill="#efe0bd" ${S}/><path d="M12.8 6.4l2.5 3.6-2.5 3.6-2.5-3.6z" fill="#e3b04b" stroke="${K}" stroke-width=".8"/><path d="M7.6 3.2v15.1" stroke="${K}" stroke-width=".9"/>`,
  question: `<circle cx="12" cy="12" r="9" fill="#4f6f9a" ${S}/><path d="M9.3 9.2c.2-1.6 1.4-2.7 2.9-2.7 1.6 0 2.9 1.1 2.9 2.6 0 1.3-.9 2-1.8 2.6-.8.5-1.2 1-1.2 2" stroke="#efe6d2" stroke-width="2" stroke-linecap="round" fill="none"/><circle cx="12.1" cy="16.6" r="1.1" fill="#efe6d2"/>`,
  hall: `<path d="M2.8 9 12 3.4 21.2 9z" fill="#cbbfa6" ${S}/><rect x="4" y="9" width="16" height="1.8" fill="#b3a68a" ${S}/><path d="M6 10.8v6.6M10 10.8v6.6M14 10.8v6.6M18 10.8v6.6" stroke="${K}" stroke-width="3.4"/><path d="M6 10.8v6.6M10 10.8v6.6M14 10.8v6.6M18 10.8v6.6" stroke="#e8dfc9" stroke-width="1.8"/><rect x="3" y="17.4" width="18" height="3" fill="#b3a68a" ${S}/>`,
  hat: `<path d="M3.8 18.6c2.5-1 5.2-1.5 8.2-1.5s5.7.5 8.2 1.5c-.4 1.3-3.9 2.3-8.2 2.3s-7.8-1-8.2-2.3z" fill="#3e4c7c" ${S}/><path d="M7 17.6 11.2 6c.9-2.3 3.6-3.1 5.7-1.8l1.6.9-2.4.3.4 12.2z" fill="#3e4c7c" ${S}/><path d="M7.4 15.9c3 .6 6 .6 9.1 0" stroke="#e3b04b" stroke-width="1.7" fill="none"/><polygon points="${star(5, 1.6, .7, -Math.PI / 2, 12.6, 10.6)}" fill="#ffe28e"/>`,
  people: `<circle cx="15.6" cy="7.6" r="2.8" fill="#d9ad84" ${S}/><path d="M10.6 18.6c.3-3 2.4-5.1 5-5.1s4.8 2.1 5 5.1z" fill="#7a2f2f" ${S}/><circle cx="8.6" cy="8.4" r="3" fill="#e4bb92" ${S}/><path d="M3 19.6c0-3.2 2.5-5.6 5.6-5.6s5.6 2.4 5.6 5.6z" fill="#4f6f9a" ${S}/>`,
  feather: `<path d="M19.6 3.4c-1 5.7-4.5 10.6-11 13.9L7 18.2C8.6 10.6 13 5.4 19.6 3.4z" fill="#efe6d2" ${S}/><path d="M4 20.6l3-2.4M7.4 17.8c3-3.8 6.4-8 10.6-12.6M10.2 13l-2.4-.2M12.6 10.2l-2.3-.3M11 15.2l2.6.4M13.6 12.2l2.4.4" stroke="${K}" stroke-width="1" stroke-linecap="round" fill="none"/>`,
  lock: `<path d="M8.4 10.6V8a3.6 3.6 0 0 1 7.2 0v2.6" fill="none" stroke="${K}" stroke-width="3.4"/><path d="M8.4 10.6V8a3.6 3.6 0 0 1 7.2 0v2.6" fill="none" stroke="#b9c2cc" stroke-width="1.7"/><rect x="5.4" y="10.4" width="13.2" height="10.2" rx="1.6" fill="#e3b04b" ${S}/><circle cx="12" cy="14.6" r="1.4" fill="${K}"/><path d="M12 15.4v2.6" stroke="${K}" stroke-width="1.4" stroke-linecap="round"/>`,
  flag: `${line('M6 3v18.4', '#7a4a22', 1.6)}<path d="M6.8 4.4c3-1.3 5.5 1.3 8.5 0 1.9-.8 3.3-.7 4.4 0v8c-1.1-.7-2.5-.8-4.4 0-3 1.3-5.5-1.3-8.5 0z" fill="#efe6d2" ${S}/>`,
  gear: `<polygon points="${gearPts()}" fill="#9aa3ad" ${S}/><circle cx="12" cy="12" r="3" fill="#5e6670" ${S}/>`,
  hourglass: `<path d="M7 4.6h10c0 3.5-2.8 5.5-5 7.4 2.2 2 5 3.9 5 7.4H7c0-3.5 2.8-5.4 5-7.4-2.2-1.9-5-3.9-5-7.4z" fill="#dcf0f5" ${S}/><path d="M9 7.2h6c-.8 1.4-2 2.4-3 3.3-1-.9-2.2-1.9-3-3.3zM8.4 19c.5-1.8 2-3 3.6-3.6 1.6.6 3.1 1.8 3.6 3.6z" fill="#e3b04b"/><rect x="5" y="2.4" width="14" height="2.4" rx=".6" fill="#8a5a30" ${S}/><rect x="5" y="19.2" width="14" height="2.4" rx=".6" fill="#8a5a30" ${S}/>`,
  eye: `<path d="M2.4 12C5 7.4 8.4 5.4 12 5.4s7 2 9.6 6.6C19 16.6 15.6 18.6 12 18.6S5 16.6 2.4 12z" fill="#efe6d2" ${S}/><circle cx="12" cy="12" r="3.7" fill="#4c98d0" ${S}/><circle cx="12" cy="12" r="1.6" fill="${K}"/><circle cx="13.3" cy="10.7" r=".7" fill="#fff"/>`,
  comet: `<path d="M3 21l8.4-8.4M5.6 21.2l6.6-6.6M2.8 18.4l6.6-6.6" stroke="#ffb84a" stroke-width="1.8" stroke-linecap="round" opacity=".85"/><circle cx="15" cy="9" r="5" fill="#ffd23d" ${S}/>${shine('M12.6 7.4a3 3 0 0 1 2.2-1.6', 1.2)}`,
  steps: `<ellipse cx="8" cy="13.4" rx="2.7" ry="4.2" fill="#8a5a30" ${S}/><ellipse cx="8" cy="20.2" rx="2" ry="1.5" fill="#8a5a30" ${S}/><ellipse cx="16" cy="6.8" rx="2.7" ry="4.2" fill="#8a5a30" ${S}/><ellipse cx="16" cy="13.6" rx="2" ry="1.5" fill="#8a5a30" ${S}/>`,
  speech: `<path d="M4 6.5C4 5.1 5.1 4 6.5 4h11C18.9 4 20 5.1 20 6.5v7c0 1.4-1.1 2.5-2.5 2.5H11l-4.5 4v-4C5.1 16 4 14.9 4 13.5z" fill="#efe6d2" ${S}/><circle cx="8.6" cy="10" r="1" fill="${K}"/><circle cx="12" cy="10" r="1" fill="${K}"/><circle cx="15.4" cy="10" r="1" fill="${K}"/>`,
  mirror: `<rect x="11" y="16.6" width="2" height="5" rx=".6" fill="#8a5a30" ${S}/><ellipse cx="12" cy="10" rx="6.2" ry="7.6" fill="#e3b04b" ${S}/><ellipse cx="12" cy="10" rx="4.4" ry="5.8" fill="#bfe0ea" stroke="${K}" stroke-width="1"/>${shine('M9.6 8.2l2.2-2.4')}`,
  compass: `<circle cx="12" cy="12" r="9" fill="#efe6d2" ${S}/><circle cx="12" cy="12" r="6.8" fill="none" stroke="#a88a5c" stroke-width="1"/><path d="M12 4.8 14 12h-4z" fill="#c0392b" stroke="${K}" stroke-width=".8" stroke-linejoin="round"/><path d="M12 19.2 10 12h4z" fill="#5e6670" stroke="${K}" stroke-width=".8" stroke-linejoin="round"/><circle cx="12" cy="12" r="1" fill="${K}"/>`,
  map: `<path d="M3 6.2l6-2 6 2 6-2v13.6l-6 2-6-2-6 2z" fill="#efe0bd" ${S}/><path d="M9 4.2v13.6M15 6.2v13.6" stroke="${K}" stroke-width=".9"/><path d="M5 14.4c2-1 3.6-3.6 6-3s3 2 6.4 0" stroke="#b83a2e" stroke-width="1.2" stroke-dasharray="1.4 1.4" fill="none"/><path d="M16.6 9.4l1.8 1.8M18.4 9.4l-1.8 1.8" stroke="#b83a2e" stroke-width="1.3" stroke-linecap="round"/>`,
  bone: `<g fill="${K}"><circle cx="5" cy="16.8" r="2.7"/><circle cx="7.2" cy="19" r="2.7"/><circle cx="16.8" cy="5" r="2.7"/><circle cx="19" cy="7.2" r="2.7"/></g><path d="M6.4 17.6 17.6 6.4" stroke="${K}" stroke-width="5.4" stroke-linecap="round"/><g fill="#efe6d2"><circle cx="5" cy="16.8" r="1.9"/><circle cx="7.2" cy="19" r="1.9"/><circle cx="16.8" cy="5" r="1.9"/><circle cx="19" cy="7.2" r="1.9"/></g><path d="M6.4 17.6 17.6 6.4" stroke="#efe6d2" stroke-width="3.6" stroke-linecap="round"/>`,
  egg: `<path d="M12 3c3.6 0 6.5 5.3 6.5 10.2A6.5 6.5 0 0 1 12 20.6a6.5 6.5 0 0 1-6.5-7.4C5.5 8.3 8.4 3 12 3z" fill="#efe0bd" ${S}/><circle cx="10" cy="10" r="1" fill="#c9a27a"/><circle cx="14.2" cy="13.6" r="1.3" fill="#c9a27a"/><circle cx="10.6" cy="16" r=".8" fill="#c9a27a"/>`,
  home: `<path d="M4.6 10.4 12 4l7.4 6.4V20H4.6z" fill="#e5d2ae" ${S}/><path d="M2.4 11.8 12 3.4l9.6 8.4-1.3 1.5L12 6.1l-8.3 7.2z" fill="#a8433a" ${S}/><rect x="10" y="14" width="4" height="6" fill="#7a4a22" ${S}/><rect x="15" y="11.2" width="2.6" height="2.6" fill="#ffd66e" stroke="${K}" stroke-width=".9"/>`,
  sound: `<path d="M4 9.4h3.5l4.5-4v13.2l-4.5-4H4z" fill="#b9c2cc" ${S}/><path d="M15 9c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3M17.6 6.5c1.8 1.4 2.8 3.4 2.8 5.5s-1 4.1-2.8 5.5" stroke="${K}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`,
  sun: `${rays(8, 7, 9.8, '#ffd23d')}<circle cx="12" cy="12" r="4.8" fill="#ffd23d" ${S}/>`,
  anvil: `<path d="M3.6 7h12.8c0 2.2 1.9 3.6 4 3.6v1c-2.4 0-4.4.5-5.5 2H9.1c-1-1.4-2.6-2.4-5.5-2.8z" fill="#6c747e" ${S}/><path d="M8.2 13.6h7.4l1.4 2.9h-3.4v2.4h3.2v2.1H6.6v-2.1h3.2v-2.4H6.6z" fill="#4c535b" ${S}/>${shine('M5 8.6h7')}`,
  check: line('M4.6 12.6l4.4 4.4 10.2-10.2', '#7ccf6a', 2.4),
  cross: line('M6.5 6.5l11 11M17.5 6.5l-11 11', '#e06a5a', 2.2),
  menu: line('M5 7h14M5 12h14M5 17h14', '#efe6d2', 1.8),
  lantern: `<circle cx="12" cy="3" r="1.3" fill="none" stroke="${K}" stroke-width="1.2"/><path d="M8.6 6.2h6.8l-1-2H9.6z" fill="#4c535b" ${S}/><rect x="8" y="6.2" width="8" height="11" rx="1.6" fill="#ffd66e" ${S}/><path d="M10.6 6.2v11M13.4 6.2v11" stroke="${K}" stroke-width="1"/><rect x="7.4" y="17.2" width="9.2" height="2.4" rx=".6" fill="#4c535b" ${S}/>`,
  robe: `<path d="M8 3.5h8l4.6 4-2.6 3-2-1.6V21H8V8.9l-2 1.6-2.6-3z" fill="#4f6f9a" ${S}/><path d="M9.5 3.5 12 7l2.5-3.5" stroke="${K}" stroke-width="1.1" fill="none"/><rect x="8" y="12" width="8" height="1.7" fill="#e3b04b"/>`,
  boot: `<path d="M7 3h6.2v10l6.3 2.8c1 .4 1.5 1.3 1.5 2.3V20H7z" fill="#7a4a22" ${S}/><rect x="7" y="19" width="14" height="2.2" fill="#3a2415" ${S}/><path d="M7 7h6.2" stroke="${K}" stroke-width="1"/>`,
  ring: `<circle cx="12" cy="14" r="5.6" fill="none" stroke="${K}" stroke-width="3.6"/><circle cx="12" cy="14" r="5.6" fill="none" stroke="#e3b04b" stroke-width="1.8"/><path d="M12 4.4l2.6 2.9L12 10.2 9.4 7.3z" fill="#48b0d2" ${S}/>`,
  wand: `${line('M4.6 19.4 14.6 9.4', '#8a5a30', 2)}<polygon points="${star(4, 5, 1.6, 0, 17, 7)}" fill="#ffe28e" ${S}/>`,
  bin: `<rect x="5.4" y="5" width="13.2" height="2.4" rx=".6" fill="#9aa3ad" ${S}/><path d="M6.6 7.4h10.8l-1 13H7.6z" fill="#b9c2cc" ${S}/><path d="M10 10v7.6M14 10v7.6" stroke="${K}" stroke-width="1"/><path d="M10 5V3.4h4V5" fill="none" ${S}/>`,
  dice: `<path d="M12 3.4l8.2 4.1-8.2 4.1-8.2-4.1z" fill="#f4efe2" ${S}/><path d="M3.8 7.5v9.2l8.2 4.1v-9.2z" fill="#ddd5c1" ${S}/><path d="M20.2 7.5v9.2L12 20.8v-9.2z" fill="#c6bda6" ${S}/><circle cx="12" cy="7.5" r="1" fill="${K}"/><circle cx="7.4" cy="12.6" r=".9" fill="${K}"/><circle cx="16.6" cy="12.6" r=".9" fill="${K}"/><circle cx="14.8" cy="16" r=".9" fill="${K}"/>`,
};

// Emoji → icon. Anything missing from this list is simply left out of the text.
const MAP = {
  coin: '🪙💰🛒', token: '🎟️🏅', skull: '💀☠️😈🧌', dragon: '🐉🦎🐍', spiral: '🌀🕳️🔁', orb: '🔮',
  chest: '🎁🧰', shield: '🛡️', potion: '🧪⚗️🍺🪣', swords: '⚔️🗡️🏹💪', star: '⭐🌟✴️🎉👏🥇🥈🥉🏆', sparkle: '✨💫🌌🌠',
  block: '🧱🟫⬛🟨🪜', trophy: '', scroll: '📜📋📅📤📥', flame: '🔥🌋♨️🌡️', rock: '🪨⛰️🏔️🗿', log: '🪵',
  tree: '🌳🌲', snowflake: '❄️🧊🌨️🥶', bolt: '⚡🌩️⛈️🔋', paw: '🐾🐈🐺🦁', fish: '🐟🎣', pickaxe: '⛏️🔨🛠️',
  axe: '🪓🪚✂️', food: '🍢🍲🍳🥧🫐🍄🌶️🍴', moon: '🌙🌑', target: '🎯', heart: '❤️💚🧡💗💙💓🩹🙂', horse: '🐴🐎🦌',
  gem: '💎🔷💠🧲📿', pack: '🎒', pouch: '👜', leaf: '🌿🍃🌱🌾🍀🌵🌼🌸🌺', drop: '💧🩸🌧️', coffin: '⚰️', chain: '🔗🪢🕸️',
  scales: '⚖️', warning: '⚠️❗🔻', burst: '💥😤', wind: '💨🌪️🌬️☁️🌫️', crown: '👑', ghost: '👻😱',
  book: '📖📚📘📕🧠', question: '❓❔', hall: '🏦🏛️🏰🏟️', hat: '🎩🧙', people: '🤝', feather: '🪶🪽🕊️🐦🦋',
  lock: '🔒🗝️🚪', flag: '🏳️', gear: '⚙️🖥️⌨️🎮🕹️', hourglass: '⏳⏱️', eye: '👁️🔭♿', comet: '☄️', steps: '👣',
  speech: '💬🗣️', mirror: '🪞🪟', compass: '🧭', map: '🗺️', bone: '🦴', egg: '🥚', home: '🏡🏠', sound: '🔊🔇',
  sun: '☀️🌅🌇', anvil: '📊⚒️', check: '✅', lantern: '🕯️🏮', robe: '👘🧣🧥', boot: '👢👟', ring: '💍',
  bin: '🗑️', dice: '🎲🃏', menu: '☰',
};
MAP.wand = '🪄';
// the trophy gets the cups the star does not
MAP.trophy = '🏆🥇🥈🥉';
MAP.star = MAP.star.replace(/🏆|🥇|🥈|🥉/gu, '');

const EMOJI_TO_ICON = new Map();
for (const [id, list] of Object.entries(MAP)) for (const ch of list.match(/\p{Extended_Pictographic}️?|☰/gu) || []) EMOJI_TO_ICON.set(ch.replace('️', ''), id);

// Pictographs, plus the variation selector that often follows them. Plain symbols the fonts
// draw well (✦ ✓ ✕ → ★) are left alone.
const KEEP = new Set(['✦', '✓', '✔', '✕', '→', '←', '↑', '↓', '★', '♾', '➕']);
const RE = /(\p{Extended_Pictographic}|☰)️?|️/gu;
const TEST = /\p{Extended_Pictographic}|☰|️/u;

export function iconSVG(id, cls = '') {
  return `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#ic-${id}"/></svg>`;
}

function iconEl(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#ic-' + id);
  svg.appendChild(use);
  return svg;
}

// Replaces the pictographs in one text node with icons (or removes them).
function swapText(node) {
  const text = node.nodeValue;
  if (!TEST.test(text)) return;
  const parent = node.parentNode;
  if (!parent || parent.closest?.('svg, script, style, textarea, input')) return;
  const frag = document.createDocumentFragment();
  let last = 0, changed = false;
  for (const m of text.matchAll(RE)) {
    const ch = m[0].replace('️', '');
    if (KEEP.has(ch)) continue;
    changed = true;
    if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
    const id = EMOJI_TO_ICON.get(ch);
    if (id) frag.appendChild(iconEl(id));
    last = m.index + m[0].length;
  }
  if (!changed) return;
  let rest = text.slice(last);
  // an icon that was the whole label should not leave a stray space behind
  if (!frag.lastChild || frag.lastChild.nodeType !== 3) rest = rest.replace(/^\s+/, ' ');
  if (rest) frag.appendChild(document.createTextNode(rest));
  parent.replaceChild(frag, node);
}

function swapTree(root) {
  if (root.nodeType === 3) { swapText(root); return; }
  if (root.nodeType !== 1 || root.closest?.('svg, script, style')) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (TEST.test(n.nodeValue)) hits.push(n);
  for (const n of hits) swapText(n);
}

// Puts the icon drawings in the page and keeps every emoji swapped from now on.
export function installIcons() {
  const defs = Object.entries(ICONS).map(([id, body]) => `<symbol id="ic-${id}" viewBox="0 0 24 24">${body}</symbol>`).join('');
  const holder = document.createElement('div');
  holder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${defs}</defs></svg>`;
  document.body.prepend(holder.firstChild);
  swapTree(document.body);
  new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'characterData') swapText(m.target);
      else for (const n of m.addedNodes) swapTree(n);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
}
