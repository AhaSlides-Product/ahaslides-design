/**
 * @ahaslides-product/design/aha-loader — the AhaSlides environment-transition loading SCREEN.
 *
 *   import '@ahaslides-product/design/aha-loader';   // registers <aha-loader> (+ <aha-illustration>)
 *   <aha-loader></aha-loader>
 *   <aha-loader label="Opening the editor…"></aha-loader>
 *   <aha-loader variant="tiles"></aha-loader>         // the previous five-tile look
 *   <aha-loader logo-only></aha-loader>               // the logo alone: no dot ring, opens on the finished logo
 *
 * A branded loading screen shown while a new environment boots — moving from the workspace to the
 * Presentation editor, or from the editor to the Presenting view. It fills its container on a white
 * ground and centres the animated AhaSlides splash at a fixed size (--aha-loader-size, the logo's
 * width, default 112px): a ring of eight brand dots gathers into the centre, the four logo petals
 * bloom out of it with a quarter-turn, hold, then close one by one and throw the dots back out.
 *
 * logo-only drops the dot ring and the bloom: every frame is the finished logo, which holds, then
 * turns once with a gentle shrink and settles upright again (a 2.2s loop), for short and inline loads
 * at 16–48px. Its drawing box is exactly --aha-loader-size, with no min-height. It changes only the
 * splash; the tiles variant ignores it.
 *
 * variant="tiles" keeps the previous look (five <aha-illustration> loader-* tiles cycling). With no
 * attribute, <html data-aha-loader="tiles"> picks the tiles for every loader on the page, read when
 * each loader connects, so an app can switch all of them at one entry point; the attribute wins.
 *
 * The petal paths are the DS splash logo (logo/thesplash.svg) verbatim. The splash runs on one
 * requestAnimationFrame loop per element, started on connect and cancelled on disconnect; under
 * prefers-reduced-motion it renders the finished logo once and never loops.
 */
import './illustrations.js';   // registers <aha-illustration> so the five loader-* tiles resolve from the DS registry

const TILES = ['loader-award', 'loader-wand', 'loader-plane', 'loader-ballot', 'loader-chart'];

const SPLASH_PETALS = [
  ['pink', 'M170.733 275.998C278.798 265.243 378.859 323.322 335.099 444.05C314.506 506.19 275.855 581.827 243.31 638.991C215.75 687.389 176.897 762.933 120.57 779.886C47.4014 801.893 13.3568 737.231 38.653 673.946C50.1622 645.147 76.3125 617.797 98.9558 596.777C156.207 543.64 209.364 500.767 267.058 447.815C322.558 396.876 304.327 320.548 218.229 348.597C177.136 361.996 147.118 395.204 100.29 386.241C77.245 381.831 59.1047 363.439 62.4007 338.917C68.3362 294.758 133.204 278.683 170.733 275.998Z'],
  ['purple', 'M450.382 386.525C486.54 382.591 528.879 404.694 561.903 419.06C613.821 441.642 719.681 495.692 751.619 545.435C773.16 578.987 758.736 620.992 723.868 629.865C680.288 637.375 652.573 611.747 625.142 583.886C583.067 541.158 542.425 487.894 502.946 446.124C459.708 404.54 411.899 421.557 428.008 479.843C437.434 513.92 476.519 553.502 451.17 590.608C432.96 617.264 400.896 603.783 387.05 579.1C355.646 523.118 368.986 393.785 450.369 386.525H450.382Z'],
  ['purple', 'M395.401 274.91C359.243 278.844 311.02 252.439 277.995 238.073C226.078 215.492 127.572 164.107 98.4196 118.689C76.8782 85.137 82.5894 39.0804 126.17 31.5704C169.75 24.0603 197.412 51.5244 223.829 78.3561C263.853 119.008 305.44 175.986 347.904 218.444C381.523 254.744 436.591 242.313 420.482 184.027C411.056 149.95 369.615 104.535 398.068 68.6762C418.857 42.4809 447.41 59.2659 459.706 83.1959C490.656 143.426 480.25 265.499 395.414 274.91L395.401 274.91Z'],
  ['pink', 'M513.867 313.624C513.866 313.622 513.869 313.62 513.87 313.622C537.558 338.301 582.265 297.03 606.997 294.547C624.974 292.744 647.013 299.901 646.488 321.974C646.488 358.004 581.094 363.359 554.43 360.693C502.932 355.544 465.718 321.759 484.522 264.702C500.282 216.871 551.389 106.373 589.653 75.139C630.502 41.788 679.136 67.0343 663.298 119.505C651.501 158.567 571.718 215.383 539.267 245.611C522.147 261.559 494.137 291.042 513.863 313.626C513.865 313.628 513.868 313.626 513.867 313.624Z'],
];

