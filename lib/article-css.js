/**
 * @ahaslides-product/design/article-css: the Article body class layer as a string, the source of the
 * generated lib/article.css. Every rule sits under .aha-article-prose and needs lib/tokens.css first.
 */
export const ARTICLE_PROSE_CSS = `
.aha-article-prose{box-sizing:border-box;max-inline-size:720px;font-family:var(--aha-font-product);font-size:var(--aha-size-l);font-weight:var(--aha-weight-regular);line-height:var(--aha-line-height-body);color:var(--aha-text-default);overflow-wrap:break-word}
.aha-article-prose *{box-sizing:border-box}
.aha-article-prose>:first-child{margin-top:0}
.aha-article-prose :is(h2,h3,h4){font-weight:var(--aha-weight-semibold);line-height:var(--aha-line-height-heading);color:var(--aha-text-default);scroll-margin-top:var(--aha-space-96)}
.aha-article-prose h2{font-size:var(--aha-size-h3);margin:var(--aha-space-48) 0 var(--aha-space-16)}
.aha-article-prose h3{font-size:var(--aha-size-h4);margin:var(--aha-space-32) 0 var(--aha-space-12)}
.aha-article-prose h4{font-size:var(--aha-size-xl);margin:var(--aha-space-24) 0 var(--aha-space-8)}
.aha-article-prose :is(p,ul,ol){margin:0 0 var(--aha-space-16)}
.aha-article-prose :is(ul,ol){padding-inline-start:var(--aha-space-24)}
.aha-article-prose li+li,.aha-article-prose li>:is(ul,ol){margin-top:var(--aha-space-8)}
.aha-article-prose li>:is(ul,ol){margin-bottom:0}
.aha-article-prose :is(strong,b){font-weight:var(--aha-weight-semibold)}
.aha-article-prose :is(em,i){font-style:italic}
.aha-article-prose :is(s,del){text-decoration:line-through}
.aha-article-prose a{color:var(--aha-text-link);font-weight:var(--aha-weight-regular);text-decoration:underline;border-radius:var(--aha-radius-xs);transition:color var(--aha-motion-fast) var(--aha-ease-out)}
.aha-article-prose a:visited{color:var(--aha-text-link)}
.aha-article-prose a:hover{color:var(--aha-text-link-hover)}
.aha-article-prose a:active{color:var(--aha-color-primary-active)}
.aha-article-prose a:focus-visible{outline:var(--aha-space-2) solid var(--aha-focus);outline-offset:var(--aha-space-2)}
.aha-article-prose :is(blockquote,.aha-article-callout) a,.aha-article-prose :is(blockquote,.aha-article-callout) a:visited{color:var(--aha-text-default)}
.aha-article-prose :is(blockquote,.aha-article-callout) a:hover{color:var(--aha-text-link-hover)}
.aha-article-prose :is(blockquote,.aha-article-callout) a:active{color:var(--aha-color-primary-active)}
.aha-article-prose blockquote{margin:var(--aha-space-24) 0;padding:var(--aha-space-24);border:0;border-radius:var(--aha-radius-default);background:var(--aha-bg-accent)}
.aha-article-prose blockquote>:last-child{margin-bottom:0}
.aha-article-prose cite{display:block;margin-top:var(--aha-space-8);font-size:var(--aha-size-default);font-style:normal;color:var(--aha-text-secondary)}
.aha-article-prose figure{margin:var(--aha-space-24) 0}
.aha-article-prose img{display:block;max-width:100%;height:auto;border-radius:var(--aha-radius-default)}
.aha-article-prose figure>img{width:100%}
.aha-article-prose figure>iframe{display:block;width:100%;height:auto;aspect-ratio:16/9;border:0;border-radius:var(--aha-radius-default)}
.aha-article-prose figcaption{margin-top:var(--aha-space-8);font-size:var(--aha-size-default);line-height:var(--aha-line-height-body);color:var(--aha-text-secondary);text-align:center}
.aha-article-prose code{padding:var(--aha-space-2) var(--aha-space-4);border-radius:var(--aha-radius-xs);background:var(--aha-bg-container-secondary);font-family:var(--aha-font-mono);font-size:var(--aha-size-default)}
.aha-article-prose pre{margin:var(--aha-space-24) 0;padding:var(--aha-space-16);white-space:pre-wrap;overflow-wrap:anywhere;border:1px solid var(--aha-border-default);border-radius:var(--aha-radius-default);background:var(--aha-white);font-family:var(--aha-font-mono);font-size:var(--aha-size-default);line-height:var(--aha-line-height-body)}
.aha-article-prose pre code{padding:0;background:none}
.aha-article-prose hr{margin:var(--aha-space-32) 0;border:0;border-top:1px solid var(--aha-border-default)}
.aha-article-prose__table{margin:var(--aha-space-24) 0;overflow-x:auto;border:1px solid var(--aha-border-default);border-radius:var(--aha-radius-default)} /* ds-lint-allow: overflow-x-scroll (a wide data table scrolls sideways inside its own frame; the page does not) */
.aha-article-prose__table:focus-visible{outline:var(--aha-space-2) solid var(--aha-focus);outline-offset:var(--aha-space-2)}
.aha-article-prose table{width:100%;border-collapse:collapse;font-size:var(--aha-size-default);line-height:var(--aha-line-height-body)}
.aha-article-prose :is(th,td){min-width:120px;padding:var(--aha-space-12) var(--aha-space-16);border-bottom:1px solid var(--aha-border-default);text-align:start;vertical-align:top}
.aha-article-prose th{font-weight:var(--aha-weight-semibold)}
.aha-article-prose thead th{border-bottom-color:var(--aha-border-strong)}
.aha-article-prose tbody tr:last-child>*{border-bottom:0}
.aha-article-callout,.aha-article-cta{margin:var(--aha-space-32) 0;padding:var(--aha-space-32) var(--aha-space-24);border-radius:var(--aha-radius-marketing);background:var(--aha-bg-accent)} /* ds-lint-allow: hand-rolled-button (a call-to-action box, not a button; its buttons are aha-button) */
.aha-article-prose .aha-article-callout>h3{margin-top:0}
.aha-article-callout>aha-button{margin-top:var(--aha-space-8)}
.aha-article-callout:is(.aha-article-callout--info,.aha-article-callout--tip,.aha-article-callout--warning){display:flex;align-items:flex-start;gap:var(--aha-space-12);padding:var(--aha-space-24)}
.aha-article-callout--info,.aha-article-callout--warning{background:var(--aha-gray-25)}
.aha-article-callout--tip{background:var(--aha-bg-accent)}
.aha-article-callout__icon{flex:none;color:var(--aha-icon-default)}
.aha-article-callout__body{flex:1;min-width:0}
.aha-article-callout__body>:last-child{margin-bottom:0}
.aha-article-prose::after{content:"";display:block;clear:both}
.aha-article-prose .aha-article-gallery__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start;gap:var(--aha-space-16)}
.aha-article-prose .aha-article-gallery__grid:where(:has(>:nth-child(3):last-child)){grid-template-columns:repeat(3,minmax(0,1fr))}
.aha-article-prose .aha-article-gallery__item{min-width:0;margin:0}
.aha-article-prose .aha-article-gallery__item>img{aspect-ratio:4/3;object-fit:contain;background:var(--aha-bg-container-secondary)}
.aha-article-prose .aha-article-gallery>figcaption{margin-top:var(--aha-space-12)}
.aha-article-frame{--aha-article-gutter:var(--aha-space-64);box-sizing:border-box;container-type:inline-size;width:100%;padding-inline:var(--aha-article-gutter)}
.aha-article-frame>.aha-article-prose{margin-inline:auto}
.aha-article-frame>.aha-article-prose>.aha-article-figure--wide{width:min(1280px,100cqi);margin-inline:calc((100% - min(1280px,100cqi)) / 2)}
.aha-article-frame>.aha-article-prose>.aha-article-figure--full{width:calc(100cqi + 2 * var(--aha-article-gutter));margin-inline:calc((100% - 100cqi) / 2 - var(--aha-article-gutter))}
.aha-article-frame>.aha-article-prose>.aha-article-figure--full :is(img,iframe){border-radius:0}
.aha-article-frame>.aha-article-prose>.aha-article-figure--full>figcaption{padding-inline:var(--aha-article-gutter)}
.aha-article-prose>.aha-article-figure--small{float:inline-start;clear:inline-start;width:40%;margin-block:var(--aha-space-4) var(--aha-space-24);margin-inline:0 var(--aha-space-24)}
.aha-article-prose>.aha-article-figure--small~:is(ul,ol){display:flow-root}
.aha-article-prose>:is(h2,h3,h4,hr,blockquote,pre,figure:not(.aha-article-figure--small),.aha-article-callout,.aha-article-prose__table,aha-grid,.aha-article-cards,.aha-article-cta,.aha-article-poll){clear:both}
.aha-article-prose blockquote.aha-article-pullquote{margin-block:var(--aha-space-48);padding:var(--aha-space-32) 0;border-block:1px solid var(--aha-border-default);border-radius:0;background:none;text-align:center}
.aha-article-prose .aha-article-pullquote p{font-size:var(--aha-size-h4);font-weight:var(--aha-weight-semibold);line-height:var(--aha-line-height-heading);text-wrap:balance}
.aha-article-prose .aha-article-pullquote cite{margin-top:var(--aha-space-16)}
.aha-article-prose .aha-article-video__frame{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:var(--aha-radius-default);background:var(--aha-bg-container-secondary)}
.aha-article-prose .aha-article-video__frame:has(>:is(.aha-article-video__play,iframe):focus-visible){outline:var(--aha-space-2) solid var(--aha-focus);outline-offset:var(--aha-space-2)}
.aha-article-prose .aha-article-video__frame>iframe{display:block;width:100%;height:100%;border:0;border-radius:0}
.aha-article-prose .aha-article-video__play{position:absolute;inset:0;display:block;width:100%;height:100%;margin:0;padding:0;border:0;background:none;font:inherit;color:inherit;text-align:start;cursor:pointer}
.aha-article-prose .aha-article-video__play:focus-visible{outline:none}
.aha-article-prose .aha-article-video__poster{position:absolute;inset:-1.5%;width:103%;height:103%;max-width:none;border-radius:0;object-fit:cover} /* ds-lint-allow: img-cover-crop (a YouTube poster frame is 4:3 with black bars baked around the 16:9 still; cover plus a 3% overscan trims only those bars and their soft edge) */
.aha-article-prose .aha-article-video__icon{position:absolute;top:50%;left:50%;display:grid;place-items:center;width:var(--aha-space-64);height:var(--aha-space-64);border-radius:var(--aha-radius-pill);background:var(--aha-color-primary);color:var(--aha-white);transform:translate(-50%,-50%);transition:background-color var(--aha-motion-fast) var(--aha-ease-out)}
.aha-article-prose .aha-article-video__play:hover .aha-article-video__icon{background:var(--aha-color-primary-hover)}
.aha-article-prose .aha-article-video__play:active .aha-article-video__icon{background:var(--aha-color-primary-active)}
.aha-article-prose .aha-article-video__title{position:absolute;inset-inline-start:var(--aha-space-16);inset-block-end:var(--aha-space-16);display:-webkit-box;max-inline-size:calc(100% - 2 * var(--aha-space-16));overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:2;padding:var(--aha-space-8) var(--aha-space-12);border-radius:var(--aha-radius-default);background:var(--aha-white);color:var(--aha-text-default);font-size:var(--aha-size-default);font-weight:var(--aha-weight-semibold);line-height:var(--aha-line-height-heading)}
.aha-article-frame>.aha-article-prose>.aha-article-figure--full .aha-article-video__frame{border-radius:0}
.aha-article-prose .aha-article-chart__title{margin:0;font-size:var(--aha-size-xl);font-weight:var(--aha-weight-semibold);line-height:var(--aha-line-height-heading);color:var(--aha-text-default)}
.aha-article-prose .aha-article-chart__unit{margin:var(--aha-space-4) 0 0;font-size:var(--aha-size-default);color:var(--aha-text-secondary)}
.aha-article-prose .aha-article-chart>aha-chart{margin-top:var(--aha-space-16)}
.aha-article-prose .aha-article-chart__data{margin-top:var(--aha-space-16)}
.aha-article-prose .aha-article-chart__data>summary{display:inline-flex;align-items:center;gap:var(--aha-space-4);list-style:none;border-radius:var(--aha-radius-xs);font-size:var(--aha-size-default);color:var(--aha-text-link);cursor:pointer;transition:color var(--aha-motion-fast) var(--aha-ease-out)}
.aha-article-prose .aha-article-chart__data>summary::-webkit-details-marker{display:none}
.aha-article-prose .aha-article-chart__data>summary:hover{color:var(--aha-text-link-hover)}
.aha-article-prose .aha-article-chart__data>summary:active{color:var(--aha-color-primary-active)}
.aha-article-prose .aha-article-chart__data>summary:focus-visible{outline:var(--aha-space-2) solid var(--aha-focus);outline-offset:var(--aha-space-2)}
.aha-article-prose .aha-article-chart__data>summary>aha-icon{transition:transform var(--aha-motion-fast) var(--aha-ease-out)}
.aha-article-prose .aha-article-chart__data[open]>summary>aha-icon{transform:rotate(180deg)}
.aha-article-prose .aha-article-chart__hide,.aha-article-prose .aha-article-chart__data[open] .aha-article-chart__show{display:none}
.aha-article-prose .aha-article-chart__data[open] .aha-article-chart__hide{display:inline}
.aha-article-prose .aha-article-chart__data>.aha-article-prose__table{margin:var(--aha-space-12) 0 0}
.aha-article-prose .aha-article-chart>figcaption.aha-article-chart__source{margin-top:var(--aha-space-12);text-align:start}
.aha-article-prose .aha-article-chart:has(>aha-chart:not(:defined))>aha-chart{display:none}
.aha-article-prose .aha-article-cards{container:aha-marketing-cards/inline-size;display:grid;grid-template-columns:minmax(0,1fr);gap:var(--aha-space-16);margin:var(--aha-space-32) 0}
.aha-article-prose .aha-article-cards:has(>:nth-child(2):last-child){grid-template-columns:repeat(2,minmax(0,1fr))}
.aha-article-prose .aha-article-cards:has(>:nth-child(3):last-child){grid-template-columns:repeat(3,minmax(0,1fr))}
.aha-article-prose .aha-article-cards>.aha-marketing-card:only-child{flex-direction:row}
.aha-article-prose .aha-article-cards>.aha-marketing-card:only-child>.aha-marketing-card__media{flex:0 0 40%;align-self:flex-start}
.aha-article-prose .aha-article-cards :is(h3,p){margin:0}
.aha-article-prose .aha-article-cards h3.aha-marketing-card__title{font-size:var(--aha-size-xl)}
.aha-article-prose .aha-article-cards a:is(:link,:visited,:hover,:active){color:inherit;font-weight:inherit}
.aha-article-prose .aha-article-cards .aha-marketing-card__link{text-decoration:none}
.aha-article-prose .aha-article-cards .aha-marketing-card__link:focus-visible{outline:none}
.aha-article-prose .aha-article-cards .aha-marketing-card__media img{height:100%;border-radius:0}
.aha-article-prose .aha-article-cards .aha-marketing-card__media--fill img{height:auto}
.aha-article-prose .aha-article-cta__title{margin:0 0 var(--aha-space-8)}
.aha-article-prose .aha-article-cta__text{margin:0}
.aha-article-cta__actions{display:flex;flex-wrap:wrap;gap:var(--aha-space-12);margin-top:var(--aha-space-24)}
.aha-article-prose .aha-article-game__stage{position:relative;display:grid;place-items:center;aspect-ratio:16/10;overflow:hidden;padding:var(--aha-space-24);border:1px solid var(--aha-border-secondary);border-radius:var(--aha-radius-default);background:var(--aha-bg-container-secondary)}
.aha-article-prose .aha-article-game__stage:has(>iframe){padding:0}
.aha-article-prose .aha-article-game__stage:has(>iframe:focus-visible){outline:var(--aha-space-2) solid var(--aha-focus);outline-offset:var(--aha-space-2)}
.aha-article-prose .aha-article-game__stage>iframe{position:absolute;inset:0;display:block;width:100%;height:100%;border:0;border-radius:0}
.aha-article-prose .aha-article-game__poster{position:absolute;inset:0;width:100%;height:100%;max-width:none;border-radius:0;object-fit:cover} /* ds-lint-allow: img-cover-crop (game cover art is a backdrop behind the white title panel, as on the library game page; the panel carries the title, so a cropped edge loses nothing) */
.aha-article-prose .aha-article-game__panel{position:relative;display:flex;flex-direction:column;align-items:center;gap:var(--aha-space-16);max-inline-size:100%;padding:var(--aha-space-24);border-radius:var(--aha-radius-lg);background:var(--aha-bg-container);text-align:center}
.aha-article-prose .aha-article-game__play{max-inline-size:100%}
.aha-article-prose .aha-article-game__title{margin:0;font-size:var(--aha-size-h4);font-weight:var(--aha-weight-semibold);line-height:var(--aha-line-height-heading);color:var(--aha-text-default);overflow-wrap:anywhere}
.aha-article-frame>.aha-article-prose>.aha-article-figure--full .aha-article-game__stage{border-inline:0;border-radius:0}
.aha-article-poll{margin:var(--aha-space-32) 0;padding:var(--aha-space-24);border:1px solid var(--aha-border-default);border-radius:var(--aha-radius-marketing);background:var(--aha-bg-container)}
.aha-article-prose .aha-article-poll__label{margin:0 0 var(--aha-space-8);font-size:var(--aha-size-sm);font-weight:var(--aha-weight-semibold);letter-spacing:var(--aha-letter-spacing-subheadings);text-transform:uppercase;color:var(--aha-text-default)}
.aha-article-prose .aha-article-poll__question{margin:0 0 var(--aha-space-16);font-size:var(--aha-size-xl);font-weight:var(--aha-weight-semibold);line-height:var(--aha-line-height-heading)}
.aha-article-poll__options{display:grid;gap:var(--aha-space-8)}
.aha-article-poll__option{display:flex;align-items:center;justify-content:space-between;gap:var(--aha-space-12);width:100%;min-height:var(--aha-space-48);margin:0;padding:var(--aha-space-12) var(--aha-space-16);border:1px solid var(--aha-border-default);border-radius:var(--aha-radius-default);background:var(--aha-bg-container);font:inherit;font-size:var(--aha-size-l);line-height:var(--aha-line-height-body);color:var(--aha-text-default);text-align:start;cursor:pointer;transition:border-color var(--aha-motion-fast) var(--aha-ease-out),background-color var(--aha-motion-fast) var(--aha-ease-out)}
.aha-article-poll__option:not([aria-disabled="true"]):hover,.aha-article-poll__option[aria-pressed="true"]{border-color:var(--aha-color-primary);background:var(--aha-bg-accent)}
.aha-article-poll__option:not([aria-disabled="true"]):active{border-color:var(--aha-color-primary-active)}
.aha-article-poll__option:focus-visible{outline:var(--aha-space-2) solid var(--aha-focus);outline-offset:var(--aha-space-2)}
.aha-article-poll__option[aria-disabled="true"]{cursor:default}
.aha-article-poll__option[data-answer="correct"]{border-color:var(--aha-answer-correct);background:var(--aha-answer-correct-tint-5)}
.aha-article-poll__option[data-answer="wrong"]{border-color:var(--aha-answer-wrong);background:var(--aha-answer-wrong-tint-5)}
.aha-article-poll__option>aha-answer-mark{flex:none}
.aha-article-poll__result:empty,.aha-article-poll[data-state="open"] .aha-article-poll__result{display:none}
.aha-article-poll:not(.aha-article-poll--quiz):is([data-state="answered"],[data-state="pending"]) .aha-article-poll__options{display:none}
.aha-article-poll--quiz .aha-article-poll__result{margin-top:var(--aha-space-16)}
.aha-article-poll__result:focus{outline:none}
.aha-article-prose .aha-article-poll__note{margin:var(--aha-space-12) 0 0;font-size:var(--aha-size-default);color:var(--aha-text-secondary)}
.aha-article-prose .aha-article-poll__result>.aha-article-poll__note:first-child{margin-top:0;font-size:var(--aha-size-l);color:var(--aha-text-default)}
.aha-article-poll__explanation{display:flex;align-items:flex-start;gap:var(--aha-space-12);padding:var(--aha-space-16);border-radius:var(--aha-radius-default);background:var(--aha-gray-25)}
.aha-article-poll__explanation>aha-answer-mark{flex:none;margin-top:var(--aha-space-2)}
.aha-article-poll__explanation>p{margin:0}
.aha-article-poll__explanation+aha-chart{margin-top:var(--aha-space-16)}
@supports selector(::details-content){
  .aha-article-prose .aha-article-chart:has(>aha-chart:not(:defined))>.aha-article-chart__data>summary{display:none}
  .aha-article-prose .aha-article-chart:has(>aha-chart:not(:defined))>.aha-article-chart__data::details-content{content-visibility:visible;display:block}
  .aha-article-prose .aha-article-chart:has(>aha-chart:not(:defined))>.aha-article-chart__data>.aha-article-prose__table{margin-top:0}
}
@media (prefers-reduced-motion:reduce){
  .aha-article-prose a{transition:none}
  .aha-article-prose :is(.aha-article-video__icon,.aha-article-chart__data>summary,.aha-article-chart__data>summary>aha-icon){transition:none}
  .aha-article-poll__option{transition:none}
}
@media (max-width:767px){
  .aha-article-prose .aha-article-video__icon{width:var(--aha-space-48);height:var(--aha-space-48)}
  .aha-article-prose .aha-article-video__title{inset-inline-start:var(--aha-space-12);inset-block-end:var(--aha-space-12);max-inline-size:calc(100% - 2 * var(--aha-space-12));-webkit-line-clamp:1}
  .aha-article-prose .aha-article-chart__title{font-size:var(--aha-size-l)}
  .aha-article-prose .aha-article-cards:is(:has(>:nth-child(2):last-child),:has(>:nth-child(3):last-child)){grid-template-columns:minmax(0,1fr)}
  .aha-article-prose .aha-article-game__title{font-size:var(--aha-size-xl)}
  .aha-article-prose h2{font-size:var(--aha-size-h4);margin-top:var(--aha-space-32)}
  .aha-article-prose h3{font-size:var(--aha-size-xl)}
  .aha-article-prose h4{font-size:var(--aha-size-l)}
  .aha-article-frame{--aha-article-gutter:var(--aha-space-24)}
  .aha-article-prose .aha-article-gallery__grid{gap:var(--aha-space-12)}
  .aha-article-prose blockquote.aha-article-pullquote{margin-block:var(--aha-space-32);padding-block:var(--aha-space-24)}
  .aha-article-prose .aha-article-pullquote p{font-size:var(--aha-size-xl)}
}
@media (max-width:479px){
  .aha-article-frame{--aha-article-gutter:var(--aha-space-16)}
  .aha-article-prose .aha-article-gallery__grid{grid-template-columns:minmax(0,1fr)}
  .aha-article-prose .aha-article-gallery__item>img{aspect-ratio:auto}
  .aha-article-prose>.aha-article-figure--small{float:none;width:auto;margin-block:var(--aha-space-24);margin-inline:0}
  .aha-article-prose blockquote.aha-article-pullquote{margin-block:var(--aha-space-24);padding-block:var(--aha-space-16)}
  .aha-article-prose .aha-article-pullquote p{font-size:var(--aha-size-h6)}
  .aha-article-callout,.aha-article-cta{padding:var(--aha-space-24) var(--aha-space-16)} /* ds-lint-allow: hand-rolled-button (a call-to-action box, not a button; its buttons are aha-button) */
  .aha-article-prose .aha-article-cards>.aha-marketing-card:only-child{flex-direction:column}
  .aha-article-prose .aha-article-cards>.aha-marketing-card:only-child>.aha-marketing-card__media{flex:none}
  .aha-article-prose .aha-article-game__stage{aspect-ratio:3/4;padding:var(--aha-space-16)}
  .aha-article-prose .aha-article-game__panel{padding:var(--aha-space-16)}
  .aha-article-poll{padding:var(--aha-space-16)}
  .aha-article-callout:is(.aha-article-callout--info,.aha-article-callout--tip,.aha-article-callout--warning){padding:var(--aha-space-16)}
}
`;
