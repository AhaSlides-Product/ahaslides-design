/**
 * @ahaslides-product/design/post-css — the Post card styles, as strings.
 *
 * One set of declarations, three consumers:
 *   POST_CSS              <aha-post>'s shadow root, and lib/post.css (generated) for a host that writes
 *                         its own post markup with the aha-post classes.
 *   postBodyCss(scope)    the cooked-body rules (paragraphs, links, quote block, code block, images)
 *                         under any scope: <aha-post> adopts them into its root as `aha-post …`, so they
 *                         reach the light-DOM body it slots.
 *   DISCOURSE_POST_CSS    lib/discourse-post.css (generated): the same declarations on Discourse's own
 *                         post-stream classes, for a theme that cannot replace core markup.
 */
const D = {
  name: `font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5);
  font-weight:var(--aha-weight-semibold,600); color:var(--aha-text-default,#1A1A1A); text-decoration:none`,
  username: `font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5);
  font-weight:var(--aha-weight-regular,400); color:var(--aha-text-tertiary,#616161); text-decoration:none`,
  role: `display:inline-flex; align-items:center; box-sizing:border-box; height:20px; padding:0 var(--aha-space-6,6px);
  border-radius:var(--aha-radius-xs,4px); background:var(--aha-gray-30,#F1F1F1); color:var(--aha-text-secondary,#4A4A4A);
  font-size:var(--aha-size-sm,12px); line-height:18px; font-weight:var(--aha-weight-semibold,600)`,
  time: `margin-inline-start:auto; white-space:nowrap; font-size:var(--aha-size-default,14px);
  line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
  color:var(--aha-text-tertiary,#616161); text-decoration:none`,
  focus: `outline:2px solid var(--aha-border-focus,#E70E68); outline-offset:2px; border-radius:var(--aha-radius-xs,4px)`,
  body: `font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:var(--aha-size-l,16px);
  line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
  color:var(--aha-text-default,#1A1A1A); overflow-wrap:anywhere`,
  actions: `display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px)`,
  /* The <aha-button variant="text" size="sm"> look, for host markup that cannot render <aha-button>. */
  action: `display:inline-flex; align-items:center; justify-content:center; gap:var(--aha-space-8,8px); box-sizing:border-box;
  min-width:28px; height:28px; margin:0; padding:0 var(--aha-space-8,8px); border:1px solid transparent;
  border-radius:var(--aha-radius-xs,4px); background:transparent; box-shadow:none;
  font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); font-size:var(--aha-size-default,14px);
  line-height:1; font-weight:var(--aha-weight-regular,400); color:var(--aha-text-secondary,#4A4A4A); cursor:pointer;
  transition:background-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,cubic-bezier(0.645,0.045,0.355,1))`,
  actionHover: `background:var(--aha-gray-40,#E3E3E3); color:var(--aha-text-secondary,#4A4A4A)`,
  actionActive: `background:var(--aha-gray-50,#D4D4D4); color:var(--aha-text-secondary,#4A4A4A)`,
  actionIcon: `width:16px; height:16px; color:var(--aha-icon-default,#4A4A4A); fill:currentColor`,
};

export function postBodyCss(scope) {
  const s = scope;
  return `
${s} p{ margin:0 0 var(--aha-space-16,16px) }
${s} :is(p, blockquote, aside.quote, pre, ul, ol):last-child{ margin-bottom:0 }
${s} a:not(.lightbox):not(.mention):not(.hashtag-cooked){ color:var(--aha-text-link,#DB005B); text-decoration:underline }
${s} a:not(.lightbox):not(.mention):not(.hashtag-cooked):hover{ color:var(--aha-text-link-hover,#DB005B) }
${s} :is(blockquote, aside.quote){ margin:0 0 var(--aha-space-16,16px); padding:var(--aha-space-12,12px) var(--aha-space-16,16px);
  border:0; border-inline-start:4px solid var(--aha-border-strong,#D4D4D4); border-radius:var(--aha-radius-xs,4px);
  background:var(--aha-bg-container-secondary,#F7F7F7); color:var(--aha-text-secondary,#4A4A4A) }
${s} aside.quote blockquote{ margin:0; padding:0; border:0; border-radius:0; background:none }
${s} aside.quote .title{ display:flex; align-items:center; gap:var(--aha-space-8,8px); margin:0 0 var(--aha-space-4,4px); padding:0;
  border:0; background:none; font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5);
  font-weight:var(--aha-weight-semibold,600); color:var(--aha-text-secondary,#4A4A4A) }
${s} aside.quote .title img.avatar{ width:20px; height:20px; margin:0; border-radius:var(--aha-radius-pill,999px) }
${s} code{ padding:var(--aha-space-2,2px) var(--aha-space-4,4px); border-radius:var(--aha-radius-xs,4px);
  background:var(--aha-gray-30,#F1F1F1); color:var(--aha-text-default,#1A1A1A);
  font-family:var(--aha-font-mono,Menlo,Monaco,monospace); font-size:var(--aha-size-default,14px) }
${s} pre{ margin:0 0 var(--aha-space-16,16px); padding:var(--aha-space-16,16px); overflow:auto;
  border:1px solid var(--aha-border-secondary,#F1F1F1); border-radius:var(--aha-radius-default,8px);
  background:var(--aha-bg-container-secondary,#F7F7F7); color:var(--aha-text-default,#1A1A1A);
  font-family:var(--aha-font-mono,Menlo,Monaco,monospace); font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5) }
${s} pre code{ display:block; max-height:none; padding:0; border-radius:0; background:none; font-size:inherit; white-space:pre }
${s} img:not(.emoji):not(.avatar){ max-width:100%; height:auto }
`;
}