const CX = 410, CY = 340;
const T = { MORPH: 0.4, SETTLED: 1.35, EXIT: 2.2, GONE: 3.1 };
const G = { BLOOM: 0.35, EXIT: 2.0, LOOP: 4.2, OUT: 0.6 };
const SPEED = 1.15, START = 1.4;
const SPIN_FROM = G.EXIT + 0.4 * (T.GONE - T.EXIT), SPIN_LEN = G.LOOP - SPIN_FROM + 0.5;
const RING = 8, DOT_DIST = 310, DOT_R = 30;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOutCubic = x => 1 - Math.pow(1 - x, 3);
const easeInCubic = x => x * x * x;
const easeInOutCubic = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const easeOutBack = (x, s) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
const xf = (rot, s) => `translate(${CX} ${CY}) rotate(${rot.toFixed(2)}) scale(${s.toFixed(4)}) translate(${-CX} ${-CY})`;

const DOTS = Array.from({ length: RING }, (_, j) => ({
  tone: j % 2 ? 'purple' : 'pink',
  ang: (j * 45 - 48) * Math.PI / 180,
  emit: G.EXIT + (0.4 + (j % 4) * 0.12) * (T.GONE - T.EXIT),
}));

function splashFrame(time) {
  const t = (time * SPEED + START) % G.LOOP;
  const u = Math.min(1, ((t - SPIN_FROM + G.LOOP) % G.LOOP) / SPIN_LEN);
  const drift = 2 * Math.PI * (0.5 - 0.5 * Math.cos(Math.PI * u));
  let petals, goo = 0;
  if (t >= G.EXIT) {
    const e = prog(t, G.EXIT, G.EXIT + T.GONE - T.EXIT);
    petals = SPLASH_PETALS.map((_, i) => {
      const k = easeInOutCubic(prog(e, i * 0.12, 0.55 + i * 0.12));
      return xf(35 * k, 1 - k);
    });
  } else {
    const m = t - G.BLOOM + T.MORPH;
    const rot = -70 * (1 - easeOutCubic(prog(m, T.MORPH, T.SETTLED)));
    petals = SPLASH_PETALS.map((_, i) => {
      const kk = prog(m, T.MORPH + i * 0.04, T.SETTLED - 0.12 + i * 0.04);
      return xf(rot, m < T.MORPH ? 0 : easeOutBack(kk, 1.3));
    });
    goo = m < T.MORPH ? 0 : 12 * (1 - easeOutCubic(prog(m, T.MORPH + 0.15, T.SETTLED)));
  }
  const dots = DOTS.map(dot => {
    let d = 0, r = 0;
    if (t < 0.5) {
      const k = prog(t, 0, 0.5);
      d = DOT_DIST * (1 - easeInCubic(k)); r = DOT_R * (1 - prog(k, 0.75, 1));
    } else if (t >= dot.emit) {
      const k = prog(t, dot.emit, dot.emit + G.OUT);
      d = 60 + (DOT_DIST - 60) * easeOutCubic(k); r = DOT_R * easeOutCubic(prog(k, 0, 0.25));
    }
    const a = dot.ang + drift;
    return { cx: CX + Math.cos(a) * d, cy: CY + Math.sin(a) * d, r };
  });
  return { petals, goo, dots };
}

const LOGO_CX = 396, LOGO_CY = 407;
const LOGO = { HOLD: 0.8, TURN: 1.4, DIP: 0.22 };

