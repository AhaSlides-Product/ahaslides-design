/**
 * @ahaslides-product/design/achievement-badge-css — the Achievement badge class layer, as strings.
 *
 * ACHIEVEMENT_BADGE_CSS is the card itself: <aha-achievement-badge> puts it in its shadow root.
 * ACHIEVEMENT_BADGE_DISCOURSE_CSS maps Discourse's own badge markup (.badge-card, .user-badge) onto
 * the same values. generate.mjs writes both to lib/achievement-badge.css for a host that renders its
 * own markup. Tiers never take a hue (colour rule C5): every glyph is ink, and the tier is a label.
 */
const TIER_LABEL = `box-sizing:border-box; display:inline-flex; align-items:center; height:20px;
  padding:0 var(--aha-space-6,6px); border-radius:var(--aha-radius-xs,4px);
  background-color:var(--aha-gray-30,#F1F1F1); color:var(--aha-text-secondary,#4A4A4A);
  font-size:12px; line-height:18px; font-weight:var(--aha-weight-semibold,600); white-space:nowrap`;

const TITLE = `font-size:var(--aha-size-l,16px); line-height:var(--aha-line-height-body,1.5);
  font-weight:var(--aha-weight-semibold,600); color:var(--aha-text-default,#1A1A1A); text-decoration:none;
  overflow-wrap:anywhere; border-radius:var(--aha-radius-xs,4px); outline:2px solid transparent; outline-offset:2px;
  transition:outline-color var(--aha-motion-fast,.1s) var(--aha-ease-out,ease-out)`;

const DESCRIPTION = `margin:var(--aha-space-4,4px) 0 0; font-size:var(--aha-size-default,14px);
  line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
  color:var(--aha-text-secondary,#4A4A4A); overflow-wrap:anywhere`;

const META = `font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5);
  font-weight:var(--aha-weight-regular,400); color:var(--aha-text-tertiary,#616161)`;

const CARD = `box-sizing:border-box; min-width:0; padding:var(--aha-space-20,20px);
  font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); background-color:var(--aha-bg-container,#FFFFFF);
  border:1px solid var(--aha-border-default,#E3E3E3); border-radius:var(--aha-radius-lg,12px)`;

export const ACHIEVEMENT_BADGE_CSS = `
.aha-achievement-badge{ ${CARD}; display:flex; align-items:flex-start; gap:var(--aha-space-16,16px) }
.aha-achievement-badge__icon{ flex:none; color:var(--aha-icon-strong,#1A1A1A) }
.aha-achievement-badge__info{ flex:1 1 auto; min-width:0 }
.aha-achievement-badge__head{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px) }
.aha-achievement-badge__title{ ${TITLE} }
a.aha-achievement-badge__title:hover{ text-decoration:underline }
.aha-achievement-badge__title:focus-visible{ outline-color:var(--aha-border-focus,#E70E68) }
.aha-achievement-badge__tier{ ${TIER_LABEL} }
.aha-achievement-badge__description{ ${DESCRIPTION} }
.aha-achievement-badge__meta{ ${META}; display:flex; flex-wrap:wrap; gap:var(--aha-space-4,4px) var(--aha-space-16,16px);
  margin-top:var(--aha-space-8,8px) }
`;

const GLYPHS = [
  ['user', 'system-user'], ['medal', 'system-medal'], ['heart', 'system-heart-straight'],
  ['certificate', 'system-certificate'], ['trophy', 'system-trophy'], ['star', 'system-star'],
];

export const ACHIEVEMENT_BADGE_DISCOURSE_CSS = `
.badge-card{ ${CARD}; display:flex; flex-direction:column; gap:var(--aha-space-8,8px); box-shadow:none }
.badge-card .badge-contents{ display:flex; align-items:flex-start; gap:var(--aha-space-16,16px); min-width:0; padding:0; margin:0 }
.badge-card .badge-icon{ flex:none; display:inline-flex; align-items:center; justify-content:center;
  width:32px; height:32px; margin:0; font-size:32px; color:var(--aha-icon-strong,#1A1A1A) }
.badge-card .badge-icon .d-icon, .badge-card .badge-icon img{ width:32px; height:32px; object-fit:contain }
.badge-card .badge-info{ flex:1 1 auto; min-width:0; margin:0 }
.badge-card .badge-info h3{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px);
  margin:0; font-size:var(--aha-size-l,16px); line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-semibold,600) }
.badge-card .badge-link{ ${TITLE} }
.badge-card .badge-link:hover{ text-decoration:underline }
.badge-card .badge-link:focus-visible{ outline-color:var(--aha-border-focus,#E70E68) }
.badge-card .badge-icon:is(.badge-type-gold,.badge-type-silver,.badge-type-bronze) + .badge-info h3::after{ ${TIER_LABEL} }
.badge-card .badge-icon.badge-type-gold + .badge-info h3::after{ content:"Gold" }
.badge-card .badge-icon.badge-type-silver + .badge-info h3::after{ content:"Silver" }
.badge-card .badge-icon.badge-type-bronze + .badge-info h3::after{ content:"Bronze" }
.badge-card .badge-summary{ ${DESCRIPTION} }
.badge-card .badge-summary a{ display:block; margin-top:var(--aha-space-8,8px); ${META}; text-decoration:none }
.badge-card .badge-summary a:hover{ text-decoration:underline }
.badge-card .grant-count{ ${META}; margin:0; padding-inline-start:calc(32px + var(--aha-space-16,16px)) }
:is(.badge-type-gold,.badge-type-silver,.badge-type-bronze){ color:var(--aha-icon-strong,#1A1A1A) }
:is(.badge-type-gold,.badge-type-silver,.badge-type-bronze) .d-icon{ color:var(--aha-icon-strong,#1A1A1A) }
.user-badge{ ${TIER_LABEL}; gap:var(--aha-space-4,4px); border:1px solid transparent; text-decoration:none }
.user-badge .d-icon{ width:12px; height:12px; color:var(--aha-icon-strong,#1A1A1A) }
.user-badge .count, .user-badge .grant-count{ color:var(--aha-text-tertiary,#616161); font-weight:var(--aha-weight-regular,400) }
:is(.badge-card .badge-icon, .user-badge) .d-icon{ background-color:currentColor;
  -webkit-mask:var(--aha-badge-glyph,url("../icons/svg/system/system-medal.svg")) center / 100% 100% no-repeat;
  mask:var(--aha-badge-glyph,url("../icons/svg/system/system-medal.svg")) center / 100% 100% no-repeat }
:is(.badge-card .badge-icon, .user-badge) .d-icon > use{ visibility:hidden }
${GLYPHS.map(([fa, ds]) => `:is(.badge-card .badge-icon, .user-badge) .d-icon-${fa}{ --aha-badge-glyph:url("../icons/svg/system/${ds}.svg") }`).join('\n')}
`;

export default ACHIEVEMENT_BADGE_CSS;
