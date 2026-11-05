/**
 * @ahaslides-product/design/topic-row-css — the Topic row class layer, as a string.
 *
 * One source for two consumers: <aha-topic-row> puts it in its shadow root, and generate.mjs
 * writes it to lib/topic-row.css for a host that renders its own row markup (a Discourse theme).
 * Every rule is a class, so it works on <div>/<li> rows and on table rows (<tr> + <td> cells):
 * padding sits on the cells, never the row, and the avatar cell carries the gap as padding.
 */
export const TOPIC_ROW_CSS = `
.aha-topic-row{ box-sizing:border-box; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif);
  border-bottom:1px solid var(--aha-border-secondary,#F1F1F1); background-color:transparent;
  transition:background-color var(--aha-motion-fast,.1s) var(--aha-ease-out,ease-out) }
.aha-topic-row:is(div,li,article){ display:flex; align-items:flex-start }
@media (hover:hover){ .aha-topic-row:hover{ background-color:var(--aha-bg-hover,#F7F7F7) } }
.aha-topic-row__avatar{ box-sizing:content-box; width:40px; flex:none; vertical-align:top;
  padding:var(--aha-space-16,16px) var(--aha-space-12,12px) var(--aha-space-16,16px) var(--aha-space-16,16px) }
.aha-topic-row__main{ box-sizing:border-box; flex:1 1 auto; min-width:0; vertical-align:top;
  padding:var(--aha-space-16,16px) var(--aha-space-16,16px) var(--aha-space-16,16px) 0 }
.aha-topic-row__head{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-8,8px) }
.aha-topic-row__pin{ vertical-align:-2px; margin-inline-end:var(--aha-space-4,4px); color:var(--aha-icon-default,#4A4A4A) }
.aha-topic-row__title{ min-width:0; overflow-wrap:anywhere; font-size:var(--aha-size-l,16px);
  line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-semibold,600);
  color:var(--aha-text-default,#1A1A1A); text-decoration:none; border-radius:var(--aha-radius-xs,4px);
  outline:2px solid transparent; outline-offset:2px;
  transition:outline-color var(--aha-motion-fast,.1s) var(--aha-ease-out,ease-out) }
.aha-topic-row__title:hover{ text-decoration:underline }
.aha-topic-row__title:focus-visible{ outline-color:var(--aha-border-focus,#E70E68) }
.aha-topic-row--read .aha-topic-row__title{ font-weight:var(--aha-weight-regular,400) }
.aha-topic-row__excerpt{ margin:var(--aha-space-4,4px) 0 0; font-size:var(--aha-size-default,14px);
  line-height:var(--aha-line-height-body,1.5); font-weight:var(--aha-weight-regular,400);
  color:var(--aha-text-secondary,#4A4A4A); overflow-wrap:anywhere; overflow:hidden;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; line-clamp:2 }
.aha-topic-row__meta{ display:flex; flex-wrap:wrap; align-items:center; gap:var(--aha-space-4,4px) var(--aha-space-16,16px);
  margin-top:var(--aha-space-8,8px); font-size:var(--aha-size-default,14px); line-height:var(--aha-line-height-body,1.5);
  font-weight:var(--aha-weight-regular,400); color:var(--aha-text-tertiary,#616161) }
.aha-topic-row__stat{ display:inline-flex; align-items:center; gap:var(--aha-space-4,4px); white-space:nowrap }
.aha-topic-row__sr{ position:absolute; width:1px; height:1px; margin:-1px; padding:0; overflow:hidden;
  clip:rect(0 0 0 0); white-space:nowrap; border:0 }
`;

export default TOPIC_ROW_CSS;