function logoFrame(time) {
  const t = time % (LOGO.HOLD + LOGO.TURN);
  if (t < LOGO.HOLD) return 'rotate(0)';
  const k = (t - LOGO.HOLD) / LOGO.TURN;
  // The dip keeps the logo's farthest tips inside its square box while it is diagonal.
  const s = 1 - LOGO.DIP * Math.sin(Math.PI * k);
  return `translate(${LOGO_CX} ${LOGO_CY}) rotate(${(360 * easeInOutCubic(k)).toFixed(2)}) scale(${s.toFixed(4)}) translate(${-LOGO_CX} ${-LOGO_CY})`;
}

let uid = 0;

const STYLE = `
  :host{ display:flex; align-items:center; justify-content:center; box-sizing:border-box;
    width:100%; height:100%; min-height:240px; background:var(--aha-bg-container,var(--aha-white,#FFFFFF));
    font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .stage{ position:relative; display:flex; align-items:center; justify-content:center;
    width:100%; height:100% }
  /* The viewBox is 1.5 logo widths, so the svg is 1.5 × --aha-loader-size and the logo itself is
     exactly --aha-loader-size wide, with room for the dot ring and the bloom's overshoot. */
  .splash{ display:block; flex:none; overflow:visible;
    width:calc(var(--aha-loader-size,112px) * 1.5); height:calc(var(--aha-loader-size,112px) * 1.5) }
  :host([logo-only]){ min-height:0 }
  .logo-only{ display:block; flex:none; overflow:visible;
    width:var(--aha-loader-size,112px); height:var(--aha-loader-size,112px) }
  .pink{ fill:var(--aha-vivid-pink-100,#E70E68) }
  .purple{ fill:var(--aha-logo-purple,#6A1EBB) }
  /* Absolute with no offsets keeps each tile at its flex-centred static position, so all five
     stack dead-centre; the keyframe then slides them from there. */
  .icon-card{ position:absolute; display:flex; align-items:center; justify-content:center;
    width:120px; height:120px; border-radius:var(--aha-radius-xl,16px);
    background:var(--aha-bg-container,#FFFFFF); opacity:0;
    animation:aha-loader-soft-flow var(--aha-loader-duration,7.5s) var(--aha-ease-in-out,ease) infinite;
    will-change:transform,opacity,filter }
  .card-1{ animation-delay:0s }
  .card-2{ animation-delay:1.5s }
  .card-3{ animation-delay:3s }
  .card-4{ animation-delay:4.5s }
  .card-5{ animation-delay:6s }

  @keyframes aha-loader-soft-flow{
    0%{ opacity:0; transform:translateX(20px) scale(.9); filter:blur(4px) }
    5%{ opacity:1; transform:translateX(0) scale(1); filter:blur(0) }
    15%{ opacity:1; transform:translateX(0) scale(1); filter:blur(0) }
    20%{ opacity:0; transform:translateX(-20px) scale(.95); filter:blur(4px) }
    100%{ opacity:0; transform:translateX(-20px) scale(.95) }
  }

  @media (prefers-reduced-motion: reduce){
    .icon-card{ animation:none; opacity:0 }
    .card-1{ opacity:1 }
  }
`;

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export class AhaLoader extends HTMLElement {
  static get observedAttributes() { return ['label', 'variant', 'logo-only']; }
  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this._render();
    this._syncA11y();
  }
  disconnectedCallback() { this._stop(); }
  attributeChangedCallback(name) {
    if (!this.shadowRoot || !this.isConnected) return;
    if (name === 'variant' || name === 'logo-only') this._render();
    else this._syncA11y();
  }
  get variant() {
    const own = this.getAttribute('variant');
    if (own) return own === 'tiles' ? 'tiles' : 'splash';
    const page = typeof document !== 'undefined' && document.documentElement && document.documentElement.dataset
      ? document.documentElement.dataset.ahaLoader : '';
    return page === 'tiles' ? 'tiles' : 'splash';
  }
  _syncA11y() {
    // A loading screen is a live status region, not an interactive control.
    this.setAttribute('role', 'status');
    this.setAttribute('aria-live', 'polite');
    this.setAttribute('aria-label', this.getAttribute('label') || 'Loading');
  }
  _render() {
    const variant = this.variant;
    const logoOnly = variant === 'splash' && this.hasAttribute('logo-only');
    if (this._variant === variant && this._logoOnly === logoOnly && this.shadowRoot.firstChild) { this._start(); return; }
    this._stop();
    this._variant = variant;
    this._logoOnly = logoOnly;
    this._splash = null;
    this._logo = null;
    this.setAttribute('data-variant', variant);
    if (variant === 'tiles') {
      const cards = TILES.map((name, i) =>
        `<div class="icon-card card-${i + 1}" part="tile">` +
          `<aha-illustration name="${name}" size="96" decorative></aha-illustration>` +
        `</div>`).join('');
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="stage" part="stage">${cards}</div>`;
      return;
    }
    if (logoOnly) {
      const paths = SPLASH_PETALS.map(([tone, d]) => `<path class="petal ${tone}" d="${d}"/>`).join('');
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="stage" part="stage">` +
        `<svg class="logo-only" part="splash" viewBox="${LOGO_CX - 401} ${LOGO_CY - 401} 802 802" aria-hidden="true" focusable="false">` + // ds-lint-allow: svg (the animated brand logo: the petal group is transformed per frame, which an <aha-icon> cannot do)
          `<g class="logo">${paths}</g>` +
        `</svg></div>`;
      this._logo = this.shadowRoot.querySelector('.logo');
      this._draw(0);
      this._start();
      return;
    }
    const goo = `aha-loader-goo-${uid++}`;
    const petals = SPLASH_PETALS.map(([tone, d]) => `<path class="petal ${tone}" d="${d}"/>`).join('');
    const dots = DOTS.map(dot => `<circle class="dot ${dot.tone}" cx="${CX}" cy="${CY}" r="0"/>`).join('');
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="stage" part="stage">` +
      `<svg class="splash" part="splash" viewBox="${CX - 601.5} ${CY - 601.5} 1203 1203" aria-hidden="true" focusable="false">` + // ds-lint-allow: svg (the animated brand splash: each logo petal and dot is transformed per frame, which an <aha-icon> cannot do)
        `<defs><filter id="${goo}" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">` +
          `<feGaussianBlur class="goo-blur" in="SourceGraphic" stdDeviation="0" result="b"/>` +
          `<feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" result="g"/>` +
          `<feComposite in="SourceGraphic" in2="g" operator="atop"/>` +
        `</filter></defs>` +
        `<g class="liquid">${petals}</g><g class="dots">${dots}</g>` +
      `</svg></div>`;
    const root = this.shadowRoot;
    this._splash = {
      goo, blur: root.querySelector('.goo-blur'), liquid: root.querySelector('.liquid'),
      petals: [...root.querySelectorAll('.petal')], dots: [...root.querySelectorAll('.dot')],
    };
    this._draw(0);
    this._start();
  }
  _draw(time) {
    if (this._logo) { this._logo.setAttribute('transform', logoFrame(time)); return; }
    const s = this._splash; if (!s) return;
    const f = splashFrame(time);
    s.petals.forEach((p, i) => p.setAttribute('transform', f.petals[i]));
    s.dots.forEach((c, i) => {
      const d = f.dots[i];
      c.setAttribute('cx', d.cx.toFixed(1)); c.setAttribute('cy', d.cy.toFixed(1)); c.setAttribute('r', d.r.toFixed(2));
    });
    s.blur.setAttribute('stdDeviation', f.goo.toFixed(2));
    if (f.goo > 0.2) s.liquid.setAttribute('filter', `url(#${s.goo})`);
    else s.liquid.removeAttribute('filter');
  }
  _start() {
    if (this._variant !== 'splash' || this._frame || reducedMotion() || typeof requestAnimationFrame !== 'function') return;
    const t0 = performance.now();
    const tick = now => {
      this._draw((now - t0) / 1000);
      this._frame = requestAnimationFrame(tick);
    };
    this._frame = requestAnimationFrame(tick);
  }
  _stop() {
    if (this._frame) cancelAnimationFrame(this._frame);
    this._frame = 0;
  }
}

export function defineAhaLoader(tag = 'aha-loader') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaLoader);
  return true;
}
if (typeof window !== 'undefined') defineAhaLoader();

export default { AhaLoader, defineAhaLoader };