export const POST_CSS = `
.aha-post{ box-sizing:border-box; display:flex; align-items:flex-start; gap:var(--aha-space-12,12px);
  padding:var(--aha-space-12,12px) 0; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
.aha-post__avatar{ flex:none; width:40px; line-height:0 }
.aha-post__main{ flex:1 1 auto; min-width:0 }
.aha-post__head{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px); min-height:24px; overflow-wrap:anywhere }
.aha-post__name{ ${D.name} }
a.aha-post__name:hover{ text-decoration:underline }
.aha-post__username{ ${D.username} }
.aha-post__role{ ${D.role} }
.aha-post__time{ ${D.time} }
.aha-post :is(a.aha-post__name, a.aha-post__time):focus-visible{ ${D.focus} }
.aha-post__body{ margin-top:var(--aha-space-8,8px); ${D.body} }
${postBodyCss('.aha-post__body')}
.aha-post__actions{ ${D.actions}; margin:var(--aha-space-8,8px) 0 0 calc(-1 * var(--aha-space-8,8px)) }
.aha-post__action{ ${D.action} }
@media (hover:hover){ .aha-post__action:hover{ ${D.actionHover} } }
.aha-post__action:active{ ${D.actionActive} }
.aha-post__action:focus-visible{ ${D.focus} }
.aha-post__action :is(svg, aha-icon){ ${D.actionIcon} }
`;

const P = '#main-outlet .topic-post';
export const DISCOURSE_POST_CSS = `
${P}{ --love:var(--aha-icon-default,#4A4A4A); --topic-avatar-width:40px; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
${P} :is(.topic-avatar, .topic-body){ border-top:0 }
${P} .topic-avatar{ padding-top:var(--aha-space-12,12px) }
${P} .topic-avatar img.avatar{ width:40px; height:40px }
${P} .topic-body{ padding-top:var(--aha-space-12,12px); padding-bottom:var(--aha-space-12,12px) }
${P} .topic-meta-data{ align-items:center; gap:var(--aha-space-8,8px); min-height:24px }
${P} .topic-meta-data .names{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px); min-width:0; overflow-wrap:anywhere }
${P} .topic-meta-data .names :is(.first, .first a){ ${D.name} }
${P} .topic-meta-data .names .first a:hover{ text-decoration:underline }
${P} .topic-meta-data .names :is(.second, .second a){ ${D.username} }
${P} .topic-meta-data .names .user-title{ ${D.role} }
${P} .topic-meta-data .post-infos{ margin-inline-start:auto }
${P} .topic-meta-data :is(.post-date, a.post-date, .relative-date){ ${D.time}; margin-inline-start:0 }
${P} .topic-meta-data :is(.names a, a.post-date):focus-visible{ ${D.focus} }
${P} .cooked{ ${D.body}; padding-top:var(--aha-space-8,8px) }
${postBodyCss(`${P} .cooked`)}
${P} nav.post-controls{ margin-top:var(--aha-space-8,8px); color:var(--aha-text-secondary,#4A4A4A) }
${P} nav.post-controls .actions{ ${D.actions} }
${P} nav.post-controls .actions .btn{ ${D.action} } /* ds-lint-allow: hand-rolled-button (Discourse core renders these buttons; this paints them in the aha-button text sm look) */
@media (hover:hover){ ${P} nav.post-controls .actions .btn:hover{ ${D.actionHover} } } /* ds-lint-allow: hand-rolled-button (Discourse core renders these buttons; this paints them in the aha-button text sm look) */
${P} nav.post-controls .actions .btn:active{ ${D.actionActive} } /* ds-lint-allow: hand-rolled-button (Discourse core renders these buttons; this paints them in the aha-button text sm look) */
${P} nav.post-controls .actions .btn:focus-visible{ ${D.focus} }
${P} nav.post-controls .actions .btn :is(.d-icon, aha-icon){ ${D.actionIcon} }
${P} nav.post-controls .actions .btn .d-button-label{ font-size:inherit; font-weight:inherit; color:inherit }
`;

export default POST_CSS;
