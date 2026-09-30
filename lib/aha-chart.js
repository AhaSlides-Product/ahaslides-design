/**
 * @ahaslides-product/design/aha-chart — the AhaSlides chart library: one framework-free element that
 * draws every result chart with the same look everywhere.
 *
 *   import '@ahaslides-product/design/aha-chart';   // registers <aha-chart> (+ <aha-live-region>, <aha-icon>)
 *   <aha-chart type="bar" label="Top priorities"></aha-chart>
 *   chart.data = [{ label: 'Better onboarding', value: 258 }, { label: 'Google Slides sync', value: 219 }];
 *
 * Types and their data (the `data` property, or JSON in the `data` attribute):
 *   bar · column          [{ label, value, image?, correct? }]    (column turns into bars when its labels don't fit)
 *   donut · radial · treemap · wordcloud   [{ label, value }]    (wordcloud also takes plain strings: one per response)
 *   stacked               { series: ['Salary', 'Team'], rows: [{ label: 'All', values: [31, 16] }] }
 *   bell                  { scale: [1, 2, 3, 4, 5], anchors: ['Disagree', 'Agree'], series: [{ label, counts: [..] }] }
 *   radar                 { dimensions: [..], scale: 5 | 10 | 100, subjects: [{ label, scores: [..], responses: [..] }], people }
 *   quadrant              { x: { title, low, high, min, max }, y: {..}, zones: [4 labels], groups: [..], points: [{ label, x, y, group }] }
 *   mindmap               { label: 'Root idea', children: [{ label, children: [...] }] }
 *
 * Where it is used decides the colours:
 *   palette="brand" (default)  Report and every other app screen: the --aha-viz-* brand chart palette.
 *   palette="deck"             presenting / audience canvas: series come from the deck's
 *                              presentationColorPalette (`colors`), text from the deck text colour (`ink`).
 * The chart never paints a background.
 *
 * Shared options: number-format (count | percent | both), sort (none | desc | asc), highlight-top (N),
 * log-scale, legend (on | off), tooltip (on | off), max-items (the cap before an "Other" bucket),
 * page-size (bar pagination), correct (Pick Answer: the correct option's index), correct-style
 * (fill | indicator), responses (respondent count). Type-specific options go in the `options` property
 * (or JSON `options` attribute) — see `chartOptionDefaults`. Built-in copy follows `locale` (Intl formats
 * the numbers); pass translated copy through `strings`. Every chart ships a text summary, a visually
 * hidden data table and a polite live-region announcement when its data changes; `replay()` re-runs
 * the entrance animation.
 */
import './aha-live-region.js';
import './icons.js';

/** Built-in copy per language. Pass `strings` to override any key with the Presenter app's translations. */
export const chartStrings = {
  en: {
    typeNames: {
      bar: 'Bar chart', column: 'Column chart', stacked: 'Stacked bar chart', donut: 'Donut chart', radial: 'Radial bar chart',
      treemap: 'Tree map', quadrant: 'Quadrant chart', bell: 'Rating distribution', radar: 'Radar chart', wordcloud: 'Word cloud', mindmap: 'Mind map',
    },
    other: 'Other',
    otherCount: 'Other ({count})',
    responses: { one: '{count} response', other: '{count} responses' },
    responsesUnit: { one: 'response', other: 'responses' },
    people: { one: '{count} person', other: '{count} people' },
    submissions: { one: '{count} submission', other: '{count} submissions' },
    item: 'Item',
    count: 'Count',
    share: 'Share',
    word: 'Word',
    level: 'Level',
    group: 'Group',
    average: 'Average',
    correct: 'correct answer',
    rank: 'Rank {rank}',
    page: '{from}–{to} of {total}',
    rankPage: 'Ranks {from}–{to} of {total}',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    summary: '{type}. Options: {items}. {responses}.',
    leader: 'Highest: {label}, {value}.',
    correctSummary: 'Correct answer: {label}, {value}.',
    emptySummary: '{type}. No responses yet.',
    stackedSummary: '{type}. Groups: {rows}. Categories: {series}.',
    wordcloudSummary: '{type}. Words: {items}. {responses}.',
    wordcloudLeader: 'Most frequent: {label}, {value}.',
    mindmapSummary: '{type}: {label}. Branches: {branches}. Ideas: {ideas}.',
    quadrantSummary: '{type}: {y} against {x}. Points: {items}.',
    bellSummary: '{type}. Statements: {items}. {responses}.',
    bellStatement: '{label}: average {value}.',
    radarSummary: '{type}. Criteria: {items}. {responses}.',
    radarSubject: '{label}: average {value}.',
    updated: 'Chart updated. {summary}',
    radialScale: 'Scale: a full {sweep}° ring = {value}',
    quadrantTooManyGroups: '{count} groups is more than 3 colours, so every point uses one colour.',
    bellLevel: 'Level {level}',
    bellAverage: 'Average for {label}: {value}',
    radarAverage: 'Avg {value}',
    radarNoResponses: 'no responses yet',
    radarSubjectFallback: 'Subject {index}',
    radarMeta: '{people} · scale {scale}',
    radarScale: 'Scale {scale}',
    wordcloudHidden: '{count} words hidden ({submissions})',
    wordcloudUndo: 'Undo “{word}”',
    wordcloudRestoreAll: 'Show all again',
    wordcloudAllHidden: 'Every word is hidden. Use “Show all again” to bring them back.',
    wordcloudHideHint: 'Click to hide this word',
    wordcloudHideHintTouch: 'Tap again to hide this word',
    wordcloudHideKey: 'Press Delete to hide it.',
    wordcloudMerged: 'Merged: {variants}',
    mindmapMore: '+{count} ideas',
    mindmapLevel: 'Level {depth}: {label}',
    mindmapChildren: '{count} ideas under it',
    mindmapCollapse: 'Collapse “{label}”',
    mindmapExpand: 'Show the {count} ideas under “{label}”',
    mindmapAdd: 'Add an idea under “{label}”',
    mindmapAddBranch: 'Add a branch',
    mindmapMaxBranches: 'Up to {count} branches',
    mindmapNewIdea: 'New idea…',
    mindmapEdit: 'Edit “{label}”',
    mindmapEditHint: 'Double-click or press Enter to edit',
    mindmapNotEmpty: 'Can’t be empty',
  },
  vi: {
    typeNames: {
      bar: 'Biểu đồ thanh', column: 'Biểu đồ cột', stacked: 'Biểu đồ thanh chồng', donut: 'Biểu đồ vành khuyên', radial: 'Biểu đồ vòng',
      treemap: 'Biểu đồ ô', quadrant: 'Ma trận 2×2', bell: 'Phân bố đánh giá', radar: 'Biểu đồ radar', wordcloud: 'Đám mây từ', mindmap: 'Sơ đồ tư duy',
    },
    other: 'Khác',
    otherCount: 'Khác ({count})',
    responses: { other: '{count} câu trả lời' },
    responsesUnit: { other: 'câu trả lời' },
    people: { other: '{count} người' },
    submissions: { other: '{count} lượt' },
    item: 'Mục',
    count: 'Số lượng',
    share: 'Tỉ lệ',
    word: 'Từ',
    level: 'Mức',
    group: 'Nhóm',
    average: 'Trung bình',
    correct: 'đáp án đúng',
    rank: 'Hạng {rank}',
    page: '{from}–{to} / {total}',
    rankPage: 'Hạng {from}–{to} / {total}',
    previousPage: 'Trang trước',
    nextPage: 'Trang sau',
    summary: '{type}. Số lựa chọn: {items}. {responses}.',
    leader: 'Cao nhất: {label}, {value}.',
    correctSummary: 'Đáp án đúng: {label}, {value}.',
    emptySummary: '{type}. Chưa có câu trả lời.',
    stackedSummary: '{type}, {rows} nhóm trên {series} hạng mục.',
    wordcloudSummary: '{type}. Số từ: {items}. {responses}.',
    wordcloudLeader: 'Nhiều nhất: {label}, {value}.',
    mindmapSummary: '{type} về {label}: {branches} nhánh, {ideas} ý tưởng.',
    quadrantSummary: '{type}: {y} theo {x}. Số điểm: {items}.',
    bellSummary: '{type}. Số phát biểu: {items}. {responses}.',
    bellStatement: '{label}: trung bình {value}.',
    radarSummary: '{type}. Số tiêu chí: {items}. {responses}.',
    radarSubject: '{label}: trung bình {value}.',
    updated: 'Biểu đồ đã cập nhật. {summary}',
    radialScale: 'Thang: vòng đầy {sweep}° = {value}',
    quadrantTooManyGroups: 'Có {count} nhóm, vượt 3 màu, nên mọi điểm dùng một màu.',
    bellLevel: 'Mức {level}',
    bellAverage: 'Trung bình {label}: {value}',
    radarAverage: 'TB {value}',
    radarNoResponses: 'chưa có lượt',
    radarSubjectFallback: 'Đối tượng {index}',
    radarMeta: '{people} · thang {scale}',
    radarScale: 'Thang {scale}',
    wordcloudHidden: 'Đã ẩn {count} từ ({submissions})',
    wordcloudUndo: 'Hoàn tác “{word}”',
    wordcloudRestoreAll: 'Hiện lại tất cả',
    wordcloudAllHidden: 'Đã ẩn hết các từ. Bấm “Hiện lại tất cả” để khôi phục.',
    wordcloudHideHint: 'Bấm để ẩn từ này',
    wordcloudHideHintTouch: 'Chạm lần nữa để ẩn',
    wordcloudHideKey: 'Nhấn Delete để ẩn.',
    wordcloudMerged: 'Gộp: {variants}',
    mindmapMore: '+{count} ý tưởng',
    mindmapLevel: 'Cấp {depth}: {label}',
    mindmapChildren: '{count} ý con',
    mindmapCollapse: 'Thu gọn “{label}”',
    mindmapExpand: 'Mở {count} ý con của “{label}”',
    mindmapAdd: 'Thêm ý tưởng con cho “{label}”',
    mindmapAddBranch: 'Thêm nhánh mới',
    mindmapMaxBranches: 'Tối đa {count} nhánh',
    mindmapNewIdea: 'Ý tưởng mới…',
    mindmapEdit: 'Sửa “{label}”',
    mindmapEditHint: 'Nhấp đúp hoặc Enter để sửa',
    mindmapNotEmpty: 'Không để trống',
  },
};

/** Defaults for the type-specific `options` property; any key you pass overrides its default. */
export const chartOptionDefaults = {
  donut: { variant: 'donut', labels: 'auto', maxSize: 320 },
  radial: { maxSize: 380 },
  treemap: { height: 360 },
  quadrant: { maxSize: 460 },
  bell: {
    height: 280, showFill: true, showPoints: true, showAverage: true, showEndLabels: true, showAnchorLabels: true, showTooltip: true,
    showStepLabels: false, showGrid: false, showYAxis: false, showBars: false, showSdBand: false, showMeanLine: false,
  },
  radar: {
    height: 420, form: 'filled', grid: 'polygon', rings: 'plain', scoreStyle: 'chip', reveal: 'bloom', pace: 'token',
    showAxisLabels: true, showScores: true, showPoints: true, showTooltip: true, showLegend: true, showTable: false,
    showScaleTicks: false, hollowCentre: false,
  },
  wordcloud: {
    height: 380, shape: 'rect', maskSrc: null, rotation: 'none', colour: 'palette', fontScale: 'sqrt',
    removable: true, showTooltip: true, showCounts: false, group: true, foldDiacritics: false, maxWords: 120,
  },
  mindmap: { pageSize: 5, maxDepth: 5, maxBranches: 6, editable: false },
};

const TYPES = ['bar', 'column', 'stacked', 'donut', 'radial', 'treemap', 'quadrant', 'bell', 'radar', 'wordcloud', 'mindmap'];
const SVG_NS = 'http://www.w3.org/2000/svg';
const CATEGORY_CAP = 6;
const DENSE_ABOVE = 6;
const SINGLE_COLOUR_ABOVE = 6;
const ANNOUNCE_THROTTLE_MS = 1500;
const MOTION_FALLBACK = { enter: 600, update: 400, reorder: 350, stagger: 40 };
const RADAR_STAGE_PACE_MS = 2600;
const RADAR_WAITING_LOOP_MS = 3600;
const NEUTRAL = 'var(--_neutral)';
const CORRECT = 'var(--_correct)';
const INK = 'var(--aha-viz-ink, #313131)';
const INK_INVERSE = 'var(--aha-viz-ink-inverse, #FFFFFF)';
const BRAND_SERIES_COUNT = 6;

const STYLE = `
:host{ display:block; position:relative; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif); background:transparent }
:host([hidden]){ display:none }
.root{ position:relative; font-family:inherit; font-size:var(--aha-viz-font-label,16px); line-height:1.45;
  font-variant-numeric:tabular-nums; color:var(--_ink); background:transparent;
  --_ink:var(--aha-viz-ink,#313131);
  --_ink-inverse:var(--aha-viz-ink-inverse,#FFFFFF);
  --_ink-2:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-secondary,76%), transparent);
  --_ink-3:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-tertiary,54%), transparent);
  --_axis:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-axis,26%), transparent);
  --_grid:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-grid,12%), transparent);
  --_track:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-track,7%), transparent);
  --_stroke:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-stroke,10%), transparent);
  --_stroke-chip:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-stroke-chip,20%), transparent);
  --_hover:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-hover,8%), transparent);
  --_active:color-mix(in srgb, var(--_ink) var(--aha-viz-mix-active,16%), transparent);
  --_s1:var(--aha-viz-series-1,#714CF5); --_s2:var(--aha-viz-series-2,#E96144); --_s3:var(--aha-viz-series-3,#189D96);
  --_s4:var(--aha-viz-series-4,#A95166); --_s5:var(--aha-viz-series-5,#D49900); --_s6:var(--aha-viz-series-6,#4491C4);
  --_t1:var(--aha-viz-tint-1,#EAE4FE); --_t2:var(--aha-viz-tint-2,#FCE7E1); --_t3:var(--aha-viz-tint-3,#DCF0EE);
  --_t4:var(--aha-viz-tint-4,#F6E5E9); --_t5:var(--aha-viz-tint-5,#F8EDD3); --_t6:var(--aha-viz-tint-6,#E2EEF6);
  --_neutral:var(--aha-viz-neutral,#A8A29B);
  --_correct:var(--aha-color-success,#16C49A);
  --_radius:var(--aha-radius-default,8px);
  --_radius-chip:var(--aha-radius-xs,4px);
  --_bar:var(--aha-viz-bar-thickness,38px);
  --_stub:var(--aha-viz-stub-length,24px);
  --_plot-height:var(--aha-viz-plot-height,260px);
  --_blur:20px;
  --_ease:var(--aha-ease-viz,cubic-bezier(0.2,0.7,0.4,1)) }
.root.is-deck{ --_neutral:color-mix(in srgb, var(--_ink) 42%, transparent) }
.viz{ display:flex; gap:16px; align-items:flex-start; width:100% }
.plot{ position:relative; flex:1 1 auto; min-width:0; container-type:inline-size }
.legend{ flex:0 0 26%; min-width:104px; max-width:26%; display:flex; flex-direction:column; container-type:inline-size }
.legend[hidden]{ display:none }
.viz.is-grouped{ justify-content:center; align-items:center; column-gap:40px }
.is-grouped .plot{ flex:0 1 auto; container-type:normal }
.is-grouped .legend{ flex:0 1 auto; width:max-content; container-type:normal }
.lg-item{ display:grid; grid-template-columns:var(--aha-viz-legend-swatch,14px) minmax(0,1fr) auto; grid-template-areas:"swatch label value";
  column-gap:8px; align-items:start; width:100%; min-height:44px; padding:12px 8px; margin:0; border:0; border-radius:var(--_radius);
  background:transparent; text-align:left; color:var(--_ink-2); font:inherit; line-height:20px;
  transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease), background-color var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease), transform var(--aha-motion-fast,.1s) var(--_ease) }
button.lg-item{ cursor:pointer }
.lg-item:hover, .lg-item.is-hl{ background:var(--_hover) }
button.lg-item:active{ background:var(--_active); transform:scale(.96) }
.lg-item:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
.swatch{ grid-area:swatch; flex:none; display:inline-block; width:var(--aha-viz-legend-swatch,14px); height:var(--aha-viz-legend-swatch,14px); margin-top:3px;
  border-radius:min(var(--_radius-chip),50%); background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke-chip) }
.lg-label{ grid-area:label; min-width:0; overflow-wrap:break-word; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden }
.lg-value{ grid-area:value; color:var(--_ink-3); white-space:nowrap; text-align:right }
.lg-item[aria-pressed="false"] .swatch{ background:transparent; box-shadow:inset 0 0 0 1px var(--_ink-3) }
.lg-item[aria-pressed="false"] .lg-label{ color:var(--_ink-3); text-decoration:line-through }
@container (max-width:200px){
  .lg-item{ grid-template-columns:var(--aha-viz-legend-swatch,14px) minmax(0,1fr); grid-template-areas:"swatch label" ". value"; padding:6px 8px }
  .lg-value{ text-align:left }
}
@media (max-width:719px){ .viz.is-grouped{ column-gap:16px } }
.root.is-narrow .viz{ flex-direction:column; align-items:stretch }
.root.is-narrow .legend{ flex:none; max-width:none; width:100%; flex-direction:row; flex-wrap:wrap }
.root.is-narrow .lg-item{ width:auto; min-height:32px; padding:6px 8px }

.is-dim, .is-faded{ opacity:var(--aha-viz-mix-dim,38%) }
[data-cat]{ transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.bar-row:is(.is-dim,.is-faded), .node.is-faded{ opacity:1 }
.bar-row:is(.is-dim,.is-faded) :is(.bar-img,.bar-head,.bar-fill,.value), .node.is-faded > *{ opacity:var(--aha-viz-mix-dim,38%) }
:is(.pager-button,.lg-item:hover,.lg-item.is-hl,.bar-track,.q-field,.q-zone,.tm-chip,.bell-average,.rd-axis.is-hl,.rd-row.is-hl,.rd-number,.node-2,.node-3,.node-button,.node input,.word.is-removable:hover,.tip){
  -webkit-backdrop-filter:blur(var(--_blur)); backdrop-filter:blur(var(--_blur)) }
.clip{ display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:1; overflow:hidden; overflow-wrap:anywhere }
.value{ display:flex; flex-wrap:wrap; justify-content:center; align-items:baseline; column-gap:6px; line-height:1.25 }
.value-main{ font-size:var(--aha-viz-font-value,20px); font-weight:600; color:var(--_ink) }
.value-sub{ color:var(--_ink-3); font-size:var(--aha-viz-font-label,16px) }
.value-sub:empty{ display:none }
.correct-badge{ display:inline-flex; vertical-align:-3px; margin-right:4px; color:var(--_correct) }
.note{ margin:8px 0 0; color:var(--_ink-3); text-align:center }
.note:empty, .note[hidden]{ display:none }
.button{ display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:44px; padding:0 14px; border:1px solid var(--_stroke-chip);
  border-radius:var(--_radius); background:transparent; color:var(--_ink); font:inherit; cursor:pointer;
  transition:transform var(--aha-motion-fast,.1s) var(--_ease), background-color var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease) }
.button:hover{ background:var(--_hover) }
.button:active{ background:var(--_active); transform:scale(.96) }
.button:disabled{ opacity:.38; cursor:default }
.button:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }

.bar-list{ position:relative; overflow:clip; overflow-clip-margin:4px }
.bar-row{ position:absolute; left:0; right:0; top:0; display:flex; gap:12px; align-items:stretch; border-radius:var(--_radius); will-change:transform }
.bars.is-dense{ --_bar:calc(var(--aha-viz-bar-thickness,38px) - 6px) }
.bar-body{ flex:1 1 auto; min-width:0 }
.bar-img{ flex:none; width:calc(26px + var(--_bar)); height:calc(26px + var(--_bar)); object-fit:cover; border-radius:var(--_radius);
  outline:1px solid var(--_stroke); outline-offset:-1px }
.bar-head{ display:flex; gap:8px; align-items:flex-start; line-height:20px; margin-bottom:6px; min-width:0 }
.bar-rank{ flex:none; min-width:1.4ch; color:var(--_ink-3) }
.bar-rank:empty{ display:none }
.bar-label{ flex:0 1 auto; min-width:0; color:var(--_ink-2); overflow-wrap:anywhere; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden }
.bar-label.is-correct{ color:var(--_ink); font-weight:600 }
.bar-line{ display:flex; align-items:center; gap:12px }
.bar-track{ position:relative; flex:1 1 auto; min-width:0; height:var(--_bar); border-radius:var(--_radius); background:var(--_track);
  transition:background-color var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.bar-row:hover .bar-track{ background:var(--_hover) }
.bar-fill{ height:100%; width:0; min-width:var(--_stub); border-radius:var(--_radius); background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke) }
.bar-line .value{ flex:none; justify-content:flex-end; flex-wrap:nowrap; min-width:4ch }
.pager{ display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-top:14px; color:var(--_ink-3) }
.pager[hidden]{ display:none }
.pager-button{ min-width:44px; padding:0 }

.col-area{ position:relative; height:var(--_plot-height); display:flex; align-items:flex-end; gap:var(--aha-viz-column-gap,28px); padding:0 4px }
.columns.has-images .col-area{ height:calc(var(--_plot-height) + 100px) }
.col-labels{ display:flex; gap:var(--aha-viz-column-gap,28px); padding:8px 4px 0 }
.columns.is-dense :is(.col-area,.col-labels){ gap:20px }
.col-slot, .col-label{ --_column:min(var(--aha-viz-column-width,96px),100%); flex:1 1 0; min-width:0; max-width:240px; margin:0 auto }
.col-slot{ position:relative; height:100%; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; border-radius:var(--_radius) }
.col-slot .value{ margin-bottom:8px; text-align:center }
.col-bar{ position:relative; width:var(--_column); height:0; min-height:var(--_stub); border-radius:var(--_radius); background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke) }
.col-img{ display:block; flex:none; width:var(--_column); aspect-ratio:1; object-fit:cover; border-radius:var(--_radius) var(--_radius) 0 0;
  outline:1px solid var(--_stroke); outline-offset:-1px }
.col-img + .col-bar{ border-radius:0 0 var(--_radius) var(--_radius) }
.col-slot.is-zero .col-img{ border-radius:var(--_radius) }
.col-slot.is-zero .col-img + .col-bar{ margin-top:6px; border-radius:var(--_radius) }
.col-label{ display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; color:var(--_ink-2); line-height:1.25 }
.col-label-text{ display:-webkit-box; -webkit-line-clamp:5; -webkit-box-orient:vertical; overflow:hidden; overflow-wrap:anywhere }
.col-label.is-correct .col-label-text{ color:var(--_ink); font-weight:600 }
@container (max-width:480px){ :is(.col-area,.col-labels){ gap:8px } .col-slot .value-sub{ display:none } }

.stack-row{ margin-bottom:22px }
.stack-row:last-child{ margin-bottom:0 }
.stack-label{ margin-bottom:6px; color:var(--_ink-2); line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.stack-bar{ position:relative; display:flex; height:var(--_bar); border-radius:var(--_radius); overflow:hidden; background:var(--_track) }
.stack-bar::after{ content:""; position:absolute; inset:0; border-radius:inherit; box-shadow:inset 0 0 0 1px var(--_stroke); pointer-events:none }
.stack-segment{ flex:none; height:100%; width:0; background:var(--_c); border-right:1px solid var(--_stroke) }
.stack-segment:last-child{ border-right:0 }
.stack-bar.is-empty .stack-segment:first-child{ min-width:var(--_stub); border-radius:var(--_radius) }
.stack-values{ position:relative; height:22px; margin-top:4px }
.stack-value{ position:absolute; top:0; transform:translateX(-50%); color:var(--_ink-2); line-height:22px; white-space:nowrap;
  transition:left var(--aha-motion-viz-update,.4s) var(--_ease), opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
@container (max-width:430px){ .stack-values{ display:none } }

.svg-stage{ position:relative; margin:0 auto }
.svg-stage > svg{ position:absolute; inset:0; overflow:visible }
.donut-centre{ position:absolute; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; pointer-events:none; line-height:1.25 }
.donut-total{ font-size:var(--aha-viz-font-title,24px); font-weight:600 }
.donut-sub{ max-width:80%; color:var(--_ink-3); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.donut-label{ position:absolute; width:150px; line-height:1.25; transform:translateY(-50%) }
.donut-label.is-left{ text-align:right }
.donut-label b{ display:block; font-size:var(--aha-viz-font-value,20px); font-weight:600 }
.donut-label span{ color:var(--_ink-2); display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.donut-label.is-hl span{ color:var(--_ink) }
.footer{ display:flex; flex-direction:column; align-items:center; gap:8px }
.footer:empty{ display:none }
.footer > :is(.pager,.rd-table){ align-self:stretch }
.footer > .pager{ justify-content:flex-end }

.radial-label{ position:absolute; display:flex; gap:6px; justify-content:flex-end; align-items:baseline; line-height:20px; transform:translateY(-50%); white-space:nowrap; overflow:hidden }
.radial-label span{ color:var(--_ink-2); overflow:hidden; text-overflow:ellipsis }
.radial-label b{ flex:none; font-weight:600 }

.tm-stage{ position:relative; border-radius:var(--_radius); overflow:hidden; box-shadow:inset 0 0 0 1px var(--_stroke); background:var(--_track) }
.tm-tile{ position:absolute; border-right:1px solid var(--_stroke); border-bottom:1px solid var(--_stroke) }
.tm-chip{ position:absolute; left:8px; top:8px; max-width:calc(100% - 16px); padding:4px 8px; border-radius:min(var(--_radius-chip),50%); color:var(--_ink); line-height:1.25;
  transition:opacity var(--aha-motion-mid,.2s) var(--aha-ease-in-out,ease) }
.is-deck :is(.tm-chip,.bell-average){ background:color-mix(in srgb, var(--_ink-inverse) 88%, transparent) }
.tm-chip b{ display:block; font-weight:600 }
.tm-chip span{ display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }

.q-box{ display:grid; grid-template-columns:auto 1fr; gap:8px; align-items:center }
.q-y-title{ writing-mode:vertical-rl; transform:rotate(180deg); display:flex; justify-content:space-between; gap:8px; height:100%; color:var(--_ink-3); white-space:nowrap }
.q-field{ position:relative; border:1px solid var(--_grid); border-radius:var(--_radius); background:var(--_track) }
.q-mid-x, .q-mid-y{ position:absolute; background:var(--_axis) }
.q-mid-x{ left:0; right:0; top:50%; height:1px }
.q-mid-y{ top:0; bottom:0; left:50%; width:1px }
.q-zone{ position:absolute; margin:8px; padding:2px 8px; max-width:calc(50% - 16px); border-radius:var(--_radius-chip); background:var(--_active); color:var(--_ink-2); line-height:1.25 }
.q-point{ position:absolute; z-index:2; width:16px; height:16px; margin:-8px 0 0 -8px; padding:0; border:0; border-radius:50%; background:var(--_c); box-shadow:inset 0 0 0 1px var(--_stroke) }
.q-point::before{ content:""; position:absolute; inset:-14px }
.q-point:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
.q-label{ position:absolute; z-index:1; max-width:180px; color:var(--_ink-2); line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; pointer-events:none }
.q-label.is-overflow{ opacity:0 }
.q-point:hover + .q-label, .q-point:focus-visible + .q-label{ color:var(--_ink); font-weight:600 }
.q-point:hover + .q-label.is-overflow, .q-point:focus-visible + .q-label.is-overflow{ opacity:1; z-index:3; max-width:none }
.q-x-title{ grid-column:2; display:flex; justify-content:space-between; gap:12px; color:var(--_ink-3) }
.quadrant.is-compact .q-label{ opacity:0 }
.quadrant.is-compact .q-zone{ margin:4px; padding:0 4px; max-width:calc(50% - 8px); white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.quadrant.is-compact .q-point:hover + .q-label, .quadrant.is-compact .q-point:focus-visible + .q-label{ opacity:1; z-index:3 }

.bell{ display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:8px; align-items:stretch }
.bell-anchor{ writing-mode:vertical-rl; transform:rotate(180deg); max-height:280px; padding-bottom:38px; color:var(--_ink-2); text-align:center; line-height:1.25 }
.bell-anchor[hidden]{ display:none }
.bell-anchor.is-start{ grid-column:1 }
.bell-anchor.is-end{ grid-column:3 }
@container (max-width:300px){ .bell-anchor{ display:none } }
.bell-rows{ grid-column:2; display:grid; gap:16px 40px; min-width:0 }
.bell.is-multi{ grid-template-columns:1fr 1fr; row-gap:4px }
.bell.is-multi .bell-rows{ grid-column:1/-1 }
.bell.is-multi .bell-anchor{ grid-row:2; writing-mode:horizontal-tb; transform:none; padding:0; text-align:left; max-height:none }
.bell.is-multi .bell-anchor.is-start{ grid-column:1 }
.bell.is-multi .bell-anchor.is-end{ grid-column:2; text-align:right }
.bell-title{ margin-bottom:4px; color:var(--_ink); font-weight:600; line-height:1.25; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.bell-title .swatch{ margin:0 8px 0 0; vertical-align:-1px }
.bell-stage{ position:relative; min-width:0 }
.bell-stage > svg{ position:absolute; inset:0; overflow:visible }
.bell-hit{ position:absolute; border-radius:var(--_radius) }
.bell-average{ position:absolute; z-index:2; width:44px; height:44px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-weight:600; color:var(--_ink); line-height:1; box-shadow:inset 0 0 0 2.5px var(--_c) }
.bell-average[hidden]{ display:none }
.tick{ position:absolute; color:var(--_ink-3); line-height:1; white-space:nowrap }

.rd-stage{ position:relative; width:100% }
.rd-stage > svg{ position:absolute; inset:0; width:100%; height:100%; overflow:visible }
.rd-labels, .rd-chips{ position:absolute; inset:0; pointer-events:none }
.rd-axis{ position:absolute; left:0; top:0; margin:0; padding:2px 4px; border:0; border-radius:var(--_radius-chip); background:transparent; color:var(--_ink-2);
  font:inherit; line-height:1.25; cursor:default; pointer-events:auto; overflow-wrap:break-word; transition:color var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease) }
.rd-axis > span{ display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden }
.rd-axis.is-hl{ color:var(--_ink); background:var(--_hover) }
.rd-axis.is-number{ padding:0 }
.rd-number{ display:inline-flex; align-items:center; justify-content:center; flex:none; min-width:26px; height:26px; padding:0 6px; border-radius:min(var(--_radius-chip),50%);
  box-shadow:inset 0 0 0 1px var(--_stroke-chip); font-weight:600; color:var(--_ink); line-height:1 }
.rd-tick{ position:absolute; color:var(--_ink-3); line-height:1; transform:translate(6px,-50%); white-space:nowrap }
.rd-chip{ position:absolute; left:0; top:0; transform:translate(-50%,-50%); font-weight:600; line-height:1.1; white-space:nowrap; color:var(--_ink) }
.rd-chip.is-chip{ padding:3px 8px; border-radius:min(var(--_radius-chip),50%); background:var(--_t1); box-shadow:inset 0 0 0 1px var(--_stroke) }
.rd-chip.is-muted{ color:var(--_ink-3) }
.rd-hit{ fill:transparent; pointer-events:all }
.rd-table{ margin-top:14px; padding-top:12px; border-top:1px solid var(--_grid); display:grid; gap:2px }
.rd-table[hidden]{ display:none }
.rd-row{ display:grid; grid-template-columns:auto minmax(0,1fr) auto; gap:10px; align-items:start; padding:6px 8px; border-radius:var(--_radius); line-height:1.25 }
.rd-row.is-hl{ background:var(--_hover) }
.rd-row-label{ padding-top:3px; color:var(--_ink-2); overflow-wrap:anywhere }
.rd-row-values{ display:flex; flex-wrap:wrap; justify-content:flex-end; gap:4px 12px; padding-top:3px }
.rd-row-values > span{ display:inline-flex; align-items:center; gap:6px; white-space:nowrap }
.rd-row-values .swatch{ margin:0 }
.rd-row-values i{ font-style:normal; color:var(--_ink-3) }
.rd-table.is-narrow .rd-row{ grid-template-columns:auto minmax(0,1fr) }
.rd-table.is-narrow .rd-row-values{ grid-column:2; justify-content:flex-start; padding-top:0 }

.cloud{ position:relative; width:100%; overflow:hidden }
.word{ position:absolute; left:0; top:0; white-space:pre; line-height:1.15; text-align:center; border-radius:var(--_radius-chip); transform-origin:50% 50%; will-change:transform; cursor:default }
.word.is-hl{ z-index:2 }
.word.is-removable{ cursor:pointer }
.word.is-removable:hover, .word.is-removable:focus-visible{ background:var(--_hover) }
.word.is-removable:active{ background:var(--_active) }
.word.is-removable.is-hl{ text-decoration-line:line-through; text-decoration-thickness:max(2px,.07em); text-decoration-skip-ink:none }
.word:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
.word-count{ font-size:var(--aha-viz-font-label,16px); font-weight:400; color:var(--_ink-3) }
.moderation{ display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:8px; margin-top:10px; color:var(--_ink-2) }
.moderation[hidden]{ display:none }
.cloud-note{ position:absolute; inset:0; margin:0; display:flex; align-items:center; justify-content:center; padding:0 16px; text-align:center; color:var(--_ink-3) }
.cloud-note[hidden]{ display:none }

.mindmap{ position:relative; width:100% }
.mindmap-links{ position:absolute; inset:0; overflow:visible; pointer-events:none }
.node{ position:absolute; left:0; top:0; display:flex; align-items:center; gap:8px; min-width:min-content; line-height:1.25; border-radius:var(--_radius); will-change:transform }
.node:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
.node-text{ min-width:min-content; overflow-wrap:break-word }
.node-text[hidden]{ display:none }
.node-1{ justify-content:center; padding:14px 18px; background:var(--_root-fill); color:var(--_root-ink); font-size:var(--aha-viz-font-title,24px); font-weight:600; text-align:center }
.node-2{ padding:6px 6px 6px 12px; background:var(--_tint); box-shadow:inset 0 0 0 1px var(--_stroke); font-size:var(--aha-viz-font-lead,18px); font-weight:600; color:var(--_ink) }
.node-3{ padding:5px 6px 5px 10px; box-shadow:inset 0 0 0 1px var(--_stroke-chip); font-weight:600; color:var(--_ink) }
.node-4{ padding:5px 6px 5px 10px; color:var(--_ink-2) }
.node-5{ padding:4px 10px; color:var(--_ink-3) }
.node-3:hover, .node-4:hover, .node-5:hover{ background:var(--_hover) }
.node-toggle, .node-add{ position:relative; flex:none; display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px; padding:0 4px; border:0;
  border-radius:min(var(--_radius-chip),50%); box-shadow:inset 0 0 0 1px var(--_stroke-chip); background:transparent; color:var(--_ink); font:inherit; font-weight:600; line-height:22px; cursor:pointer;
  transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease), transform var(--aha-motion-fast,.1s) var(--_ease), background-color var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease) }
.node-toggle::before, .node-add::before{ content:""; position:absolute; inset:-11px }
.node-toggle[hidden], .node-add[hidden]{ display:none }
.node-toggle:hover, .node-add:hover{ background:var(--_hover) }
.node-toggle:active, .node-add:active{ background:var(--_active); transform:scale(.96) }
.node-toggle:focus-visible, .node-add:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
.node-add{ position:absolute; top:50%; right:-24px; z-index:2; width:22px; margin-top:-11px; padding:0; background:var(--_hover); opacity:0 }
.node.is-left > .node-add{ right:auto; left:-24px }
.node:hover > .node-add, .node:focus-within > .node-add, .node-add:focus-visible{ opacity:1 }
.node-add:disabled{ opacity:0; pointer-events:none }
@media (hover:none){ .node-add{ opacity:.7 } }
.node-more{ min-height:32px; padding:4px 10px; border:0; box-shadow:inset 0 0 0 1px var(--_stroke-chip); background:transparent; color:var(--_ink-3); font:inherit; cursor:pointer;
  transition:background-color var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease) }
.node-more:hover{ background:var(--_hover) }
.node-editor{ padding:0 }
.node input{ width:200px; max-width:100%; height:36px; padding:0 10px; border:1px solid var(--_ink); border-radius:var(--_radius); background:transparent; color:var(--_ink); font:inherit }
.node input::placeholder{ color:var(--_ink-3) }
.node input:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
.node-1 input{ color:inherit; border-color:currentColor }

.tip{ position:absolute; z-index:4; left:0; top:0; pointer-events:none; width:max-content; max-width:min(320px,100%); padding:8px 12px;
  border-radius:var(--_radius); background:var(--_ink); color:var(--_tip-ink,var(--_ink-inverse)); line-height:1.25; opacity:0;
  transition:opacity var(--aha-motion-fast,.1s) var(--aha-ease-in-out,ease) }
.tip.is-shown{ opacity:1 }
.tip b{ display:block; margin-bottom:2px; font-weight:600; overflow-wrap:anywhere }
.tip .tip-line{ display:flex; gap:8px; align-items:flex-start }
.tip .tip-line .swatch{ margin:3px 0 0; box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--_ink-inverse) 30%, transparent) }
.tip .tip-muted{ opacity:.7 }
.tip .tip-hint{ margin-top:10px; padding-top:8px; border-top:1px solid color-mix(in srgb, var(--_ink-inverse) 24%, transparent); opacity:.8 }
.is-clipped{ cursor:help }

.sr{ position:absolute; width:1px; height:1px; margin:-1px; padding:0; border:0; overflow:hidden; clip:rect(0 0 0 0); clip-path:inset(50%); white-space:nowrap }

@media (prefers-reduced-motion: reduce){
  .root *{ transition:none !important }
}
`;

const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fill = (template, values) => String(template || '').replace(/\{(\w+)\}/g, (match, key) => (key in values ? values[key] : match));
const toNumber = (value) => { const number = Number(value); return Number.isFinite(number) && number > 0 ? number : 0; };
const sum = (values) => values.reduce((total, value) => total + value, 0);
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const round2 = (value) => Math.round(value * 100) / 100;
const niceCeiling = (value, step) => Math.max(step, Math.ceil(value / step) * step);
const safeColour = (value) => {
  const text = String(value || '').trim();
  return text && typeof CSS !== 'undefined' && CSS.supports('color', text) ? text : null;
};
const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const isCoordinate = (value) => value !== null && value !== '' && Number.isFinite(Number(value));

const roundedShares = (values) => {
  const total = sum(values);
  if (!total) return values.map(() => 0);
  const exact = values.map(value => value * 100 / total);
  const percents = exact.map(Math.floor);
  let remaining = 100 - sum(percents);
  exact.map((value, index) => [value - percents[index], index]).sort((a, b) => b[0] - a[0])
    .forEach(([, index]) => { if (remaining-- > 0) percents[index]++; });
  return percents.map(percent => percent / 100);
};

const create = (tag, className, parent) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (parent) parent.appendChild(element);
  return element;
};
const createSvg = (tag, attributes, parent) => {
  const element = document.createElementNS(SVG_NS, tag);
  for (const name in attributes || {}) element.setAttribute(name, attributes[name]);
  if (parent) parent.appendChild(element);
  return element;
};
const icon = (name, size, parent) => {
  const element = create('aha-icon', null, parent);
  element.setAttribute('name', name);
  element.setAttribute('size', String(size));
  element.setAttribute('decorative', '');
  return element;
};

const easeViz = (() => {
  const cx = 3 * 0.2, bx = 3 * (0.4 - 0.2) - cx, ax = 1 - cx - bx;
  const cy = 3 * 0.7, by = 3 * (1 - 0.7) - cy, ay = 1 - cy - by;
  const curveX = (t) => ((ax * t + bx) * t + cx) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let step = 0; step < 8; step++) {
      const error = curveX(t) - x;
      if (Math.abs(error) < 1e-5) break;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
})();
const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

const progressAt = (elapsed, delay, duration) => (duration <= 0
  ? (elapsed >= delay || !Number.isFinite(elapsed) ? 1 : 0)
  : easeViz(clamp((elapsed - delay) / duration, 0, 1)));

// the last frame gets Infinity, so callers can snap to the exact final value
function tween(duration, frame) {
  if (duration <= 0 || typeof requestAnimationFrame !== 'function') { frame(Infinity); return () => {}; }
  let handle, start = null, cancelled = false;
  const step = (now) => {
    if (cancelled) return;
    if (start === null) start = now;
    const elapsed = now - start;
    frame(elapsed >= duration ? Infinity : elapsed);
    if (elapsed < duration) handle = requestAnimationFrame(step);
  };
  handle = requestAnimationFrame(step);
  return () => { cancelled = true; cancelAnimationFrame(handle); };
}

function foldCategories(items, cap, otherLabel) {
  if (items.length <= cap) return items.map((item, index) => ({ ...item, cat: index }));
  const keep = new Set(items.map((item, index) => [item.value, index]).sort((a, b) => b[0] - a[0]).slice(0, cap - 1).map(([, index]) => index));
  const kept = items.filter((_, index) => keep.has(index)).map((item, index) => ({ ...item, cat: index }));
  const rest = items.filter((_, index) => !keep.has(index));
  kept.push({ label: otherLabel(rest.length), value: sum(rest.map(item => item.value)), cat: cap - 1, isOther: true, merged: rest.map(item => item.label) });
  return kept;
}

// angles run clockwise from 12 o'clock; inner 0 gives a pie slice
function sectorPath(centreX, centreY, inner, outer, start, end) {
  const full = 2 * Math.PI;
  if (end - start >= full - 1e-4) end = start + full - 1e-4;
  if (end - start < 1e-4) return '';
  const point = (radius, angle) => [centreX + radius * Math.sin(angle), centreY - radius * Math.cos(angle)];
  const large = end - start > Math.PI ? 1 : 0;
  const [x1, y1] = point(outer, start), [x2, y2] = point(outer, end);
  if (inner <= 0) return `M${centreX},${centreY}L${x1},${y1}A${outer},${outer} 0 ${large} 1 ${x2},${y2}Z`;
  const [x3, y3] = point(inner, end), [x4, y4] = point(inner, start);
  return `M${x1},${y1}A${outer},${outer} 0 ${large} 1 ${x2},${y2}L${x3},${y3}A${inner},${inner} 0 ${large} 0 ${x4},${y4}Z`;
}

function roundedSectorPath(centreX, centreY, inner, outer, start, end, cornerRadius) {
  const half = (end - start) / 2;
  const fitsInner = half < Math.PI / 2 ? inner * Math.sin(half) / (1 - Math.sin(half)) : Infinity;
  const corner = Math.min(cornerRadius, (outer - inner) / 2, fitsInner);
  if (!(corner > 0.5) || end - start < 1e-4) return sectorPath(centreX, centreY, inner, outer, start, end);
  const at = (radius, angle) => `${centreX + radius * Math.sin(angle)},${centreY - radius * Math.cos(angle)}`;
  const outerSpan = Math.asin(corner / (outer - corner));
  const innerSpan = Math.asin(corner / (inner + corner));
  const outerFoot = Math.sqrt((outer - corner) ** 2 - corner * corner);
  const innerFoot = Math.sqrt((inner + corner) ** 2 - corner * corner);
  const outerLarge = end - start - 2 * outerSpan > Math.PI ? 1 : 0;
  const innerLarge = end - start - 2 * innerSpan > Math.PI ? 1 : 0;
  return `M${at(innerFoot, start)}L${at(outerFoot, start)}A${corner},${corner} 0 0 1 ${at(outer, start + outerSpan)}` +
    `A${outer},${outer} 0 ${outerLarge} 1 ${at(outer, end - outerSpan)}A${corner},${corner} 0 0 1 ${at(outerFoot, end)}` +
    `L${at(innerFoot, end)}A${corner},${corner} 0 0 1 ${at(inner, end - innerSpan)}` +
    `A${inner},${inner} 0 ${innerLarge} 0 ${at(inner, start + innerSpan)}A${corner},${corner} 0 0 1 ${at(innerFoot, start)}Z`;
}

// monotone so the curve never overshoots below zero between two levels
function monotoneCurve(points) {
  const count = points.length;
  const tangents = new Array(count).fill(0);
  for (let index = 1; index < count - 1; index++) {
    const [x0, y0] = points[index - 1], [x1, y1] = points[index], [x2, y2] = points[index + 1];
    const left = x1 - x0, right = x2 - x1;
    const slopeLeft = (y1 - y0) / left, slopeRight = (y2 - y1) / right;
    const mean = (slopeLeft * right + slopeRight * left) / (left + right);
    tangents[index] = (Math.sign(slopeLeft) + Math.sign(slopeRight)) * Math.min(Math.abs(slopeLeft), Math.abs(slopeRight), 0.5 * Math.abs(mean)) || 0;
  }
  let d = count ? `M${points[0][0]},${points[0][1]}` : '';
  for (let index = 0; index < count - 1; index++) {
    const [x0, y0] = points[index], [x1, y1] = points[index + 1];
    const third = (x1 - x0) / 3;
    d += `C${x0 + third},${y0 + tangents[index] * third} ${x1 - third},${y1 - tangents[index + 1] * third} ${x1},${y1}`;
  }
  const at = (x) => {
    let index = 0;
    while (index < count - 2 && x > points[index + 1][0]) index++;
    const [x0, y0] = points[index], [x1, y1] = points[index + 1];
    const span = x1 - x0, t = clamp((x - x0) / span, 0, 1), t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * span * tangents[index] + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * span * tangents[index + 1];
  };
  return { d, at };
}

// FNV-1a: a word keeps its colour and rotation across live updates
function stableHash(text) {
  let hash = 2166136261;
  for (const character of text) { hash ^= character.codePointAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}

function relativeLuminance(colour) {
  let channels = null;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})/i.exec(colour);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map(digit => digit + digit).join('') : hex[1];
    channels = [0, 2, 4].map(offset => parseInt(digits.slice(offset, offset + 2), 16));
  } else {
    const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(colour);
    if (rgb) channels = [rgb[1], rgb[2], rgb[3]].map(Number);
  }
  if (!channels) return null;
  const [red, green, blue] = channels.map(channel => {
    const unit = channel / 255;
    return unit <= 0.03928 ? unit / 12.92 : ((unit + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Dark or light chart ink, whichever reads on the given fill (WCAG luminance split). */
export function readableInkOn(colour) {
  const luminance = relativeLuminance(String(colour || ''));
  if (luminance == null) return INK_INVERSE;
  return luminance > 0.179 ? INK : INK_INVERSE;
}

function watchWidth(element, callback) {
  if (typeof ResizeObserver !== 'function') return () => {};
  let width = element.clientWidth, queued = false;
  const observer = new ResizeObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const next = element.clientWidth;
      if (element.isConnected && next !== 0 && Math.abs(next - width) > 0.5) { width = next; callback(); }
    });
  });
  observer.observe(element);
  return () => observer.disconnect();
}

let measureContext = null;
function textWidth(text, fontSize, fontWeight, fontFamily) {
  if (!measureContext) measureContext = document.createElement('canvas').getContext('2d');
  measureContext.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  return measureContext.measureText(text).width;
}

const NARROW_BELOW = 560;

export class AhaChart extends HTMLElement {
  static get observedAttributes() {
    return ['type', 'data', 'options', 'palette', 'colors', 'ink', 'locale', 'number-format', 'sort', 'highlight-top',
      'log-scale', 'legend', 'tooltip', 'max-items', 'page-size', 'correct', 'correct-style', 'responses', 'label'];
  }

  constructor() {
    super();
    this._dataValue = undefined;
    this._optionsValue = undefined;
    this._colorsValue = null;
    this._stringsValue = null;
    this._renderer = null;
    this._hasDrawn = false;
    this._lastSummary = '';
    this._highlighted = null;
  }

  get data() {
    if (this._dataValue !== undefined) return this._dataValue;
    try { return JSON.parse(this.getAttribute('data') || 'null'); } catch { return null; }
  }
  set data(value) { this._dataValue = value; this._schedule(); }

  get options() {
    if (this._optionsValue !== undefined) return this._optionsValue;
    try { return JSON.parse(this.getAttribute('options') || 'null'); } catch { return null; }
  }
  set options(value) { this._optionsValue = isObject(value) ? { ...value } : undefined; this._schedule(); }

  get colors() {
    if (this._colorsValue) return this._colorsValue;
    return (this.getAttribute('colors') || '').split(/[\s,;]+(?![^(]*\))/).filter(Boolean);
  }
  set colors(value) { this._colorsValue = Array.isArray(value) ? value.slice() : null; this._schedule(); }

  get strings() { return this._stringsValue; }
  set strings(value) { this._stringsValue = isObject(value) ? value : null; this._schedule(); }

  /** The plain-language summary screen readers hear (also handy for a visible caption). */
  get summary() { return this._lastSummary; }

  /** Re-runs the entrance animation with the current data. */
  replay() {
    if (this._renderer && this.isConnected) { this._hideTip(); this._renderer.draw('enter'); }
  }

  connectedCallback() {
    for (const name of ['data', 'options', 'colors', 'strings']) {
      if (!Object.prototype.hasOwnProperty.call(this, name)) continue;
      const value = this[name];
      delete this[name];
      this[name] = value;
    }
    if (!this.shadowRoot) this._mount();
    this.setAttribute('role', 'figure');
    if (!this._unwatch) this._unwatch = watchWidth(this._root, () => this._resize());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.isConnected && this._resize());
    this._schedule();
  }

  disconnectedCallback() {
    if (this._unwatch) { this._unwatch(); this._unwatch = null; }
    clearTimeout(this._announceTimer);
    this._announceTimer = null;
    if (this._renderer) this._renderer.stop();
  }

  attributeChangedCallback(name) {
    if (name === 'data') this._dataValue = undefined;
    if (name === 'options') this._optionsValue = undefined;
    if (name === 'colors') this._colorsValue = null;
    this._schedule();
  }

  _mount() {
    const shadow = this.attachShadow({ mode: 'open' });
    create('style', null, shadow).textContent = STYLE;
    this._root = create('div', 'root', shadow);
    this._root.setAttribute('part', 'chart');
    this._viz = create('div', 'viz', this._root);
    this._plot = create('div', 'plot', this._viz);
    this._plot.setAttribute('part', 'plot');
    this._legend = create('div', 'legend', this._viz);
    this._legend.setAttribute('part', 'legend');
    this._legend.hidden = true;
    this._footer = create('div', 'footer', this._root);
    this._footer.setAttribute('part', 'footer');
    this._tip = create('div', 'tip', this._root);
    this._tip.setAttribute('aria-hidden', 'true');
    this._tip.setAttribute('part', 'tooltip');
    const accessible = create('div', 'sr', this._root);
    this._summaryNode = create('p', null, accessible);
    this._table = create('table', null, accessible);
    this._outline = create('ul', null, accessible);
    this._live = create('aha-live-region', null, this._root);
    this._live.setAttribute('politeness', 'polite');
    this._root.addEventListener('pointermove', event => this._pointer(event));
    this._root.addEventListener('pointerleave', () => { this._hideTip(); this._highlight(null); });
    this._root.addEventListener('focusin', event => this._focus(event));
    this._root.addEventListener('focusout', () => { this._hideTip(); this._highlight(null); });
  }

  _schedule() {
    if (this._queued || !this.shadowRoot) return;
    this._queued = true;
    queueMicrotask(() => { this._queued = false; if (this.isConnected) this._draw(); });
  }

  get _type() { const type = (this.getAttribute('type') || 'bar').toLowerCase(); return TYPES.includes(type) ? type : 'bar'; }
  get _isDeck() { return this.getAttribute('palette') === 'deck'; }
  get _numberFormat() { const format = this.getAttribute('number-format'); return ['count', 'percent'].includes(format) ? format : 'both'; }
  get _locale() { return this.getAttribute('locale') || (document.documentElement && document.documentElement.lang) || 'en'; }
  get _tooltipOn() { return this.getAttribute('tooltip') !== 'off'; }

  _optionsFor(type) {
    const given = this.options;
    return { ...(chartOptionDefaults[type] || {}), ...(isObject(given) ? given : {}) };
  }

  _copy() {
    const locale = this._locale;
    const language = locale.toLowerCase().split('-')[0];
    const override = this._stringsValue || {};
    const base = chartStrings[locale] || chartStrings[language] || {};
    return {
      ...chartStrings.en, ...base, ...override,
      typeNames: { ...chartStrings.en.typeNames, ...(base.typeNames || {}), ...(override.typeNames || {}) },
    };
  }

  _formats() {
    const locale = this._locale;
    if (this._formatCache && this._formatCache.locale === locale) return this._formatCache;
    const make = (options) => { try { return new Intl.NumberFormat(locale, options); } catch { return new Intl.NumberFormat('en', options); } };
    let plural;
    try { plural = new Intl.PluralRules(locale); } catch { plural = new Intl.PluralRules('en'); }
    const decimals = new Map();
    this._formatCache = {
      locale, plural,
      count: make(),
      percent: make({ style: 'percent', maximumFractionDigits: 0 }),
      decimal(value, digits) {
        if (!decimals.has(digits)) decimals.set(digits, make({ minimumFractionDigits: digits, maximumFractionDigits: digits }));
        return decimals.get(digits).format(value);
      },
    };
    return this._formatCache;
  }

  _plural(key, count) {
    const copy = this._copy(), formats = this._formats();
    const forms = copy[key] || {};
    return fill(forms[formats.plural.select(count)] || forms.other || '{count}', { count: formats.count.format(count) });
  }

  _responsesText(total) {
    const responses = parseInt(this.getAttribute('responses'), 10);
    return this._plural('responses', Number.isFinite(responses) && responses >= 0 ? responses : total);
  }

  _valueParts(value, share) {
    const formats = this._formats();
    const count = formats.count.format(Math.round(value));
    const percent = formats.percent.format(share);
    const format = this._numberFormat;
    if (format === 'count') return [count, ''];
    if (format === 'percent') return [percent, ''];
    return [count, percent];
  }

  _valueText(value, share) { return this._valueParts(value, share).filter(Boolean).join(' · '); }

  _compactValue(value, share) {
    const formats = this._formats();
    return this._numberFormat === 'count' ? formats.count.format(Math.round(value)) : formats.percent.format(share);
  }

  _motion() {
    if (reducedMotion()) return { enter: 0, update: 0, reorder: 0, stagger: 0 };
    const style = getComputedStyle(this._root);
    const read = (name, fallback) => {
      const raw = style.getPropertyValue(name).trim();
      const number = parseFloat(raw);
      if (!Number.isFinite(number)) return fallback;
      return /ms$/.test(raw) ? number : number * 1000;
    };
    return {
      enter: read('--aha-motion-viz-enter', MOTION_FALLBACK.enter),
      update: read('--aha-motion-viz-update', MOTION_FALLBACK.update),
      reorder: read('--aha-motion-viz-reorder', MOTION_FALLBACK.reorder),
      stagger: read('--aha-motion-viz-stagger', MOTION_FALLBACK.stagger),
    };
  }

  _applyPalette() {
    const root = this._root;
    const deckColours = this._isDeck ? this.colors.map(safeColour).filter(Boolean) : [];
    const previous = this._paletteCount || 0;
    for (let index = 1; index <= previous; index++) { root.style.removeProperty(`--_s${index}`); root.style.removeProperty(`--_t${index}`); }
    deckColours.forEach((colour, index) => {
      root.style.setProperty(`--_s${index + 1}`, colour);
      root.style.setProperty(`--_t${index + 1}`, `color-mix(in srgb, ${colour} 16%, transparent)`);
    });
    this._paletteCount = deckColours.length;
    this._seriesCount = deckColours.length || BRAND_SERIES_COUNT;
    root.classList.toggle('is-deck', this._isDeck);
    const ink = this._isDeck ? safeColour(this.getAttribute('ink')) : null;
    if (ink) {
      root.style.setProperty('--_ink', ink);
      const contrastInk = readableInkOn(getComputedStyle(root).color);
      root.style.setProperty('--_ink-inverse', contrastInk);
      root.style.setProperty('--_tip-ink', contrastInk);
      root.style.setProperty('--_root-fill', ink);
      root.style.setProperty('--_root-ink', contrastInk);
    } else {
      for (const name of ['--_ink', '--_ink-inverse', '--_tip-ink']) root.style.removeProperty(name);
      root.style.setProperty('--_root-fill', INK);
      root.style.setProperty('--_root-ink', INK_INVERSE);
    }
  }

  _colour(cat) { return `var(--_s${(cat % this._seriesCount) + 1})`; }
  _tint(cat) { return `var(--_t${(cat % this._seriesCount) + 1})`; }

  _itemsModel({ cap = Infinity, keepOrder = false } = {}) {
    const raw = Array.isArray(this.data) ? this.data : [];
    const seen = new Map();
    let items = raw.filter(entry => entry != null && (typeof entry !== 'object' || (entry.label ?? entry.text) != null)).map((entry, index) => {
      const isEntry = typeof entry === 'object';
      const label = String(isEntry ? (entry.label ?? entry.text) : entry);
      const repeat = seen.get(label) || 0;
      seen.set(label, repeat + 1);
      return {
        key: repeat ? `${label}\u0000${repeat}` : label, label, index,
        value: isEntry ? toNumber(entry.value) : 1,
        image: isEntry && typeof entry.image === 'string' ? entry.image : null,
        correct: isEntry && !!entry.correct,
      };
    });
    const correctAttribute = (this.getAttribute('correct') || '').split(/[\s,]+/).filter(Boolean).map(Number);
    for (const index of correctAttribute) if (items[index]) items[index].correct = true;
    const isPick = items.some(item => item.correct);
    const limit = parseInt(this.getAttribute('max-items'), 10);
    const effectiveCap = Math.max(2, Number.isFinite(limit) && limit > 0 ? limit : cap);
    if (items.length > effectiveCap) {
      const copy = this._copy();
      items = foldCategories(items, effectiveCap, count => fill(copy.otherCount, { count }))
        .map(item => (item.isOther ? { ...item, key: '\u0000other', index: -1, image: null, correct: false } : item));
    }
    const total = sum(items.map(item => item.value));
    const other = items.find(item => item.isOther);
    const ranked = items.filter(item => !item.isOther).slice().sort((a, b) => b.value - a.value);
    ranked.forEach((item, index) => { item.rank = index + 1; });
    if (other) other.rank = Infinity;
    const sort = keepOrder ? 'none' : this.getAttribute('sort');
    const ordered = sort === 'desc' ? [...ranked, ...(other ? [other] : [])]
      : sort === 'asc' ? [...ranked.slice().reverse(), ...(other ? [other] : [])] : items;
    const highlightTop = parseInt(this.getAttribute('highlight-top'), 10) || 0;
    const max = Math.max(0, ...items.map(item => item.value));
    const logScale = this.hasAttribute('log-scale');
    const shares = roundedShares(items.map(item => item.value));
    const correctFill = this.getAttribute('correct-style') !== 'indicator';
    const singleColour = items.length > SINGLE_COLOUR_ABOVE;
    items.forEach((item, position) => {
      item.share = shares[position];
      item.cat = item.isOther ? items.length - 1 : position;
      item.extent = !max ? 0 : logScale ? Math.log1p(item.value) / Math.log1p(max) : item.value / max;
      item.dim = highlightTop > 0 && item.rank > highlightTop;
      item.colour = item.isOther ? NEUTRAL
        : isPick && correctFill && total > 0 ? (item.correct ? CORRECT : NEUTRAL)
        : this._colour(singleColour ? 0 : position);
    });
    return { items: ordered, total, isPick, sorted: sort === 'desc' || sort === 'asc', empty: total === 0 };
  }

  _draw() {
    const type = this._type;
    if (this._renderer && this._renderer.type !== type) {
      this._renderer.destroy();
      this._renderer = null;
    }
    this._applyPalette();
    const copy = this._copy();
    this.setAttribute('aria-label', this.getAttribute('label') || copy.typeNames[type]);
    this._hideTip();
    this._root.classList.toggle('is-narrow', this._root.clientWidth > 0 && this._root.clientWidth < NARROW_BELOW);
    if (!this._renderer) {
      this._plot.replaceChildren();
      this._footer.replaceChildren();
      this._setLegend([], false);
      this._viz.classList.remove('is-grouped');
      this._renderer = new RENDERERS[type](this);
      this._renderer.draw('enter');
    } else this._renderer.draw('update');
    this._syncInteractive();
    this._describe(this._renderer.describe(copy, this._formats()));
  }

  _resize() {
    this._root.classList.toggle('is-narrow', this._root.clientWidth < NARROW_BELOW);
    if (this._renderer) { this._hideTip(); this._renderer.draw('resize'); this._syncInteractive(); }
  }

  _syncInteractive() {
    const interactive = !!(this._renderer && this._renderer.interactive);
    if (interactive) this._plot.removeAttribute('aria-hidden');
    else this._plot.setAttribute('aria-hidden', 'true');
  }

  _setLegend(entries, visibleByDefault) {
    const setting = this.getAttribute('legend');
    const show = entries.length > 0 && (setting === 'on' || (setting !== 'off' && visibleByDefault));
    this._legend.hidden = !show;
    const interactive = show && entries.some(entry => entry.onToggle);
    if (interactive) this._legend.removeAttribute('aria-hidden');
    else this._legend.setAttribute('aria-hidden', 'true');
    if (!show) { this._legend.replaceChildren(); return; }
    this._legend.replaceChildren(...entries.map(entry => {
      const item = create(entry.onToggle ? 'button' : 'div', 'lg-item');
      item.dataset.cat = String(entry.cat);
      const swatch = create('span', 'swatch', item);
      swatch.style.setProperty('--_c', entry.colour);
      create('span', 'lg-label', item).textContent = entry.label;
      if (entry.value) create('span', 'lg-value', item).textContent = entry.value;
      item._tip = { title: entry.label, lines: entry.value ? [entry.value] : [] };
      if (entry.onToggle) {
        item.type = 'button';
        item.setAttribute('aria-pressed', String(entry.pressed !== false));
        item.addEventListener('click', event => entry.onToggle(event));
      }
      return item;
    }));
    this._applyHighlight();
  }

  _pointer(event) {
    const path = event.composedPath();
    const categoryNode = path.find(node => node && node.dataset && node.dataset.cat != null && node.dataset.cat !== '');
    this._highlight(categoryNode ? categoryNode.dataset.cat : null);
    const tipNode = path.find(node => node && node._tip);
    if (!tipNode || !this._tooltipOn) return this._hideTip();
    const bounds = this._root.getBoundingClientRect();
    this._showTip(tipNode._tip, { x: event.clientX - bounds.left + 12, y: event.clientY - bounds.top - 12, above: true });
  }

  _focus(event) {
    const node = event.composedPath().find(entry => entry && (entry._tip || (entry.dataset && entry.dataset.cat != null)));
    if (!node) return;
    if (node.dataset && node.dataset.cat != null) this._highlight(node.dataset.cat);
    if (node._tip && this._tooltipOn) this._showTipOver(node, node._tip);
  }

  _showTipOver(element, payload) {
    const bounds = this._root.getBoundingClientRect(), rect = element.getBoundingClientRect();
    this._showTip(payload, { x: rect.left + rect.width / 2 - bounds.left, y: rect.top - bounds.top - 10, below: rect.bottom - bounds.top + 10, centred: true });
  }

  _showTip(payload, position) {
    const content = typeof payload === 'function' ? payload() : payload;
    if (!content || !content.title) return this._hideTip();
    this._tip.replaceChildren();
    create('b', null, this._tip).textContent = content.title;
    for (const line of content.lines || []) {
      const row = create('div', 'tip-line', this._tip);
      if (isObject(line)) {
        if (line.colour) create('span', 'swatch', row).style.setProperty('--_c', line.colour);
        const text = create('span', null, row);
        text.textContent = line.text;
        if (line.muted) { create('span', 'tip-muted', text).textContent = ` ${line.muted}`; }
      } else row.textContent = line;
    }
    if (content.hint) create('div', 'tip-hint', this._tip).textContent = content.hint;
    const width = this._tip.offsetWidth, height = this._tip.offsetHeight, bounds = this._root.getBoundingClientRect();
    let x = position.centred ? position.x - width / 2 : position.x;
    x = clamp(x, 0, Math.max(0, bounds.width - width));
    let y = position.y - height;
    if (y < 0) y = position.below != null ? position.below : Math.max(0, position.y + 24);
    this._tip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    this._tip.classList.add('is-shown');
  }

  _hideTip() { if (this._tip) this._tip.classList.remove('is-shown'); }

  _highlight(cat) {
    const next = cat == null ? null : String(cat);
    if (next === this._highlighted) return;
    this._highlighted = next;
    this._applyHighlight();
    if (this._renderer && this._renderer.onHighlight) this._renderer.onHighlight(next);
  }

  _applyHighlight() {
    const active = this._highlighted;
    if (!this._viz) return;
    for (const node of this._viz.querySelectorAll('[data-cat]')) {
      const cat = node.dataset.cat;
      node.classList.toggle('is-faded', active != null && cat !== '' && cat !== active);
      node.classList.toggle('is-hl', active != null && cat === active);
    }
  }

  _describe({ summary = '', head = null, rows = [], outline = null, caption = null } = {}) {
    this._summaryNode.textContent = summary;
    this._table.replaceChildren();
    this._outline.replaceChildren();
    this._table.hidden = !head;
    this._outline.hidden = !outline;
    if (head) {
      create('caption', null, this._table).textContent = caption || this.getAttribute('label') || this._copy().typeNames[this._type];
      const headRow = create('tr', null, create('thead', null, this._table));
      for (const text of head) { const cell = create('th', null, headRow); cell.setAttribute('scope', 'col'); cell.textContent = text; }
      const body = create('tbody', null, this._table);
      for (const row of rows) {
        const line = create('tr', null, body);
        row.forEach((text, index) => {
          const cell = create(index === 0 ? 'th' : 'td', null, line);
          if (index === 0) cell.setAttribute('scope', 'row');
          cell.textContent = text;
        });
      }
    }
    if (outline) {
      const build = (node, list) => {
        const item = create('li', null, list);
        item.textContent = node.label;
        if (node.children && node.children.length) { const nested = create('ul', null, item); node.children.forEach(child => build(child, nested)); }
      };
      build(outline, this._outline);
    }
    if (this._hasDrawn && summary !== this._lastSummary) this._announce(fill(this._copy().updated, { summary }));
    this._hasDrawn = true;
    this._lastSummary = summary;
  }

  _announce(text) {
    this._pendingAnnouncement = text;
    if (this._announceTimer) return;
    this._announceTimer = setTimeout(() => {
      this._announceTimer = null;
      if (this._live && this._live.announce) this._live.announce(this._pendingAnnouncement);
    }, ANNOUNCE_THROTTLE_MS);
  }

  _emit(name, detail) { this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }
}

class Renderer {
  constructor(chart, type) {
    this.chart = chart;
    this.type = type;
    this.interactive = false;
    this.cancels = [];
  }
  get plot() { return this.chart._plot; }
  animate(duration, frame) { const cancel = tween(duration, frame); this.cancels.push(cancel); return cancel; }
  stop() { this.cancels.forEach(cancel => cancel()); this.cancels = []; }
  destroy() { this.stop(); }
  describeItems(copy, formats, model, { summaryKey = 'summary', leaderKey = 'leader' } = {}) {
    const chart = this.chart, typeName = copy.typeNames[this.type];
    let summary;
    if (model.empty) summary = fill(copy.emptySummary, { type: typeName });
    else {
      summary = fill(copy[summaryKey], { type: typeName, items: formats.count.format(model.items.length), responses: chart._responsesText(model.total) });
      const correct = model.isPick && model.items.find(item => item.correct);
      const leader = model.items.find(item => item.rank === 1);
      if (correct) summary += ' ' + fill(copy.correctSummary, { label: correct.label, value: chart._valueText(correct.value, correct.share) });
      else if (leader) summary += ' ' + fill(copy[leaderKey], { label: leader.label, value: chart._valueText(leader.value, leader.share) });
    }
    return {
      summary,
      head: [copy.item, copy.count, copy.share],
      rows: model.items.map(item => [item.label + (item.correct ? ` (${copy.correct})` : ''), formats.count.format(item.value), formats.percent.format(item.share)]),
    };
  }
}

function valueNode(parent) {
  const node = create('span', 'value', parent);
  node._main = create('span', 'value-main', node);
  node._sub = create('span', 'value-sub', node);
  node._display = 0;
  return node;
}

function setValue(chart, node, value, total, finalShare) {
  const share = finalShare != null ? finalShare : (total ? value / total : 0);
  const [main, sub] = chart._valueParts(value, share);
  node._main.textContent = main;
  node._sub.textContent = sub;
  node._display = value;
}

function countTo(renderer, node, value, total, finalShare, duration, delay) {
  const from = node._display || 0;
  if (duration + delay <= 0 || from === value) { setValue(renderer.chart, node, value, total, finalShare); return; }
  renderer.animate(duration + delay, elapsed => {
    if (elapsed === Infinity) setValue(renderer.chart, node, value, total, finalShare);
    else setValue(renderer.chart, node, lerp(from, value, progressAt(elapsed, delay, duration)), total, null);
  });
}

function correctBadge(parent) {
  const badge = create('span', 'correct-badge');
  icon('system-check', 18, badge);
  parent.prepend(badge);
  return badge;
}

const BAR_GAP = 14;

class BarRenderer extends Renderer {
  constructor(chart, host = chart._plot) {
    super(chart, 'bar');
    this.wrap = create('div', 'bars', host);
    this.list = create('div', 'bar-list', this.wrap);
    this.rows = new Map();
    this.page = 0;
    this.pager = null;
  }

  destroy() { super.destroy(); this.wrap.remove(); if (this.pager) this.pager.remove(); }

  get pageSize() { const size = parseInt(this.chart.getAttribute('page-size'), 10); return size > 0 ? size : Infinity; }

  draw(reason, model = this.chart._itemsModel()) {
    this.stop();
    this.model = model;
    const chart = this.chart;
    const items = model.items;
    this.wrap.classList.toggle('is-dense', items.length > DENSE_ABOVE);
    const live = new Set();
    items.forEach(item => {
      live.add(item.key);
      let row = this.rows.get(item.key);
      if (!row) {
        row = { element: create('div', 'bar-row', this.list) };
        row.body = create('div', 'bar-body', row.element);
        const head = create('div', 'bar-head', row.body);
        row.rank = create('span', 'bar-rank', head);
        row.label = create('span', 'bar-label', head);
        const line = create('div', 'bar-line', row.body);
        row.fill = create('div', 'bar-fill', create('div', 'bar-track', line));
        row.value = valueNode(line);
        row.isNew = true;
        this.rows.set(item.key, row);
      }
      if (item.image) {
        if (!row.image) { row.image = create('img', 'bar-img'); row.image.alt = ''; row.element.prepend(row.image); }
        if (row.image.getAttribute('src') !== item.image) row.image.src = item.image;
      } else if (row.image) { row.image.remove(); row.image = null; }
      row.item = item;
      row.element.dataset.cat = String(item.cat);
      row.element.classList.toggle('is-dim', !!item.dim);
      row.label.textContent = item.label;
      row.label.classList.toggle('is-correct', model.isPick && item.correct);
      if (model.isPick && item.correct) correctBadge(row.label);
      row.fill.style.background = item.colour;
      row.element._tip = { title: item.label + (item.correct ? ' ✓' : ''), lines: [chart._valueText(item.value, item.share)] };
    });
    for (const [key, row] of this.rows) if (!live.has(key)) { row.element.remove(); this.rows.delete(key); }
    for (const row of this.rows.values()) row.height = row.element.offsetHeight;
    this.layout(reason === 'enter' || this.rows.size && [...this.rows.values()].every(row => row.isNew) ? 'enter' : reason);
    for (const row of this.rows.values()) row.isNew = false;
  }

  layout(reason) {
    const chart = this.chart, model = this.model, motion = chart._motion();
    const ordered = model.items.map(item => this.rows.get(item.key));
    const pageSize = this.pageSize, pages = Math.max(1, Math.ceil(ordered.length / pageSize));
    this.page = Math.min(this.page, pages - 1);
    const from = Number.isFinite(pageSize) ? this.page * pageSize : 0, to = from + pageSize;
    let offset = 0;
    const positions = new Map();
    ordered.forEach((row, index) => {
      if (index >= from && index < to) { positions.set(row, offset); offset += row.height + BAR_GAP; }
    });
    const pageHeight = Math.max(0, offset - BAR_GAP);
    ordered.forEach((row, index) => { if (!positions.has(row)) positions.set(row, index < from ? -row.height : pageHeight); });
    this.list.style.height = `${pageHeight}px`;
    this.syncPager(ordered.length, from, pages);
    const move = reason === 'enter' || reason === 'resize' ? 0 : motion.reorder;
    const grow = reason === 'enter' ? motion.enter : reason === 'resize' ? 0 : motion.update;
    if (reason === 'enter') {
      for (const row of ordered) { row.fill.style.transition = 'none'; row.fill.style.width = '0'; setValue(chart, row.value, 0, model.total, 0); }
      void this.list.offsetWidth;
    }
    ordered.forEach((row, index) => {
      const item = row.item, visible = index >= from && index < to;
      const delay = reason === 'enter' ? Math.max(0, index - from) * motion.stagger : 0;
      row.element.style.transition = `transform ${move}ms var(--_ease), opacity ${move}ms linear`;
      row.element.style.transform = `translateY(${positions.get(row)}px)`;
      row.element.style.opacity = visible ? '' : '0';
      row.element.style.visibility = visible ? '' : 'hidden';
      row.rank.textContent = model.sorted && Number.isFinite(item.rank) ? String(item.rank) : '';
      if (reason === 'resize') { setValue(chart, row.value, item.value, model.total, item.share); return; }
      row.fill.style.transition = `width ${grow}ms var(--_ease) ${delay}ms`;
      row.fill.style.width = `${(item.extent * 100).toFixed(2)}%`;
      countTo(this, row.value, item.value, model.total, item.share, grow, delay);
    });
  }

  syncPager(count, from, pages) {
    if (pages <= 1) { if (this.pager) this.pager.hidden = true; return; }
    const chart = this.chart, copy = chart._copy(), formats = chart._formats();
    if (!this.pager) {
      this.pager = create('div', 'pager', chart._footer);
      this.previous = create('button', 'button pager-button', this.pager);
      this.previous.type = 'button';
      icon('system-caret-left', 20, this.previous);
      this.pageLabel = create('span', null, this.pager);
      this.next = create('button', 'button pager-button', this.pager);
      this.next.type = 'button';
      icon('system-caret-right', 20, this.next);
      this.previous.addEventListener('click', () => { if (this.page > 0) { this.page--; this.layout('page'); if (this.previous.disabled) this.next.focus(); } });
      this.next.addEventListener('click', () => { this.page++; this.layout('page'); if (this.next.disabled) this.previous.focus(); });
    }
    this.pager.hidden = false;
    this.previous.setAttribute('aria-label', copy.previousPage);
    this.next.setAttribute('aria-label', copy.nextPage);
    const ranked = this.model.items.filter(item => !item.isOther).length;
    const byRank = this.model.sorted && from < ranked, total = byRank ? ranked : count;
    this.pageLabel.textContent = fill(byRank ? copy.rankPage : copy.page,
      { from: formats.count.format(from + 1), to: formats.count.format(Math.min(total, from + this.pageSize)), total: formats.count.format(total) });
    this.previous.disabled = this.page === 0;
    this.next.disabled = this.page >= pages - 1;
  }

  describe(copy, formats) { return this.describeItems(copy, formats, this.model); }
}

const COLUMN_SLOT_MAX = 240;

class ColumnRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'column');
    this.orientation = null;
    this.inner = null;
  }

  destroy() { super.destroy(); this.clear(); }

  clear() {
    if (this.inner) { this.inner.destroy(); this.inner = null; }
    if (this.wrap) { this.wrap.remove(); this.wrap = null; }
  }

  fitsColumns(items) {
    const count = items.length;
    if (!count) return true;
    const minimum = items.some(item => item.image) ? 64 : 40;
    const gap = count > DENSE_ABOVE ? 20 : 28;
    const slot = Math.min(COLUMN_SLOT_MAX, (this.plot.clientWidth - 8 - (count - 1) * gap) / count);
    if (slot < minimum) return false;
    const family = getComputedStyle(this.plot).fontFamily;
    return items.every(item => {
      const text = String(item.label).slice(0, 90);
      const longestWord = Math.max(...text.split(/\s+/).map(word => textWidth(word, 16, 400, family)));
      return Math.max(longestWord, textWidth(text, 16, 400, family) / 4 * 1.15) + 4 <= slot;
    });
  }

  draw(reason) {
    const model = this.chart._itemsModel();
    this.model = model;
    const orientation = this.fitsColumns(model.items) ? 'column' : 'bar';
    if (orientation !== this.orientation) {
      this.clear();
      this.orientation = orientation;
      reason = 'enter';
      if (orientation === 'bar') this.inner = new BarRenderer(this.chart);
      else this.build();
    }
    if (this.inner) return this.inner.draw(reason, model);
    this.drawColumns(reason);
  }

  build() {
    this.wrap = create('div', 'columns', this.plot);
    this.area = create('div', 'col-area', this.wrap);
    this.labels = create('div', 'col-labels', this.wrap);
    this.slots = new Map();
  }

  drawColumns(reason) {
    this.stop();
    const chart = this.chart, model = this.model;
    const items = model.items;
    this.wrap.classList.toggle('is-dense', items.length > DENSE_ABOVE);
    this.wrap.classList.toggle('has-images', items.some(item => item.image));
    const live = new Set();
    items.forEach(item => {
      live.add(item.key);
      let slot = this.slots.get(item.key);
      if (!slot) {
        slot = { element: create('div', 'col-slot'), label: create('div', 'col-label') };
        slot.value = valueNode(slot.element);
        slot.bar = create('div', 'col-bar', slot.element);
        slot.text = create('span', 'col-label-text', slot.label);
        slot.isNew = true;
        this.slots.set(item.key, slot);
      }
      if (item.image) {
        if (!slot.image) { slot.image = create('img', 'col-img'); slot.image.alt = ''; slot.element.insertBefore(slot.image, slot.bar); }
        if (slot.image.getAttribute('src') !== item.image) slot.image.src = item.image;
      } else if (slot.image) { slot.image.remove(); slot.image = null; }
      slot.item = item;
      for (const node of [slot.element, slot.label]) node.dataset.cat = String(item.cat);
      slot.element.classList.toggle('is-dim', !!item.dim);
      slot.element.classList.toggle('is-zero', item.value === 0);
      slot.label.classList.toggle('is-dim', !!item.dim);
      slot.text.textContent = item.label;
      slot.label.classList.toggle('is-correct', model.isPick && item.correct);
      if (model.isPick && item.correct) correctBadge(slot.text);
      slot.bar.style.background = item.colour;
      slot.element._tip = slot.label._tip = { title: item.label + (item.correct ? ' ✓' : ''), lines: [chart._valueText(item.value, item.share)] };
    });
    for (const [key, slot] of this.slots) if (!live.has(key)) { slot.element.remove(); slot.label.remove(); this.slots.delete(key); }
    const ordered = items.map(item => this.slots.get(item.key));
    ordered.forEach(slot => { this.area.appendChild(slot.element); this.labels.appendChild(slot.label); });
    const entering = reason === 'enter' || ordered.every(slot => slot.isNew);
    const motion = chart._motion();
    const imageHeight = Math.max(0, ...ordered.map(slot => (slot.image ? slot.image.offsetHeight || slot.image.offsetWidth : 0)));
    const room = Math.max(0, this.area.clientHeight - 64 - imageHeight);
    if (entering) {
      for (const slot of ordered) { slot.bar.style.transition = 'none'; slot.bar.style.height = '0px'; setValue(chart, slot.value, 0, model.total, 0); }
      void this.area.offsetHeight;
    }
    ordered.forEach((slot, index) => {
      const item = slot.item;
      const duration = entering ? motion.enter : reason === 'resize' ? 0 : motion.update;
      const delay = entering ? index * motion.stagger : 0;
      slot.bar.style.transition = `height ${duration}ms var(--_ease) ${delay}ms`;
      slot.bar.style.height = `${item.extent * room}px`;
      if (reason === 'resize') setValue(chart, slot.value, item.value, model.total, item.share);
      else countTo(this, slot.value, item.value, model.total, item.share, duration, delay);
      slot.isNew = false;
    });
  }

  describe(copy, formats) { return this.describeItems(copy, formats, this.model); }
}

const STACK_VALUE_MIN_WIDTH = 44;

class StackedRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'stacked');
    this.list = create('div', 'stack-rows', this.plot);
    this.rows = [];
  }

  destroy() { super.destroy(); this.list.remove(); }

  buildModel() {
    const chart = this.chart, copy = chart._copy();
    const data = isObject(chart.data) ? chart.data : {};
    const names = (Array.isArray(data.series) ? data.series : Array.isArray(data.categories) ? data.categories : []).map(String);
    let rows = (Array.isArray(data.rows) ? data.rows : []).filter(row => row && row.label != null)
      .map(row => ({ label: String(row.label), values: names.map((_, index) => toNumber((row.values || [])[index])) }));
    let series = names.map((label, index) => ({ label, cat: index, colour: chart._colour(index) }));
    const limit = parseInt(chart.getAttribute('max-items'), 10);
    const cap = Math.max(2, limit > 0 ? limit : CATEGORY_CAP);
    if (series.length > cap) {
      const totals = names.map((_, index) => sum(rows.map(row => row.values[index])));
      const keep = new Set(totals.map((total, index) => [total, index]).sort((a, b) => b[0] - a[0]).slice(0, cap - 1).map(([, index]) => index));
      const kept = names.map((_, index) => index).filter(index => keep.has(index));
      const rest = names.map((_, index) => index).filter(index => !keep.has(index));
      series = [...kept.map((index, position) => ({ label: names[index], cat: position, colour: chart._colour(position) })),
        { label: fill(copy.otherCount, { count: rest.length }), cat: kept.length, colour: NEUTRAL, isOther: true, merged: rest.map(index => names[index]) }];
      rows = rows.map(row => ({ label: row.label, values: [...kept.map(index => row.values[index]), sum(rest.map(index => row.values[index]))] }));
    }
    const total = sum(rows.map(row => sum(row.values)));
    return { series, rows, total, empty: total === 0 };
  }

  draw(reason) {
    this.stop();
    const chart = this.chart, model = this.model = this.buildModel();
    const signature = model.rows.map(row => row.label).join('\u0000') + '|' + model.series.map(entry => entry.label).join('\u0000');
    if (signature !== this.signature) { this.build(model); this.signature = signature; reason = 'enter'; }
    chart._setLegend(model.series.map(entry => ({ label: entry.label, cat: entry.cat, colour: entry.colour })), true);
    const motion = chart._motion();
    if (reason === 'enter') {
      for (const row of this.rows) for (const part of row.parts) { part.segment.style.transition = 'none'; part.segment.style.width = '0'; }
      void this.list.offsetHeight;
    }
    this.rows.forEach((row, rowIndex) => {
      const data = model.rows[rowIndex];
      const rowTotal = sum(data.values);
      const shares = roundedShares(data.values);
      const duration = reason === 'enter' ? motion.enter : reason === 'resize' ? 0 : motion.update;
      const delay = reason === 'enter' ? rowIndex * motion.stagger : 0;
      const width = row.bar.clientWidth;
      row.bar.classList.toggle('is-empty', rowTotal === 0);
      let offset = 0;
      row.parts.forEach((part, index) => {
        const fraction = rowTotal ? data.values[index] / rowTotal : 0;
        part.segment.style.transition = `width ${duration}ms var(--_ease) ${delay}ms`;
        part.segment.style.width = `${(fraction * 100).toFixed(3)}%`;
        part.value.textContent = chart._compactValue(data.values[index], shares[index]);
        part.value.style.left = `${((offset + fraction / 2) * 100).toFixed(2)}%`;
        part.value.style.opacity = fraction * width >= STACK_VALUE_MIN_WIDTH ? '1' : '0';
        part.segment._tip = { title: data.label, lines: [{ colour: model.series[index].colour, text: `${model.series[index].label}: ${chart._valueText(data.values[index], shares[index])}` }] };
        offset += fraction;
      });
    });
  }

  build(model) {
    this.list.replaceChildren();
    this.rows = model.rows.map(data => {
      const element = create('div', 'stack-row', this.list);
      create('div', 'stack-label', element).textContent = data.label;
      const bar = create('div', 'stack-bar', element);
      const values = create('div', 'stack-values', element);
      const parts = model.series.map(entry => {
        const segment = create('div', 'stack-segment', bar);
        segment.style.background = entry.colour;
        segment.dataset.cat = String(entry.cat);
        const value = create('span', 'stack-value', values);
        value.dataset.cat = String(entry.cat);
        return { segment, value };
      });
      return { element, bar, parts };
    });
  }

  describe(copy, formats) {
    const model = this.model, chart = this.chart, typeName = copy.typeNames.stacked;
    return {
      summary: model.empty ? fill(copy.emptySummary, { type: typeName })
        : fill(copy.stackedSummary, { type: typeName, rows: formats.count.format(model.rows.length), series: formats.count.format(model.series.length) }),
      head: [copy.item, ...model.series.map(entry => entry.label)],
      rows: model.rows.map(row => { const shares = roundedShares(row.values); return [row.label, ...row.values.map((value, index) => chart._valueText(value, shares[index]))]; }),
    };
  }
}

function sliceModel(chart) {
  const model = chart._itemsModel({ cap: CATEGORY_CAP, keepOrder: true });
  model.items.forEach(item => { if (!item.isOther) item.colour = chart._colour(item.cat); });
  return model;
}

const DONUT_LEADER_MIN_WIDTH = 480;
const DONUT_LEADER_MAX_SLICES = 5;
const DONUT_LABEL_WIDTH = 150;

class DonutRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'donut');
    this.stage = create('div', 'svg-stage', this.plot);
    this.arcs = createSvg('svg', { 'aria-hidden': 'true' }, this.stage); // ds-lint-allow: svg (chart geometry drawn from data, not an icon glyph)
    this.leaders = createSvg('svg', { 'aria-hidden': 'true' }, this.stage); // ds-lint-allow: svg (leader lines drawn from data, not an icon glyph)
    this.leaders.style.pointerEvents = 'none';
    this.centre = create('div', 'donut-centre', this.stage);
    this.total = create('div', 'donut-total', this.centre);
    this.sub = create('div', 'donut-sub', this.centre);
    this.labelLayer = create('div', null, this.stage);
    this.shown = null;
  }

  destroy() { super.destroy(); this.stage.remove(); this.chart._viz.classList.remove('is-grouped'); }

  get options() { return this.chart._optionsFor('donut'); }

  useLeaders(model) {
    const labels = this.options.labels;
    return labels !== 'legend' && !model.empty && model.items.length <= DONUT_LEADER_MAX_SLICES
      && (labels === 'leader' || this.chart._root.clientWidth >= DONUT_LEADER_MIN_WIDTH);
  }

  draw(reason) {
    this.stop();
    const chart = this.chart, model = this.model = sliceModel(chart);
    const previous = this.shares ? new Map(this.items.map((item, index) => [item.key, this.shares[index]])) : new Map();
    this.items = model.items;
    this.leader = this.useLeaders(model);
    chart._viz.classList.toggle('is-grouped', !this.leader);
    chart._setLegend(this.leader ? [] : model.items.map(item => ({ label: item.label, cat: item.cat, colour: item.colour, value: chart._formats().percent.format(item.share) })), true);
    this.labelLayer.replaceChildren();
    this.labels = model.items.map(item => {
      if (!this.leader) return null;
      const label = create('div', 'donut-label', this.labelLayer);
      label.dataset.cat = String(item.cat);
      create('b', null, label).textContent = chart._formats().percent.format(item.share);
      create('span', null, label).textContent = item.label;
      label._tip = { title: item.label, lines: [chart._valueText(item.value, item.share)] };
      return label;
    });
    chart._applyHighlight();
    this.setCentre(null);
    const target = model.items.map(item => (model.total ? item.value / model.total : 0));
    const motion = chart._motion();
    if (reason === 'resize') { this.render(this.shares || target, 1); return; }
    if (reason === 'enter' || !this.shares) {
      this.animate(motion.enter + motion.stagger, elapsed => {
        const grow = progressAt(elapsed, 0, motion.enter);
        this.render(target.map(share => share * grow), progressAt(elapsed, 0.6 * motion.enter, 0.4 * motion.enter + motion.stagger));
      });
    } else {
      const from = model.items.map(item => previous.get(item.key) || 0);
      this.animate(motion.update, elapsed => {
        const step = progressAt(elapsed, 0, motion.update);
        this.render(from.map((share, index) => lerp(share, target[index], step)), 1);
      });
    }
    this.shares = target;
  }

  setCentre(cat) {
    const chart = this.chart, model = this.model, formats = chart._formats(), copy = chart._copy();
    const isDonut = this.options.variant !== 'pie';
    this.centre.style.opacity = isDonut ? '1' : '0';
    const item = cat == null ? null : model.items.find(entry => String(entry.cat) === String(cat));
    if (item) { this.total.textContent = formats.percent.format(item.share); this.sub.textContent = item.label; return; }
    this.total.textContent = formats.count.format(model.total);
    const units = copy.responsesUnit || {};
    this.sub.textContent = chart.hasAttribute('responses') ? chart._responsesText(model.total) : (units[formats.plural.select(model.total)] || units.other || '');
  }

  onHighlight(cat) { if (this.model) this.setCentre(cat); }

  render(shares, labelOpacity) {
    const chart = this.chart, model = this.model, isDonut = this.options.variant !== 'pie';
    const plotWidth = this.plot.clientWidth || chart._root.clientWidth || 600;
    const available = this.leader ? plotWidth - 352 : Math.max(0, chart._viz.clientWidth - (chart._legend.hidden ? 0 : chart._legend.offsetWidth + 40));
    const maxSize = this.options.maxSize;
    const size = Math.max(140, Math.min(maxSize, available || maxSize));
    const width = this.leader ? plotWidth : size, height = size + (this.leader ? 64 : 0);
    Object.assign(this.stage.style, { width: `${width}px`, height: `${height}px` });
    const outer = size / 2 - 1, inner = isDonut ? 0.62 * outer : 0, centreX = width / 2, centreY = height / 2;
    for (const svg of [this.arcs, this.leaders]) {
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      svg.replaceChildren();
    }
    Object.assign(this.centre.style, { left: `${centreX - inner}px`, top: `${centreY - inner}px`, width: `${2 * inner}px`, height: `${2 * inner}px` });
    if (model.empty) createSvg('path', { d: sectorPath(centreX, centreY, inner, outer, 0, 2 * Math.PI), style: 'fill:var(--_track)' }, this.arcs);
    let start = 0;
    const middles = [];
    model.items.forEach((item, index) => {
      const sweep = 2 * shares[index] * Math.PI;
      const d = sectorPath(centreX, centreY, inner, outer, start, start + sweep);
      if (d) {
        const arc = createSvg('path', { d, 'data-cat': String(item.cat), style: `fill:${item.colour};stroke:var(--_stroke);stroke-width:1;stroke-linejoin:round` }, this.arcs);
        arc._tip = { title: item.label, lines: [chart._valueText(item.value, item.share)] };
      }
      middles.push(start + sweep / 2);
      start += sweep;
    });
    if (this.leader) this.placeLeaders(middles, { centreX, centreY, outer, height }, labelOpacity);
    chart._applyHighlight();
  }

  placeLeaders(middles, { centreX, centreY, outer, height }, opacity) {
    const spacing = 8;
    const entries = this.model.items.map((item, index) => {
      const angle = middles[index], side = angle < Math.PI ? 1 : -1;
      const elbowY = centreY - (outer + 14) * Math.cos(angle);
      return { item, label: this.labels[index], side, angle,
        anchorX: centreX + (outer + 2) * Math.sin(angle), anchorY: centreY - (outer + 2) * Math.cos(angle),
        elbowX: centreX + (outer + 14) * Math.sin(angle), y: elbowY, half: this.labels[index].offsetHeight / 2 };
    });
    for (const side of [1, -1]) {
      const column = entries.filter(entry => entry.side === side).sort((a, b) => a.y - b.y);
      const gap = (a, b) => a.half + b.half + spacing;
      for (let index = 1; index < column.length; index++) column[index].y = Math.max(column[index].y, column[index - 1].y + gap(column[index - 1], column[index]));
      const last = column[column.length - 1];
      const overflow = last ? last.y + last.half - height : 0;
      if (overflow > 0) column.forEach(entry => { entry.y -= overflow; });
      for (let index = column.length - 2; index >= 0; index--) column[index].y = Math.min(column[index].y, column[index + 1].y - gap(column[index], column[index + 1]));
    }
    for (const entry of entries) {
      const labelX = entry.side > 0 ? centreX + outer + 30 : centreX - outer - 30;
      createSvg('path', { d: `M${entry.anchorX},${entry.anchorY}L${entry.elbowX},${entry.y}L${labelX - 6 * entry.side},${entry.y}`, 'data-cat': String(entry.item.cat),
        style: `fill:none;stroke:var(--_axis);stroke-width:1;opacity:${opacity}` }, this.leaders);
      entry.label.classList.toggle('is-left', entry.side < 0);
      entry.label.style.top = `${entry.y}px`;
      entry.label.style.left = `${entry.side > 0 ? labelX : labelX - DONUT_LABEL_WIDTH}px`;
      entry.label.style.opacity = String(opacity);
    }
  }

  describe(copy, formats) { return this.describeItems(copy, formats, this.model); }
}

const RADIAL_SWEEP = 1.5 * Math.PI;
const RADIAL_RING_MAX = 22;
const RADIAL_RING_GAP = 6;

class RadialRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'radial');
    this.stage = create('div', 'svg-stage', this.plot);
    this.svg = createSvg('svg', { 'aria-hidden': 'true' }, this.stage); // ds-lint-allow: svg (ring geometry drawn from data, not an icon glyph)
    this.labelLayer = create('div', null, this.stage);
    this.scaleNote = create('p', 'note', chart._footer);
    this.values = null;
  }

  destroy() { super.destroy(); this.stage.remove(); this.scaleNote.remove(); }

  draw(reason) {
    this.stop();
    const chart = this.chart, model = this.model = sliceModel(chart);
    const signature = model.items.map(item => item.key).join('\u0000');
    if (signature !== this.signature) {
      this.signature = signature;
      this.values = null;
      this.labelLayer.replaceChildren();
      this.labels = model.items.map(item => {
        const label = create('div', 'radial-label', this.labelLayer);
        label.dataset.cat = String(item.cat);
        create('span', null, label).textContent = item.label;
        create('b', null, label);
        return label;
      });
      if (reason !== 'resize') reason = 'enter';
    }
    model.items.forEach((item, index) => { this.labels[index]._tip = { title: item.label, lines: [chart._valueText(item.value, item.share)] }; });
    const target = model.items.map(item => item.value);
    const motion = chart._motion();
    if (reason === 'resize') { this.render(this.values || target); return; }
    const from = reason === 'enter' || !this.values ? target.map(() => 0) : this.values;
    const duration = reason === 'enter' ? motion.enter : motion.update;
    const staggered = reason === 'enter';
    this.animate(duration + (staggered ? motion.stagger * target.length : 0), elapsed => {
      this.render(target.map((value, index) => lerp(from[index], value, progressAt(elapsed, staggered ? index * motion.stagger : 0, duration))));
    });
    this.values = target;
  }

  render(values) {
    const chart = this.chart, model = this.model, formats = chart._formats(), copy = chart._copy();
    const maxSize = this.chart._optionsFor('radial').maxSize;
    const size = Math.min(maxSize, this.plot.clientWidth || maxSize);
    Object.assign(this.stage.style, { width: `${size}px`, height: `${size}px` });
    this.svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    this.svg.setAttribute('width', String(size));
    this.svg.setAttribute('height', String(size));
    this.svg.replaceChildren();
    const count = Math.max(1, model.items.length), centre = size / 2, outerMost = size / 2 - 1;
    const thickness = Math.max(14, Math.min(RADIAL_RING_MAX, (outerMost - 28) / count - RADIAL_RING_GAP));
    const corner = Math.min(8, thickness * 0.25);
    const scaleMax = niceCeiling(Math.max(0, ...model.items.map(item => item.value)), 10);
    model.items.forEach((item, index) => {
      const outer = outerMost - index * (thickness + RADIAL_RING_GAP), inner = outer - thickness;
      createSvg('path', { d: roundedSectorPath(centre, centre, inner, outer, 0, RADIAL_SWEEP, corner), style: 'fill:var(--_track)' }, this.svg);
      const stub = 2 * corner / outer + 8 / outer;
      const d = roundedSectorPath(centre, centre, inner, outer, 0, Math.max(stub, RADIAL_SWEEP * values[index] / scaleMax), corner);
      if (d) {
        const ring = createSvg('path', { d, 'data-cat': String(item.cat), style: `fill:${item.colour};stroke:var(--_stroke);stroke-width:1` }, this.svg);
        ring._tip = { title: item.label, lines: [chart._valueText(item.value, item.share)] };
      }
      const label = this.labels[index];
      label.style.top = `${centre - (outer + inner) / 2}px`;
      label.style.left = '0';
      label.style.width = `${centre - 10}px`;
      label.lastChild.textContent = formats.percent.format(item.value ? item.share * values[index] / item.value : 0);
    });
    this.scaleNote.textContent = fill(copy.radialScale, { sweep: formats.count.format(270), value: formats.count.format(scaleMax) });
    chart._applyHighlight();
  }

  describe(copy, formats) { return this.describeItems(copy, formats, this.model); }
}

const TREEMAP_NARROW_HEIGHT = 300;
const TREEMAP_CHIP_MIN = { width: 120, height: 64 };

function squarify(values, box) {
  const total = sum(values) || 1;
  const queue = values.map((value, index) => ({ index, area: value / total * box.w * box.h })).filter(entry => entry.area > 0);
  const rects = [];
  let free = { ...box }, row = [];
  const worst = (entries, side) => {
    const area = sum(entries.map(entry => entry.area)), largest = Math.max(...entries.map(entry => entry.area)), smallest = Math.min(...entries.map(entry => entry.area));
    return Math.max(side * side * largest / (area * area), area * area / (side * side * smallest));
  };
  const flush = () => {
    const area = sum(row.map(entry => entry.area));
    if (free.w >= free.h) {
      const columnWidth = area / free.h;
      let y = free.y;
      row.forEach(entry => { const height = entry.area / columnWidth; rects[entry.index] = { x: free.x, y, w: columnWidth, h: height }; y += height; });
      free = { x: free.x + columnWidth, y: free.y, w: free.w - columnWidth, h: free.h };
    } else {
      const rowHeight = area / free.w;
      let x = free.x;
      row.forEach(entry => { const width = entry.area / rowHeight; rects[entry.index] = { x, y: free.y, w: width, h: rowHeight }; x += width; });
      free = { x: free.x, y: free.y + rowHeight, w: free.w, h: free.h - rowHeight };
    }
    row = [];
  };
  while (queue.length) {
    const side = Math.min(free.w, free.h), next = queue[0];
    if (!row.length || worst([...row, next], side) <= worst(row, side)) { row.push(next); queue.shift(); } else flush();
  }
  if (row.length) flush();
  return rects;
}

class TreemapRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'treemap');
    this.stage = create('div', 'tm-stage', this.plot);
    this.tiles = new Map();
  }

  destroy() { super.destroy(); this.stage.remove(); }

  draw(reason) {
    const chart = this.chart, model = this.model = sliceModel(chart), formats = chart._formats(), motion = chart._motion();
    const width = this.plot.clientWidth || 600, height = width < 480 ? TREEMAP_NARROW_HEIGHT : chart._optionsFor('treemap').height;
    this.stage.style.height = `${height}px`;
    const order = model.items.map((_, index) => index).sort((a, b) => model.items[b].value - model.items[a].value);
    const rects = squarify(order.map(index => model.items[index].value), { x: 0, y: 0, w: width, h: height });
    const live = new Set();
    order.forEach((itemIndex, position) => {
      const item = model.items[itemIndex], rect = rects[position];
      if (!rect) return;
      live.add(item.key);
      let tile = this.tiles.get(item.key);
      const isNew = !tile;
      if (isNew) {
        tile = { element: create('div', 'tm-tile', this.stage) };
        tile.chip = create('div', 'tm-chip', tile.element);
        tile.share = create('b', null, tile.chip);
        tile.label = create('span', null, tile.chip);
        this.tiles.set(item.key, tile);
      }
      const { element, chip } = tile;
      element.dataset.cat = String(item.cat);
      element.style.background = item.colour;
      chip.style.background = item.isOther ? 'transparent' : chart._isDeck ? '' : chart._tint(item.cat);
      tile.share.textContent = formats.percent.format(item.share);
      tile.label.textContent = item.label;
      chip.style.opacity = !item.isOther && rect.w >= TREEMAP_CHIP_MIN.width && rect.h >= TREEMAP_CHIP_MIN.height ? '1' : '0';
      element._tip = { title: item.label, lines: [chart._valueText(item.value, item.share), ...(item.merged ? [item.merged.join(', ')] : [])] };
      const place = { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px` };
      const properties = ['left', 'top', 'width', 'height'];
      if (reason === 'enter' || isNew) {
        element.style.transition = 'none';
        Object.assign(element.style, { left: `${rect.x + rect.w / 2}px`, top: `${rect.y + rect.h / 2}px`, width: '0px', height: '0px', opacity: '0' });
        void element.offsetWidth;
        const duration = reason === 'enter' ? motion.enter : motion.update, delay = reason === 'enter' ? position * motion.stagger : 0;
        element.style.transition = [...properties, 'opacity'].map(name => `${name} ${duration}ms var(--_ease) ${delay}ms`).join(',');
        Object.assign(element.style, place, { opacity: '1' });
      } else {
        const duration = reason === 'resize' ? 0 : motion.update;
        element.style.transition = properties.map(name => `${name} ${duration}ms var(--_ease)`).join(',');
        Object.assign(element.style, place);
      }
    });
    for (const [key, tile] of this.tiles) if (!live.has(key)) { tile.element.remove(); this.tiles.delete(key); }
    chart._setLegend(order.map(index => model.items[index]).map(item => ({ label: item.label, cat: item.cat, colour: item.colour, value: formats.percent.format(item.share) })), true);
  }

  describe(copy, formats) { return this.describeItems(copy, formats, this.model); }
}

const QUADRANT_MIN_SIZE = 160;
const QUADRANT_COMPACT_BELOW = 320;
const QUADRANT_MAX_GROUPS = 3;

class QuadrantRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'quadrant');
    this.interactive = true;
    this.box = create('div', 'quadrant q-box', this.plot);
    this.yTitle = create('div', 'q-y-title', this.box);
    this.field = create('div', 'q-field', this.box);
    this.xTitle = create('div', 'q-x-title', this.box);
    create('div', 'q-mid-x', this.field);
    create('div', 'q-mid-y', this.field);
    this.zones = ['tl', 'tr', 'bl', 'br'].map(corner => {
      const zone = create('div', 'q-zone', this.field);
      zone.style[corner[0] === 't' ? 'top' : 'bottom'] = '0';
      zone.style[corner[1] === 'l' ? 'left' : 'right'] = '0';
      if (corner[1] === 'r') zone.style.textAlign = 'right';
      return zone;
    });
    this.warning = create('p', 'note', chart._footer);
    this.points = [];
    chart._viz.classList.add('is-grouped');
  }

  destroy() { super.destroy(); this.box.remove(); this.warning.remove(); this.chart._viz.classList.remove('is-grouped'); }

  buildModel() {
    const data = isObject(this.chart.data) ? this.chart.data : {};
    const axis = (raw) => {
      const value = isObject(raw) ? raw : {};
      const min = Number.isFinite(Number(value.min)) ? Number(value.min) : 1;
      const max = Number.isFinite(Number(value.max)) && Number(value.max) > min ? Number(value.max) : min + 4;
      return { title: String(value.title ?? ''), low: String(value.low ?? ''), high: String(value.high ?? ''), min, max };
    };
    return {
      x: axis(data.x), y: axis(data.y),
      zones: [0, 1, 2, 3].map(index => String((Array.isArray(data.zones) ? data.zones : [])[index] ?? '')),
      groups: (Array.isArray(data.groups) ? data.groups : []).map(String),
      points: (Array.isArray(data.points) ? data.points : []).filter(point => point && point.label != null && isCoordinate(point.x) && isCoordinate(point.y))
        .map(point => ({ label: String(point.label), x: Number(point.x), y: Number(point.y), group: Math.max(0, parseInt(point.group, 10) || 0) })),
    };
  }

  draw(reason) {
    this.stop();
    const chart = this.chart, model = this.model = this.buildModel(), copy = chart._copy(), formats = chart._formats();
    const coloured = model.groups.length <= QUADRANT_MAX_GROUPS;
    const signature = `${model.points.length}|${model.groups.length}`;
    if (signature !== this.signature) {
      this.signature = signature;
      this.points.forEach(point => { point.dot.remove(); point.label.remove(); });
      this.points = model.points.map(() => {
        const dot = create('button', 'q-point', this.field);
        dot.type = 'button';
        return { dot, label: create('div', 'q-label', this.field) };
      });
      reason = 'enter';
    }
    const axisTitle = (node, axis) => {
      node.replaceChildren();
      for (const text of [axis.low, `${axis.title} →`, axis.high]) create('span', null, node).textContent = text;
    };
    axisTitle(this.yTitle, model.y);
    axisTitle(this.xTitle, model.x);
    model.zones.forEach((text, index) => { this.zones[index].textContent = text; });
    model.points.forEach((point, index) => {
      const { dot, label } = this.points[index];
      const cat = coloured ? point.group : 0;
      dot.style.setProperty('--_c', chart._colour(cat));
      dot.dataset.cat = label.dataset.cat = String(cat);
      label.textContent = point.label;
      const description = `${point.label}: ${model.x.title} ${formats.decimal(point.x, 1)}, ${model.y.title} ${formats.decimal(point.y, 1)}`;
      dot.setAttribute('aria-label', description);
      dot._tip = { title: point.label, lines: [`${model.x.title} ${formats.decimal(point.x, 1)} · ${model.y.title} ${formats.decimal(point.y, 1)}`, ...(coloured && model.groups[point.group] ? [{ colour: chart._colour(cat), text: model.groups[point.group] }] : [])] };
    });
    chart._setLegend(coloured ? model.groups.map((label, index) => ({ label, cat: index, colour: chart._colour(index) })) : [], true);
    this.warning.textContent = coloured ? '' : fill(copy.quadrantTooManyGroups, { count: formats.count.format(model.groups.length) });
    const motion = chart._motion();
    if (reason === 'enter') {
      this.transitions(0);
      this.layout();
      this.points.forEach(point => { point.dot.style.transform = 'scale(0)'; point.label.style.opacity = '0'; });
      void this.field.offsetHeight;
      this.points.forEach((point, index) => {
        const delay = index * motion.stagger;
        point.dot.style.transition = `transform ${motion.enter}ms var(--_ease) ${delay}ms`;
        point.label.style.transition = `opacity ${motion.enter}ms var(--_ease) ${delay}ms`;
        point.dot.style.transform = 'scale(1)';
        point.label.style.opacity = '';
      });
      clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => this.transitions(chart._motion().update), motion.enter + motion.stagger * this.points.length + 20);
    } else {
      this.transitions(reason === 'resize' ? 0 : motion.update);
      this.layout();
    }
  }

  stop() { super.stop(); clearTimeout(this.settleTimer); }

  transitions(duration) {
    for (const point of this.points) {
      point.dot.style.transition = `left ${duration}ms var(--_ease), top ${duration}ms var(--_ease), transform ${duration}ms var(--_ease), opacity var(--aha-motion-mid,.2s) linear`;
      point.label.style.transition = `left ${duration}ms var(--_ease), top ${duration}ms var(--_ease), opacity ${duration}ms var(--_ease)`;
    }
  }

  layout() {
    const chart = this.chart, model = this.model;
    const legendWidth = chart._legend.hidden ? 0 : chart._legend.offsetWidth + 16;
    const available = (chart._viz.clientWidth || 600) - legendWidth - this.yTitle.offsetWidth - 8;
    const size = Math.max(QUADRANT_MIN_SIZE, Math.min(chart._optionsFor('quadrant').maxSize, available));
    this.field.style.width = this.field.style.height = `${size}px`;
    this.xTitle.style.width = `${size}px`;
    this.box.classList.toggle('is-compact', size < QUADRANT_COMPACT_BELOW);
    const toX = value => clamp((value - model.x.min) / (model.x.max - model.x.min), 0, 1) * size;
    const toY = value => size - clamp((value - model.y.min) / (model.y.max - model.y.min), 0, 1) * size;
    const zoneBoxes = this.zones.map(zone => ({ x: zone.offsetLeft, y: zone.offsetTop, w: zone.offsetWidth, h: zone.offsetHeight }));
    const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    const dots = model.points.map(point => ({ x: toX(point.x) - 10, y: toY(point.y) - 10, w: 20, h: 20 }));
    const placed = [];
    model.points.map((_, index) => index).sort((a, b) => toY(model.points[a].y) - toY(model.points[b].y)).forEach(index => {
      const point = model.points[index], { dot, label } = this.points[index];
      const x = toX(point.x), y = toY(point.y);
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      const width = label.offsetWidth, height = label.offsetHeight;
      const candidates = [{ x: x + 14, y: y - height / 2 }, { x: x - 14 - width, y: y - height / 2 }, { x: x - width / 2, y: y - 12 - height }, { x: x - width / 2, y: y + 12 }];
      const cost = spot => {
        const box = { x: spot.x, y: spot.y, w: width, h: height };
        const inside = spot.x >= 4 && spot.y >= 2 && spot.x + width <= size - 4 && spot.y + height <= size - 2;
        return 10 * placed.filter(other => overlaps(box, other)).length + 10 * zoneBoxes.filter(zone => overlaps(box, zone)).length
          + 5 * dots.filter((other, dotIndex) => dotIndex !== index && overlaps(box, other)).length + (inside ? 0 : 100);
      };
      let best = candidates[0], bestCost = Infinity;
      for (const spot of candidates) { const value = cost(spot); if (value < bestCost) { best = spot; bestCost = value; } }
      best = { x: clamp(best.x, 2, size - width - 2), y: clamp(best.y, 2, size - height - 2) };
      const hidden = bestCost >= 10;
      label.classList.toggle('is-overflow', hidden);
      if (!hidden) placed.push({ x: best.x, y: best.y, w: width, h: height });
      label.style.left = `${best.x}px`;
      label.style.top = `${best.y}px`;
    });
    chart._applyHighlight();
  }

  describe(copy, formats) {
    const model = this.model;
    return {
      summary: model.points.length ? fill(copy.quadrantSummary, { type: copy.typeNames.quadrant, x: model.x.title, y: model.y.title, items: formats.count.format(model.points.length) })
        : fill(copy.emptySummary, { type: copy.typeNames.quadrant }),
      head: [copy.item, model.x.title, model.y.title, ...(model.groups.length ? [copy.group] : [])],
      rows: model.points.map(point => [point.label, formats.decimal(point.x, 1), formats.decimal(point.y, 1), ...(model.groups.length ? [model.groups[point.group] || ''] : [])]),
    };
  }
}

const BELL_MAX_SERIES = 6;
const BELL_TWO_COLUMNS_FROM = 640;

class BellRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'bell');
    this.bell = create('div', 'bell', this.plot);
    this.startAnchor = create('div', 'bell-anchor is-start', this.bell);
    this.rowsNode = create('div', 'bell-rows', this.bell);
    this.endAnchor = create('div', 'bell-anchor is-end', this.bell);
    this.rows = [];
  }

  destroy() { super.destroy(); this.bell.remove(); }

  get options() { return this.chart._optionsFor('bell'); }

  buildModel() {
    const data = isObject(this.chart.data) ? this.chart.data : {};
    const given = Array.isArray(data.scale) ? data.scale.map(Number) : [];
    const increasing = given.length >= 2 && given.every((level, index) => Number.isFinite(level) && (index === 0 || level > given[index - 1]));
    const scale = increasing ? given : [1, 2, 3, 4, 5];
    const series = (Array.isArray(data.series) ? data.series : []).slice(0, BELL_MAX_SERIES).filter(entry => entry)
      .map(entry => ({ label: String(entry.label ?? ''), counts: scale.map((_, index) => toNumber((entry.counts || [])[index])) }));
    const anchors = Array.isArray(data.anchors) && data.anchors.length >= 2 ? data.anchors.map(String) : null;
    return { scale, series, anchors, total: sum(series.map(entry => sum(entry.counts))) };
  }

  stats(counts) {
    const scale = this.model.scale, total = sum(counts) || 1;
    const mean = sum(counts.map((count, index) => count * scale[index])) / total;
    const deviation = Math.sqrt(sum(counts.map((count, index) => count * (scale[index] - mean) ** 2)) / total);
    return { mean, deviation, counts: counts.slice(), shares: counts.map(count => count / total * 100), empty: sum(counts) === 0 };
  }

  columns() { return this.model.series.length > 4 && this.chart._root.clientWidth >= BELL_TWO_COLUMNS_FROM ? 2 : 1; }

  build() {
    const chart = this.chart, model = this.model, options = this.options, copy = chart._copy(), formats = chart._formats();
    this.rowsNode.replaceChildren();
    this.columnCount = this.columns();
    const count = model.series.length;
    this.bell.classList.toggle('is-multi', count > 1);
    this.rowsNode.style.gridTemplateColumns = `repeat(${this.columnCount}, minmax(0, 1fr))`;
    this.startAnchor.textContent = model.anchors ? model.anchors[0] : '';
    this.endAnchor.textContent = model.anchors ? model.anchors[model.anchors.length - 1] : '';
    this.startAnchor.hidden = this.endAnchor.hidden = !(options.showAnchorLabels && model.anchors);
    const perColumn = Math.ceil(count / this.columnCount);
    const height = count > 1 ? clamp(Math.round((Math.max(options.height, 420) - 30 * perColumn) / perColumn + 4), 90, 200) : options.height;
    this.rows = model.series.map((entry, index) => {
      const element = create('div', 'bell-row', this.rowsNode);
      const row = { index, height, hover: null, labelled: index >= count - this.columnCount || options.showStepLabels };
      if (count > 1) {
        row.title = create('div', 'bell-title', element);
        create('span', 'swatch', row.title).style.setProperty('--_c', chart._colour(index));
        row.title.append(entry.label);
        row.title._tip = { title: entry.label };
      }
      row.stage = create('div', 'bell-stage', element);
      row.svg = createSvg('svg', { 'aria-hidden': 'true' }, row.stage); // ds-lint-allow: svg (distribution curve drawn from data, not an icon glyph)
      row.text = create('div', null, row.stage);
      const hitLayer = create('div', null, row.stage);
      row.badge = create('div', 'bell-average', row.stage);
      row.badge.style.background = chart._isDeck ? '' : chart._tint(index);
      row.badge.style.setProperty('--_c', chart._colour(index));
      row.hits = model.scale.map((level, levelIndex) => {
        const hit = create('div', 'bell-hit', hitLayer);
        hit.addEventListener('pointerenter', () => { row.hover = levelIndex; this.render(row, row.shown); });
        hit.addEventListener('pointerleave', () => { row.hover = null; this.render(row, row.shown); });
        hit._tip = () => {
          const stats = row.shown;
          return { title: fill(copy.bellLevel, { level: formats.count.format(level) }), lines: [{ text: this.chart._plural('responses', stats.counts[levelIndex]), muted: formats.percent.format(stats.shares[levelIndex] / 100) }] };
        };
        return hit;
      });
      return row;
    });
  }

  draw(reason) {
    this.stop();
    const previous = this.model;
    const model = this.model = this.buildModel();
    const structural = !previous || previous.series.length !== model.series.length || previous.scale.length !== model.scale.length
      || model.series.some((entry, index) => entry.label !== previous.series[index].label) || this.columns() !== this.columnCount
      || JSON.stringify(this.builtOptions) !== JSON.stringify(this.options);
    if (structural) { this.build(); this.builtOptions = this.options; reason = reason === 'resize' ? 'resize' : 'enter'; }
    const motion = this.chart._motion();
    const targets = model.series.map(entry => this.stats(entry.counts));
    if (reason === 'resize' && !structural) { this.rows.forEach(row => this.render(row, row.shown)); return; }
    if (reason === 'enter' || structural) {
      this.rows.forEach((row, index) => { row.shown = targets[index]; });
      const levels = model.scale.length, rowStagger = 4 * motion.stagger;
      this.animate(motion.enter + motion.stagger * levels + rowStagger * (this.rows.length - 1), elapsed => {
        this.rows.forEach(row => {
          const local = elapsed - row.index * rowStagger;
          this.render(row, row.shown, progressAt(local, 0, motion.enter),
            level => progressAt(local, level * motion.stagger, 0.5 * motion.enter),
            progressAt(local, 0.5 * motion.enter, 0.5 * motion.enter + motion.stagger * levels));
        });
      });
      return;
    }
    const from = this.rows.map(row => row.shown);
    this.rows.forEach((row, index) => { row.shown = targets[index]; });
    this.animate(motion.update, elapsed => {
      const step = progressAt(elapsed, 0, motion.update);
      this.rows.forEach((row, index) => {
        const start = from[index], end = targets[index];
        this.render(row, { ...end, mean: lerp(start.mean, end.mean, step), deviation: lerp(start.deviation, end.deviation, step),
          shares: end.shares.map((share, level) => lerp(start.shares[level] ?? share, share, step)) });
      });
    });
  }

  render(row, stats, grow = 1, pointScale = () => 1, badgeOpacity = 1) {
    if (!stats) return;
    const chart = this.chart, options = this.options, scale = this.model.scale, formats = chart._formats(), copy = chart._copy();
    const width = row.stage.clientWidth, height = row.height, colour = chart._colour(row.index);
    row.stage.style.height = `${height}px`;
    const barWidth = Math.max(8, Math.min(32, (width - 60) / Math.max(1, scale.length - 1) * 0.5));
    const edge = options.showBars ? Math.max(12, barWidth / 2 + 4) : 12;
    const pad = { left: options.showYAxis ? Math.max(48, edge) : edge, right: edge, top: 12, bottom: row.labelled && (options.showEndLabels || options.showStepLabels) ? 38 : 24 };
    const baseline = height - pad.bottom;
    const gridded = options.showYAxis || options.showGrid;
    const peak = Math.max(1, ...stats.shares), ceiling = gridded ? niceCeiling(peak, 10) : peak;
    const toX = value => pad.left + (value - scale[0]) / (scale[scale.length - 1] - scale[0]) * (width - pad.left - pad.right);
    const toY = share => baseline - share / ceiling * (baseline - pad.top) * grow;
    const step = toX(scale[1] ?? scale[0] + 1) - toX(scale[0]);
    const svg = row.svg;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.replaceChildren();
    row.text.replaceChildren();
    if (gridded) {
      const every = ceiling <= 40 ? 10 : 20;
      for (let value = every; value <= ceiling; value += every) {
        const y = Math.round(baseline - value / ceiling * (baseline - pad.top)) + 0.5;
        if (options.showGrid) createSvg('line', { x1: pad.left, x2: width - pad.right, y1: y, y2: y, style: 'stroke:var(--_grid);stroke-width:1' }, svg);
        if (options.showYAxis) {
          const tick = create('div', 'tick', row.text);
          tick.textContent = formats.percent.format(value / 100);
          tick.style.right = `${width - pad.left + 8}px`;
          tick.style.top = `${y - 8}px`;
        }
      }
    }
    if (options.showSdBand && !stats.empty) {
      const low = scale[0], high = scale[scale.length - 1];
      const [from, to] = [toX(clamp(stats.mean - stats.deviation, low, high)), toX(clamp(stats.mean + stats.deviation, low, high))].sort((a, b) => a - b);
      if (to - from >= 1) createSvg('rect', { x: from, y: pad.top, width: to - from, height: Math.max(0, baseline - pad.top), rx: Math.min(8, (to - from) / 2), style: 'fill:var(--_track)' }, svg);
    }
    if (options.showBars) stats.shares.forEach((share, index) => {
      const barHeight = baseline - toY(share);
      if (barHeight > 0) createSvg('rect', { x: toX(scale[index]) - barWidth / 2, y: baseline - barHeight, width: barWidth, height: barHeight,
        rx: Math.max(0, Math.min(8, barWidth / 2, barHeight / 2)), style: `fill:${chart._tint(row.index)};stroke:var(--_stroke);stroke-width:1` }, svg);
    });
    const curve = monotoneCurve(stats.shares.map((share, index) => [toX(scale[index]), toY(share)]));
    if (options.showFill) createSvg('path', { d: `${curve.d}L${toX(scale[scale.length - 1])},${baseline}L${toX(scale[0])},${baseline}Z`, style: `fill:${colour};fill-opacity:.62;stroke:none` }, svg);
    else createSvg('path', { d: curve.d, style: `fill:none;stroke:${colour};stroke-width:2.5;stroke-linejoin:round;stroke-linecap:round` }, svg);
    if (options.showMeanLine && !stats.empty) {
      const x = Math.round(toX(stats.mean)) + 0.5;
      createSvg('line', { x1: x, x2: x, y1: baseline, y2: curve.at(toX(stats.mean)), style: `stroke:${colour};stroke-width:1;stroke-dasharray:4 4` }, svg);
    }
    createSvg('line', { x1: toX(scale[0]), x2: toX(scale[scale.length - 1]), y1: baseline + 0.5, y2: baseline + 0.5, style: 'stroke:var(--_axis);stroke-width:1' }, svg);
    if (options.showPoints) stats.shares.forEach((share, index) => {
      const pop = pointScale(index);
      if (pop > 0) createSvg('circle', { cx: toX(scale[index]), cy: toY(share), r: (row.hover === index && options.showTooltip ? 8 : 5) * pop, style: `fill:${colour};stroke:var(--_stroke);stroke-width:1` }, svg);
    });
    if (row.labelled) scale.forEach((level, index) => {
      if (!options.showStepLabels && (!options.showEndLabels || (index !== 0 && index !== scale.length - 1))) return;
      const tick = create('div', 'tick', row.text);
      tick.textContent = formats.count.format(level);
      tick.style.left = `${toX(level)}px`;
      tick.style.top = `${baseline + 12}px`;
      tick.style.transform = 'translateX(-50%)';
    });
    row.hits.forEach((hit, index) => {
      const left = Math.max(0, toX(scale[index]) - step / 2);
      Object.assign(hit.style, { left: `${left}px`, width: `${Math.min(width, toX(scale[index]) + step / 2) - left}px`, top: '0', height: `${height}px`, display: options.showTooltip ? '' : 'none' });
    });
    const label = this.model.series[row.index].label;
    row.badge.hidden = !options.showAverage || stats.empty;
    row.badge.textContent = formats.decimal(stats.mean, 1);
    row.badge._tip = { title: fill(copy.bellAverage, { label, value: formats.decimal(stats.mean, 1) }) };
    Object.assign(row.badge.style, { left: `${clamp(toX(stats.mean), 22, width - 22)}px`, top: `${baseline}px`, opacity: String(badgeOpacity), transform: `translate(-50%,-50%) scale(${0.6 + 0.4 * badgeOpacity})` });
  }

  describe(copy, formats) {
    const model = this.model, typeName = copy.typeNames.bell, chart = this.chart;
    let summary = model.total ? fill(copy.bellSummary, { type: typeName, items: formats.count.format(model.series.length), responses: chart._responsesText(model.total) })
      : fill(copy.emptySummary, { type: typeName });
    if (model.total) summary += ' ' + model.series.map(entry => fill(copy.bellStatement, { label: entry.label || typeName, value: formats.decimal(this.stats(entry.counts).mean, 1) })).join(' ');
    return {
      summary,
      head: [copy.item, ...model.scale.map(level => `${copy.level} ${formats.count.format(level)}`), copy.average],
      rows: model.series.map(entry => [entry.label || typeName, ...entry.counts.map(count => formats.count.format(count)), formats.decimal(this.stats(entry.counts).mean, 1)]),
    };
  }
}

const RADAR_REVEALS = {
  bloom: { kind: 'move', inward: false, perAxis: false },
  crystallise: { kind: 'move', inward: true, perAxis: false },
  pinwheel: { kind: 'move', inward: false, perAxis: true },
  vortex: { kind: 'move', inward: true, perAxis: true },
  sweep: { kind: 'sweep' },
  ring: { kind: 'ring' },
  cascade: { kind: 'cascade', perAxis: true },
  fade: { kind: 'fade' },
};
let radarCount = 0;

class RadarRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'radar');
    this.interactive = true;
    this.id = `aha-radar-${++radarCount}`;
    this.stage = create('div', 'rd-stage', this.plot);
    this.svg = createSvg('svg', { 'aria-hidden': 'true' }, this.stage); // ds-lint-allow: svg (radar geometry drawn from data, not an icon glyph)
    [this.gridLayer, this.shapeLayer, this.overlayLayer, this.hitLayer] = [0, 1, 2, 3].map(() => createSvg('g', {}, this.svg));
    this.labelLayer = create('div', 'rd-labels', this.stage);
    this.chipLayer = create('div', 'rd-chips', this.stage);
    this.meta = create('p', 'note', chart._footer);
    this.table = create('div', 'rd-table', chart._footer);
    this.hiddenSubjects = new Set();
    this.focusAxis = null;
    this.highlightSubject = null;
    this.waitingFrame = 0;
    this.frameState = null;
    this.axisButtons = [];
    this.chips = [];
  }

  destroy() { super.destroy(); this.stage.remove(); this.meta.remove(); this.table.remove(); }
  stop() { super.stop(); if (this.waitingFrame) cancelAnimationFrame(this.waitingFrame); this.waitingFrame = 0; }

  get options() { return this.chart._optionsFor('radar'); }

  buildModel() {
    const data = isObject(this.chart.data) ? this.chart.data : {};
    const dimensions = (Array.isArray(data.dimensions) ? data.dimensions : []).map(String);
    const people = toNumber(data.people);
    const scale = [5, 10, 100].includes(Number(data.scale)) ? Number(data.scale) : 5;
    const subjects = (Array.isArray(data.subjects) ? data.subjects : []).filter(Boolean).map(subject => ({
      label: String(subject.label || ''),
      scores: dimensions.map((_, index) => Number((subject.scores || [])[index]) || 0),
      responses: dimensions.map((_, index) => (subject.responses ? toNumber(subject.responses[index]) : toNumber(subject.people) || people)),
    }));
    return { dimensions, subjects, people, scale };
  }

  hasResponses() { return this.model.subjects.some(subject => subject.responses.some(count => count > 0)); }
  visibleSubjects() { return this.model.subjects.map((_, index) => index).filter(index => !this.hiddenSubjects.has(index)); }
  isMulti() { return this.model.subjects.length > 1; }
  form() { return this.isMulti() && this.options.form !== 'outline' ? 'outline' : this.options.form; }
  showsScores() { return this.options.showScores && !this.isMulti() && this.hasResponses(); }
  angle(index) { return (360 * index / this.model.dimensions.length - 90) * Math.PI / 180; }
  scaleText(scale) { return scale === 100 ? '0–100%' : `1–${scale}`; }

  scoreText(value) {
    const formats = this.chart._formats();
    if (this.model.scale === 100) return formats.percent.format(Math.round(value) / 100);
    const rounded = Math.round(value * 10) / 10;
    return formats.decimal(rounded, Number.isInteger(rounded) ? 0 : 1);
  }

  averageOf(subject) {
    const answered = subject.scores.filter((_, index) => subject.responses[index] > 0);
    return answered.length ? sum(answered) / answered.length : null;
  }

  draw(reason) {
    const previous = this.model;
    this.model = this.buildModel();
    const shapeChanged = !previous || previous.dimensions.length !== this.model.dimensions.length || previous.subjects.length !== this.model.subjects.length;
    if (shapeChanged) { this.hiddenSubjects.clear(); this.shown = this.model.subjects.map(() => this.model.dimensions.map(() => 0)); }
    const revealKey = `${this.options.reveal}|${this.options.pace}`;
    const revealChanged = this.revealKey !== undefined && this.revealKey !== revealKey;
    this.revealKey = revealKey;
    const wasWaiting = previous && !previous.subjects.some(subject => subject.responses.some(count => count > 0));
    this.syncLegend();
    this.layout();
    this.syncTable();
    this.syncMeta();
    this.stop();
    if (!this.hasResponses()) return this.waitingLoop();
    if (reason === 'enter' || revealChanged || wasWaiting || shapeChanged) this.reveal();
    else if (reason === 'resize') this.settle();
    else this.tweenUpdate();
  }

  layout() {
    const chart = this.chart, options = this.options, model = this.model;
    const width = Math.max(200, this.stage.clientWidth);
    const layoutKey = JSON.stringify([width, model.dimensions, model.scale, this.isMulti(), options]);
    if (layoutKey === this.layoutKey) return;
    this.layoutKey = layoutKey;
    const height = width < 520 ? Math.round(clamp(width * 1.02, 280, options.height)) : options.height;
    this.stage.style.height = `${height}px`;
    this.svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const centreX = width / 2, centreY = height / 2;
    const chipRoom = model.scale === 100 ? 60 : 46;
    const scoreSpace = options.showScores && !this.isMulti() ? 1 : 0;
    const gapFor = (cos, sin) => 10 + scoreSpace * (18 + Math.abs(cos) * chipRoom + 26 * Math.abs(sin));
    const buildLabels = (mode) => {
      this.labelLayer.replaceChildren();
      this.axisButtons = [];
      if (mode === 'none') return [];
      return model.dimensions.map((text, index) => {
        const button = create('button', `rd-axis${mode === 'number' ? ' is-number' : ''}`, this.labelLayer);
        button.type = 'button';
        button.dataset.axis = String(index);
        const cos = Math.cos(this.angle(index)), sin = Math.sin(this.angle(index)), vertical = Math.abs(cos) < 0.3;
        if (mode === 'number') {
          create('span', 'rd-number', button).textContent = chart._formats().count.format(index + 1);
          button.setAttribute('aria-label', text);
        } else {
          create('span', null, button).textContent = text;
          button.style.maxWidth = `${vertical ? clamp(0.42 * width, 120, 320) : clamp(0.2 * width, 96, 220)}px`;
          button.style.textAlign = vertical ? 'center' : cos > 0 ? 'left' : 'right';
        }
        const focus = () => this.focus(index, button);
        button.addEventListener('pointerenter', focus);
        button.addEventListener('pointerleave', () => this.focus(null));
        button.addEventListener('focus', focus);
        button.addEventListener('blur', () => this.focus(null));
        button.addEventListener('click', focus);
        this.axisButtons.push(button);
        return { width: button.offsetWidth, height: button.offsetHeight, cos, sin, vertical, gap: gapFor(cos, sin) };
      });
    };
    const spotFor = (label, radius) => {
      const x = centreX + (radius + label.gap) * label.cos, y = centreY + (radius + label.gap) * label.sin;
      return label.vertical ? { left: x - label.width / 2, top: label.sin < 0 ? y - label.height : y } : { left: label.cos > 0 ? x : x - label.width, top: y - label.height / 2 };
    };
    const fitRadius = (labels) => {
      const fits = radius => labels.every(label => {
        const { left, top } = spotFor(label, radius);
        return left >= 0 && top >= 0 && left + label.width <= width && top + label.height <= height;
      });
      let low = 24, high = Math.min(centreX, centreY) - (labels.length ? 4 : gapFor(1, 0));
      if (fits(high)) return high;
      for (let step = 0; step < 22; step++) { const middle = (low + high) / 2; if (fits(middle)) low = middle; else high = middle; }
      return low;
    };
    let mode = options.showAxisLabels ? 'full' : 'none';
    let labels = buildLabels(mode), radius = fitRadius(labels);
    if (mode === 'full' && radius < Math.min(96, 0.3 * Math.min(width, height))) { mode = 'number'; labels = buildLabels(mode); radius = fitRadius(labels); }
    labels.forEach((label, index) => {
      const { left, top } = spotFor(label, radius);
      this.axisButtons[index].style.transform = `translate(${round2(left)}px, ${round2(top)}px)`;
    });
    this.geometry = { width, height, centreX, centreY, radius, inner: options.hollowCentre ? 0.16 * radius : 0, mode };
    this.drawGrid();
    this.drawHits();
    this.chipLayer.replaceChildren();
    this.chips = model.dimensions.map(() => { const chip = create('span', 'rd-chip', this.chipLayer); chip.hidden = true; return chip; });
  }

  point(radius, index) { const { centreX, centreY } = this.geometry; return { x: centreX + radius * Math.cos(this.angle(index)), y: centreY + radius * Math.sin(this.angle(index)) }; }
  radiusOf(score) { const { inner, radius } = this.geometry; return inner + (radius - inner) * clamp((Number.isFinite(score) ? score : 0) / this.model.scale, 0, 1); }
  polygon(points) { return points.length ? 'M' + points.map(point => `${round2(point.x)} ${round2(point.y)}`).join('L') + 'Z' : ''; }

  ringPath(radius) {
    if (this.options.grid === 'polygon') return this.polygon(this.model.dimensions.map((_, index) => this.point(radius, index)));
    const { centreX, centreY } = this.geometry, r = round2(radius);
    return `M${round2(centreX - radius)} ${centreY}a${r} ${r} 0 1 0 ${round2(2 * radius)} 0a${r} ${r} 0 1 0 ${round2(-2 * radius)} 0Z`;
  }

  wedge(fromDegrees, toDegrees, radius) {
    const from = fromDegrees * Math.PI / 180, to = toDegrees * Math.PI / 180, large = toDegrees - fromDegrees > 180 ? 1 : 0;
    const { centreX, centreY } = this.geometry, r = round2(radius);
    return `M${round2(centreX)} ${round2(centreY)}L${round2(centreX + radius * Math.cos(from))} ${round2(centreY + radius * Math.sin(from))}A${r} ${r} 0 ${large} 1 ${round2(centreX + radius * Math.cos(to))} ${round2(centreY + radius * Math.sin(to))}Z`;
  }

  ringCount() { return this.model.scale <= 5 ? this.model.scale : 5; }

  drawGrid() {
    const options = this.options, { radius, inner, centreX, centreY } = this.geometry, model = this.model;
    const layer = this.gridLayer;
    layer.replaceChildren();
    if (options.grid !== 'none' && options.rings !== 'hidden') {
      const rings = this.ringCount();
      for (let ring = 1; ring <= rings; ring++) {
        const outer = inner + (radius - inner) * ring / rings, below = inner + (radius - inner) * (ring - 1) / rings;
        if (options.rings === 'zebra' && ring % 2 === 0) createSvg('path', { d: this.ringPath(outer) + (below > 0.5 ? this.ringPath(below) : ''), 'fill-rule': 'evenodd', style: 'fill:var(--_track)' }, layer);
        createSvg('path', { d: this.ringPath(outer), fill: 'none', style: `stroke:var(${ring === rings ? '--_axis' : '--_grid'})`, 'stroke-width': '1' }, layer);
      }
      model.dimensions.forEach((_, index) => {
        const from = this.point(inner, index), to = this.point(radius, index);
        createSvg('line', { x1: round2(from.x), y1: round2(from.y), x2: round2(to.x), y2: round2(to.y), style: 'stroke:var(--_grid)', 'stroke-width': '1' }, layer);
      });
      const step = (radius - inner) / rings;
      if (options.showScaleTicks && step >= 20) for (let ring = 1; ring <= rings; ring++) {
        const tick = create('span', 'rd-tick', this.labelLayer);
        const formats = this.chart._formats();
        tick.textContent = model.scale === 100 ? formats.percent.format(ring / rings) : formats.count.format(model.scale / rings * ring);
        tick.style.left = `${round2(centreX)}px`;
        tick.style.top = `${round2(centreY - inner - step * ring)}px`;
      }
    }
    if (options.hollowCentre && options.grid !== 'none') createSvg('path', { d: this.ringPath(inner), fill: 'none', style: 'stroke:var(--_grid)', 'stroke-width': '1' }, layer);
  }

  drawHits() {
    const count = this.model.dimensions.length, { centreX, centreY, radius } = this.geometry;
    const reach = radius + 24, half = Math.PI / count;
    this.hitLayer.replaceChildren();
    for (let index = 0; index < count; index++) {
      const angle = this.angle(index);
      const start = { x: centreX + reach * Math.cos(angle - half), y: centreY + reach * Math.sin(angle - half) };
      const end = { x: centreX + reach * Math.cos(angle + half), y: centreY + reach * Math.sin(angle + half) };
      const hit = createSvg('path', { class: 'rd-hit', d: `M${round2(centreX)} ${round2(centreY)}L${round2(start.x)} ${round2(start.y)}A${round2(reach)} ${round2(reach)} 0 0 1 ${round2(end.x)} ${round2(end.y)}Z` }, this.hitLayer);
      hit.addEventListener('pointerenter', () => this.focus(index, hit));
      hit.addEventListener('pointerleave', () => this.focus(null));
      hit.addEventListener('click', () => this.focus(this.focusAxis === index ? null : index, hit));
    }
  }

  // string-built for 60 fps; only numbers and var() colours reach the markup, never user text
  subjectMarkup(subjectIndex, scores, offset) {
    const chart = this.chart, options = this.options, colour = chart._colour(subjectIndex), form = this.form();
    const { inner, radius, centreX, centreY } = this.geometry;
    let points = scores.map((score, index) => this.point(this.radiusOf(score), index));
    if (offset) {
      const unit = (x, y) => { const length = Math.hypot(x, y) || 1; return { x: x / length, y: y / length }; };
      points = points.map((point, index) => {
        const before = points[(index - 1 + points.length) % points.length], after = points[(index + 1) % points.length];
        const incoming = unit(point.x - before.x, point.y - before.y), outgoing = unit(after.x - point.x, after.y - point.y);
        const normal = unit(-incoming.y - outgoing.y, incoming.x + outgoing.x);
        return { x: point.x + 3.5 * offset * normal.x, y: point.y + 3.5 * offset * normal.y };
      });
    }
    const faded = this.highlightSubject != null && this.highlightSubject !== subjectIndex ? ' opacity=".38"' : '';
    let markup = '';
    if (form === 'radial-bars') {
      const count = this.model.dimensions.length, hub = Math.max(inner, 0.22 * radius), chord = hub * Math.sin(Math.PI / count);
      const half = Math.max(3, Math.min(9, 0.9 * chord)), trackHalf = Math.max(half + 2, Math.min(14, 1.9 * chord));
      markup += `<circle cx="${round2(centreX)}" cy="${round2(centreY)}" r="${round2(hub)}" fill="none" style="stroke:var(--_grid)" stroke-width="1"/>`;
      scores.forEach((score, index) => {
        const reach = Math.max(this.radiusOf(score), hub + 2 * half);
        const rotate = `translate(${round2(centreX)} ${round2(centreY)}) rotate(${round2(360 * index / count - 90)})`;
        markup += `<rect x="${round2(hub)}" y="${round2(-trackHalf)}" width="${round2(radius - hub)}" height="${round2(2 * trackHalf)}" rx="${round2(Math.min(8, trackHalf))}" transform="${rotate}" style="fill:var(--_track)"/>`;
        markup += `<rect x="${round2(hub)}" y="${round2(-half)}" width="${round2(reach - hub)}" height="${round2(2 * half)}" rx="${round2(Math.min(8, half))}" transform="${rotate}" style="fill:${colour};stroke:var(--_stroke)" stroke-width="1"/>`;
      });
      return `<g${faded}>${markup}</g>`;
    }
    if (form === 'filled') markup += `<path d="${this.polygon(points)}${inner > 0.5 ? this.ringPath(inner) : ''}" fill-rule="evenodd" style="fill:${colour};fill-opacity:.22;stroke:${colour}" stroke-width="2.5" stroke-linejoin="round"/>`;
    else markup += `<path d="${this.polygon(points)}" fill="none" style="stroke:${colour}" stroke-width="2.5" stroke-linejoin="round"/>`;
    if (options.showPoints) points.forEach(point => { markup += `<circle cx="${round2(point.x)}" cy="${round2(point.y)}" r="5" style="fill:${colour};stroke:var(--_stroke)" stroke-width="1"/>`; });
    return `<g${faded}>${markup}</g>`;
  }

  frame(state) {
    this.frameState = state;
    const visible = this.visibleSubjects();
    const offsets = visible.map((_, position) => (visible.length > 1 ? position - (visible.length - 1) / 2 : 0));
    const shapes = () => visible.map((subjectIndex, position) => this.subjectMarkup(subjectIndex, state.scores[subjectIndex], offsets[position])).join('');
    let markup = '';
    if (state.perAxisOpacity) {
      const count = this.model.dimensions.length, body = shapes();
      state.perAxisOpacity.forEach((opacity, index) => {
        if (opacity <= 0.004) return;
        const centre = 360 * index / count - 90, id = `${this.id}-axis-${index}`;
        markup += `<clipPath id="${id}"><path d="${this.wedge(centre - 180 / count, centre + 180 / count, 1.9 * this.geometry.radius)}"/></clipPath><g clip-path="url(#${id})" opacity="${round2(opacity)}">${body}</g>`;
      });
    } else if (state.clip) {
      markup += `<clipPath id="${this.id}-clip"><path d="${state.clip}"/></clipPath><g clip-path="url(#${this.id}-clip)" opacity="${round2(state.opacity ?? 1)}">${shapes()}</g>`;
    } else if (state.scores) markup += `<g opacity="${round2(state.opacity ?? 1)}">${shapes()}</g>`;
    this.shapeLayer.innerHTML = markup;
    this.overlayLayer.innerHTML = (state.overlay || '') + this.focusLine();
    this.placeChips(state);
  }

  placeChips(state) {
    const subject = this.model.subjects[0], options = this.options;
    this.chips.forEach((chip, index) => {
      const show = this.showsScores() && state.scores && !this.hiddenSubjects.has(0) && subject.responses[index] > 0;
      const opacity = state.chipOpacity ? state.chipOpacity[index] : 1;
      chip.hidden = !show || opacity <= 0.01;
      if (chip.hidden) return;
      chip.className = `rd-chip${options.scoreStyle === 'chip' ? ' is-chip' : options.scoreStyle === 'muted' ? ' is-muted' : ''}`;
      chip.textContent = this.scoreText(subject.scores[index]);
      chip.style.opacity = String(round2(opacity));
      const angle = this.angle(index);
      const reach = this.radiusOf(state.scores[0][index]) + 9 + Math.abs(Math.cos(angle)) * chip.offsetWidth / 2 + Math.abs(Math.sin(angle)) * chip.offsetHeight / 2;
      chip.style.left = `${round2(this.geometry.centreX + reach * Math.cos(angle))}px`;
      chip.style.top = `${round2(this.geometry.centreY + reach * Math.sin(angle))}px`;
    });
  }

  focusLine() {
    if (this.focusAxis == null || !this.geometry) return '';
    const from = this.point(this.geometry.inner, this.focusAxis), to = this.point(this.geometry.radius, this.focusAxis);
    return `<line x1="${round2(from.x)}" y1="${round2(from.y)}" x2="${round2(to.x)}" y2="${round2(to.y)}" style="stroke:var(--_ink-3)" stroke-width="2"/>`;
  }

  fullScores(fraction) { return this.model.subjects.map(() => this.model.dimensions.map(() => this.model.scale * fraction)); }
  targetScores() { return this.model.subjects.map(subject => subject.scores.slice()); }

  sweepOverlay(degrees) {
    const { centreX, centreY, radius } = this.geometry, angle = degrees * Math.PI / 180;
    const line = `<line x1="${round2(centreX)}" y1="${round2(centreY)}" x2="${round2(centreX + radius * Math.cos(angle))}" y2="${round2(centreY + radius * Math.sin(angle))}" style="stroke:var(--_s1)" stroke-width="2" stroke-opacity=".9"/>`;
    return this.form() === 'outline' ? line : `<path d="${this.wedge(degrees - 26, degrees, radius)}" style="fill:var(--_s1)" fill-opacity=".14"/>${line}`;
  }

  centreDot(opacity) { return opacity <= 0.01 ? '' : `<circle cx="${round2(this.geometry.centreX)}" cy="${round2(this.geometry.centreY)}" r="5" style="fill:var(--_s1)" fill-opacity="${round2(opacity)}"/>`; }
  startDegrees() { return -90 - 180 / this.model.dimensions.length; }

  waitingLoop() {
    const reveal = RADAR_REVEALS[this.options.reveal] || RADAR_REVEALS.bloom;
    const range = reveal.inward ? { min: 0.8, max: 1 } : { min: 0.4, max: 0.6 };
    const still = this.chart._motion().enter === 0, start = performance.now();
    const step = (now) => {
      const cycle = still ? 0.5 : ((now - start) / RADAR_WAITING_LOOP_MS) % 1;
      const breath = 0.5 - 0.5 * Math.cos(2 * cycle * Math.PI);
      this.waitingLevel = null;
      if (reveal.kind === 'move') {
        const level = reveal.inward ? range.max - (range.max - range.min) * breath : range.min + (range.max - range.min) * breath;
        this.waitingLevel = level;
        this.frame({ scores: this.fullScores(level), opacity: 0.6, overlay: reveal.inward ? '' : this.centreDot(0.55 * clamp(1 - 2.2 * level, 0, 1)) });
      } else if (reveal.kind === 'sweep') this.frame({ scores: null, overlay: this.sweepOverlay(this.startDegrees() + 360 * cycle) });
      else this.frame({ scores: this.fullScores(1), opacity: 0.14 + 0.1 * breath });
      this.waitingFrame = !still && this.chart.isConnected && !this.hasResponses() ? requestAnimationFrame(step) : 0;
    };
    step(performance.now());
  }

  reveal() {
    const reveal = RADAR_REVEALS[this.options.reveal] || RADAR_REVEALS.bloom;
    const motion = this.chart._motion(), count = this.model.dimensions.length;
    const staged = this.options.pace === 'stage' && motion.enter > 0;
    const axisLag = Math.min(0.12, (1 - 0.42) / Math.max(1, count - 1));
    const duration = motion.enter === 0 ? 0 : staged ? RADAR_STAGE_PACE_MS : motion.enter + (reveal.perAxis ? motion.stagger * (count - 1) : 0);
    const target = this.targetScores(), waitingLevel = this.waitingLevel;
    this.waitingLevel = null;
    this.animate(duration, elapsed => {
      if (elapsed === Infinity) return this.settle();
      const overall = clamp(elapsed / duration, 0, 1), eased = staged ? easeInOutQuad(overall) : easeViz(overall);
      const perAxis = Array.from({ length: count }, (_, index) => (reveal.perAxis
        ? (staged ? easeInOutQuad(clamp((elapsed / RADAR_STAGE_PACE_MS - index * axisLag) / 0.42, 0, 1)) : easeViz(clamp((elapsed - index * motion.stagger) / motion.enter, 0, 1)))
        : (staged ? easeInOutQuad(clamp(elapsed / RADAR_STAGE_PACE_MS, 0, 1)) : easeViz(clamp(elapsed / motion.enter, 0, 1)))));
      this.shown = target;
      if (reveal.kind === 'move') {
        const origin = waitingLevel != null ? waitingLevel * this.model.scale : reveal.inward ? this.model.scale : 0;
        this.shown = target.map(scores => scores.map((score, index) => origin + (score - origin) * perAxis[index]));
        this.frame({ scores: this.shown, opacity: reveal.inward ? 0.4 + 0.6 * overall : 0.55 + 0.45 * overall,
          overlay: !reveal.inward && overall < 0.14 ? this.centreDot(0.55 * (1 - overall / 0.14)) : '', chipOpacity: perAxis });
      } else if (reveal.kind === 'cascade') this.frame({ scores: target, perAxisOpacity: perAxis, chipOpacity: perAxis });
      else if (reveal.kind === 'fade') this.frame({ scores: target, opacity: eased, chipOpacity: perAxis.map(() => eased) });
      else if (reveal.kind === 'ring') {
        const { centreX, centreY, radius } = this.geometry, reach = radius * eased * 1.05, r = round2(reach);
        this.frame({ scores: target, clip: `M${round2(centreX - reach)} ${round2(centreY)}a${r} ${r} 0 1 0 ${round2(2 * reach)} 0a${r} ${r} 0 1 0 ${round2(-2 * reach)} 0Z`,
          overlay: eased > 0.02 && eased < 0.99 ? `<path d="${this.ringPath(Math.min(radius, radius * eased))}" fill="none" style="stroke:var(--_s1)" stroke-opacity=".5" stroke-width="2"/>` : '',
          chipOpacity: target[0].map(score => clamp((reach - this.radiusOf(score) - 27) / 12, 0, 1)) });
      } else {
        const start = this.startDegrees(), end = start + Math.min(359.9, 360 * eased), slice = 360 / count;
        this.frame({ scores: target, clip: this.wedge(start, end, 1.9 * this.geometry.radius), overlay: eased < 0.99 ? this.sweepOverlay(end) : '',
          chipOpacity: perAxis.map((_, index) => clamp((360 * eased - (index * slice + slice / 2)) / 25, 0, 1)) });
      }
    });
  }

  tweenUpdate() {
    const motion = this.chart._motion(), from = (this.shown || []).map(scores => scores.slice()), target = this.targetScores();
    this.animate(motion.update, elapsed => {
      if (elapsed === Infinity) return this.settle();
      const step = easeViz(clamp(elapsed / motion.update, 0, 1));
      this.shown = target.map((scores, subject) => scores.map((score, index) => lerp(from[subject] && Number.isFinite(from[subject][index]) ? from[subject][index] : 0, score, step)));
      this.frame({ scores: this.shown });
    });
  }

  settle() { this.shown = this.targetScores(); this.frame({ scores: this.shown }); }

  repaint() {
    if (this.hasResponses()) this.frame({ ...(this.frameState || {}), scores: this.shown });
    else if (!this.waitingFrame) this.waitingLoop();
  }

  onHighlight(cat) { this.highlightSubject = this.isMulti() && cat != null ? Number(cat) : null; if (this.geometry) this.repaint(); }

  focus(axis, anchor) {
    this.focusAxis = axis;
    this.axisButtons.forEach((button, index) => button.classList.toggle('is-hl', index === axis));
    this.table.querySelectorAll('.rd-row').forEach(row => row.classList.toggle('is-hl', Number(row.dataset.axis) === axis));
    if (this.frameState) this.overlayLayer.innerHTML = (this.frameState.overlay || '') + this.focusLine();
    const chart = this.chart;
    if (axis == null || !this.options.showTooltip || !chart._tooltipOn) return chart._hideTip();
    const formats = chart._formats(), copy = chart._copy(), model = this.model;
    const lines = this.visibleSubjects().map(subjectIndex => {
      const subject = model.subjects[subjectIndex];
      const name = this.isMulti() ? `${subject.label || fill(copy.radarSubjectFallback, { index: subjectIndex + 1 })}: ` : '';
      const answered = subject.responses[axis] > 0;
      return { colour: chart._colour(subjectIndex), text: name + (answered ? this.scoreText(subject.scores[axis]) : ''),
        muted: answered ? `${model.scale === 100 ? '' : `/ ${model.scale} `}· ${chart._plural('submissions', subject.responses[axis])}` : copy.radarNoResponses };
    });
    const target = this.axisButtons[axis] || this.chips[axis] || anchor;
    if (target && target.getBoundingClientRect().width) chart._showTipOver(target, { title: model.dimensions[axis], lines });
  }

  syncLegend() {
    const chart = this.chart, model = this.model, options = this.options;
    const show = options.showLegend && (this.isMulti() || (model.subjects[0] && model.subjects[0].label));
    const copy = chart._copy();
    chart._setLegend(show ? model.subjects.map((subject, index) => {
      const average = this.averageOf(subject);
      return {
        cat: index, colour: chart._colour(index),
        label: subject.label || fill(copy.radarSubjectFallback, { index: index + 1 }),
        value: average == null ? '' : fill(copy.radarAverage, { value: this.scoreText(average) }),
        pressed: !this.hiddenSubjects.has(index),
        onToggle: this.isMulti() ? (event) => {
          if (this.hiddenSubjects.has(index)) this.hiddenSubjects.delete(index);
          else if (this.visibleSubjects().length > 1) this.hiddenSubjects.add(index);
          event.currentTarget.setAttribute('aria-pressed', String(!this.hiddenSubjects.has(index)));
          this.repaint();
          this.syncTable();
        } : null,
      };
    }) : [], true);
  }

  syncTable() {
    const chart = this.chart, model = this.model, formats = chart._formats(), copy = chart._copy();
    const show = this.hasResponses() && (this.options.showTable || (this.geometry && this.geometry.mode === 'number'));
    this.table.hidden = !show;
    this.table.replaceChildren();
    this.table.classList.toggle('is-narrow', chart._root.clientWidth < 640);
    if (!show) return;
    const visible = this.visibleSubjects();
    model.dimensions.forEach((dimension, index) => {
      const row = create('div', 'rd-row', this.table);
      row.dataset.axis = String(index);
      create('span', 'rd-number', row).textContent = formats.count.format(index + 1);
      create('span', 'rd-row-label', row).textContent = dimension;
      const values = create('span', 'rd-row-values', row);
      for (const subjectIndex of visible) {
        const subject = model.subjects[subjectIndex], cell = create('span', null, values);
        if (this.isMulti()) create('span', 'swatch', cell).style.setProperty('--_c', chart._colour(subjectIndex));
        if (subject.responses[index] > 0) {
          create('b', null, cell).textContent = this.scoreText(subject.scores[index]);
          create('i', null, cell).textContent = chart._plural('submissions', subject.responses[index]);
        } else create('i', null, cell).textContent = copy.radarNoResponses;
      }
    });
  }

  syncMeta() {
    const chart = this.chart, copy = chart._copy(), model = this.model;
    const scale = this.scaleText(model.scale);
    this.meta.textContent = this.hasResponses() ? fill(copy.radarMeta, { people: chart._plural('people', model.people), scale }) : fill(copy.radarScale, { scale });
  }

  describe(copy, formats) {
    const model = this.model, chart = this.chart, typeName = copy.typeNames.radar;
    let summary;
    if (!model.subjects.some(subject => subject.responses.some(count => count > 0))) summary = fill(copy.emptySummary, { type: typeName });
    else {
      summary = fill(copy.radarSummary, { type: typeName, items: formats.count.format(model.dimensions.length), responses: chart._plural('people', model.people) });
      summary += ' ' + model.subjects.map((subject, index) => {
        const average = this.averageOf(subject);
        return average == null ? '' : fill(copy.radarSubject, { label: subject.label || fill(copy.radarSubjectFallback, { index: index + 1 }), value: this.scoreText(average) });
      }).filter(Boolean).join(' ');
    }
    return {
      summary,
      head: [copy.item, ...model.subjects.map((subject, index) => subject.label || (model.subjects.length > 1 ? fill(copy.radarSubjectFallback, { index: index + 1 }) : copy.average))],
      rows: model.dimensions.map((dimension, index) => [dimension, ...model.subjects.map(subject => (subject.responses[index] > 0 ? this.scoreText(subject.scores[index]) : '—'))]),
    };
  }
}

const CLOUD_CELL = 4;
const CLOUD_MIN_FONT = 16;
const CLOUD_BOLD_FROM = 0.45;
const CLOUD_FONT_SCALES = { sqrt: Math.sqrt, linear: (value) => value, log: (value) => Math.log(value + 1) };

const CLOUD_SHAPES = {
  ellipse: { draw(context, width, height) { context.beginPath(); context.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, 2 * Math.PI); context.fill(); } },
  cloud: {
    box: [200, 112],
    draw(context) {
      for (const [x, y, radius] of [[52, 70, 40], [96, 46, 46], [146, 50, 38], [168, 78, 30], [104, 80, 32]]) { context.beginPath(); context.arc(x, y, radius, 0, 2 * Math.PI); context.fill(); }
      context.fillRect(52, 70, 116, 38);
    },
  },
  bubble: {
    box: [160, 112],
    draw(context) {
      context.beginPath(); context.roundRect(0, 0, 160, 88, 22); context.fill();
      context.beginPath(); context.moveTo(34, 80); context.lineTo(26, 112); context.lineTo(66, 84); context.closePath(); context.fill();
    },
  },
  heart: {
    box: [100, 90],
    draw(context) { context.fill(new Path2D('M50 88C20 64 0 46 0 26 0 10 12 0 27 0c11 0 19 6 23 14C54 6 62 0 73 0c15 0 27 10 27 26 0 20-20 38-50 62z')); },
  },
  image: {
    box: [100, 130],
    draw(context) {
      context.beginPath(); context.arc(50, 46, 44, 0, 2 * Math.PI); context.fill();
      context.beginPath(); context.moveTo(22, 76); context.lineTo(78, 76); context.lineTo(70, 100); context.lineTo(30, 100); context.closePath(); context.fill();
      context.beginPath(); context.roundRect(30, 102, 40, 9, 4); context.fill();
      context.beginPath(); context.roundRect(33, 114, 34, 9, 4); context.fill();
    },
  },
};

const maskImages = new Map();
const spirals = new Map();

function fitBox(width, height, aspect) {
  const ratio = width / height > aspect ? Math.min(width / height, 1.35 * aspect) : Math.max(width / height, aspect / 1.35);
  const fittedWidth = Math.min(width, height * ratio), fittedHeight = fittedWidth / ratio;
  return { x: (width - fittedWidth) / 2, y: (height - fittedHeight) / 2, width: fittedWidth, height: fittedHeight };
}

// 1 = blocked cell; null means the whole rectangle is free
function shapeMask(shape, columns, rows, image) {
  if (shape === 'rect') return null;
  const isImage = shape === 'custom';
  const drawing = CLOUD_SHAPES[shape];
  if (isImage && !(image && image.complete && image.naturalWidth)) return null;
  if (!isImage && !drawing) return null;
  const canvas = document.createElement('canvas');
  canvas.width = columns;
  canvas.height = rows;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (isImage) {
    const box = fitBox(columns, rows, image.naturalWidth / image.naturalHeight);
    context.drawImage(image, box.x, box.y, box.width, box.height);
  } else if (drawing.box) {
    const box = fitBox(columns, rows, drawing.box[0] / drawing.box[1]);
    context.translate(box.x, box.y);
    context.scale(box.width / drawing.box[0], box.height / drawing.box[1]);
    drawing.draw(context);
  } else drawing.draw(context, columns, rows);
  let pixels;
  try { pixels = context.getImageData(0, 0, columns, rows).data; } catch { return null; }
  const blocked = new Uint8Array(columns * rows);
  for (let cell = 0; cell < blocked.length; cell++) {
    const lightness = (0.299 * pixels[4 * cell] + 0.587 * pixels[4 * cell + 1] + 0.114 * pixels[4 * cell + 2]) / 255;
    blocked[cell] = pixels[4 * cell + 3] > 128 && (!isImage || lightness < 0.9) ? 0 : 1;
  }
  return blocked;
}

// outermost cells first, so a collision is found early
function footprint(width, height, degrees) {
  const halfWidth = width / 2 + 3, halfHeight = height / 2 + 3, radians = degrees * Math.PI / 180;
  const cos = Math.cos(radians), sin = Math.sin(radians);
  const reachX = Math.ceil((Math.abs(halfWidth * cos) + Math.abs(halfHeight * sin)) / CLOUD_CELL);
  const reachY = Math.ceil((Math.abs(halfWidth * sin) + Math.abs(halfHeight * cos)) / CLOUD_CELL);
  const cells = [];
  for (let row = -reachY; row <= reachY; row++) for (let column = -reachX; column <= reachX; column++) {
    const x = column * CLOUD_CELL, y = row * CLOUD_CELL;
    if (Math.abs(x * cos + y * sin) <= halfWidth + 2 && Math.abs(-x * sin + y * cos) <= halfHeight + 2) cells.push([column, row]);
  }
  const distance = cell => Math.abs(cell[0]) / (reachX || 1) + Math.abs(cell[1]) / (reachY || 1);
  cells.sort((a, b) => distance(b) - distance(a));
  return { cells: Int16Array.from(cells.flat()), reachX, reachY };
}

function spiral(columns, rows) {
  const key = `${columns}x${rows}`;
  if (spirals.has(key)) return spirals.get(key);
  const stretchX = Math.sqrt(columns / rows), stretchY = 1 / stretchX, limit = Math.hypot(columns, rows) / Math.min(stretchX, stretchY);
  const offsets = [], seen = new Set();
  for (let angle = 0; ;) {
    const radius = angle / Math.PI;
    if (radius > limit) break;
    const x = Math.round(radius * Math.cos(angle) * stretchX), y = Math.round(radius * Math.sin(angle) * stretchY);
    if (!seen.has(1e5 * x + y)) { seen.add(1e5 * x + y); offsets.push(x, y); }
    angle += Math.min(0.5, 1 / Math.max(radius, 1));
  }
  const result = Int16Array.from(offsets);
  spirals.set(key, result);
  return result;
}

function placeOnGrid(grid, columns, rows, shape, startX, startY) {
  const { cells, reachX, reachY } = shape, path = spiral(columns, rows);
  const originX = Math.round(startX / CLOUD_CELL), originY = Math.round(startY / CLOUD_CELL);
  for (let index = 0; index < path.length; index += 2) {
    const x = originX + path[index], y = originY + path[index + 1];
    if (x - reachX < 0 || y - reachY < 0 || x + reachX >= columns || y + reachY >= rows) continue;
    let free = true;
    for (let cell = 0; cell < cells.length; cell += 2) if (grid[(y + cells[cell + 1]) * columns + x + cells[cell]]) { free = false; break; }
    if (!free) continue;
    for (let cell = 0; cell < cells.length; cell += 2) grid[(y + cells[cell + 1]) * columns + x + cells[cell]] = 1;
    return { x: x * CLOUD_CELL, y: y * CLOUD_CELL };
  }
  return null;
}

function normaliseWord(text, foldDiacritics) {
  let key = text.toLocaleLowerCase();
  if (foldDiacritics) key = key.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
  return key.normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, '');
}

class WordcloudRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'wordcloud');
    this.stage = create('div', 'cloud', this.plot);
    this.stage.setAttribute('role', 'list');
    this.stage.tabIndex = -1;
    this.note = create('p', 'cloud-note', this.stage);
    this.note.hidden = true;
    this.moderation = create('div', 'moderation', chart._footer);
    this.moderation.setAttribute('role', 'status');
    this.moderation.hidden = true;
    this.words = new Map();
    this.hidden = [];
    this.pointerType = 'mouse';
    this.armed = null;
    this.onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && this.hidden.length) { event.preventDefault(); this.restore(this.hidden[this.hidden.length - 1].key); }
    };
    chart._root.addEventListener('keydown', this.onKey);
  }

  destroy() {
    super.destroy();
    this.chart._root.removeEventListener('keydown', this.onKey);
    this.stage.remove();
    this.moderation.remove();
  }

  get options() { return this.chart._optionsFor('wordcloud'); }

  entries() {
    const data = this.chart.data;
    const list = Array.isArray(data) ? data : isObject(data) ? (Array.isArray(data.words) ? data.words : Array.isArray(data.responses) ? data.responses : []) : [];
    const options = this.options, groups = new Map();
    for (const entry of list) {
      const isEntry = isObject(entry);
      const raw = isEntry ? (entry.label ?? entry.text) : entry;
      const value = isEntry ? toNumber(entry.value) : 1;
      const text = String(raw ?? '').normalize('NFC').replace(/\s+/g, ' ').trim();
      if (!text || !(value > 0)) continue;
      const key = (options.group && normaliseWord(text, options.foldDiacritics)) || text;
      let group = groups.get(key);
      if (!group) { group = { key, value: 0, variants: new Map(), order: groups.size }; groups.set(key, group); }
      group.value += value;
      group.variants.set(text, (group.variants.get(text) || 0) + value);
    }
    return [...groups.values()].map(group => {
      const variants = [...group.variants.entries()].sort((a, b) => b[1] - a[1]);
      return { key: group.key, text: variants[0][0], value: group.value, variants, order: group.order };
    }).sort((a, b) => b.value - a.value || a.order - b.order);
  }

  maskImage() {
    const options = this.options;
    const source = options.shape === 'custom' ? options.maskSrc : null;
    if (!source) return null;
    let image = maskImages.get(source);
    if (!image) { image = new Image(); image.decoding = 'async'; image.crossOrigin = 'anonymous'; image.src = source; maskImages.set(source, image); }
    if (!(image.complete && image.naturalWidth) && this.waitingFor !== image) {
      this.waitingFor = image;
      image.addEventListener('load', () => { if (this.chart._renderer === this && this.chart.isConnected) this.draw('update'); }, { once: true });
    }
    return image;
  }

  colourFor(word) {
    const colour = this.options.colour;
    if (colour === 'ink') return word.fraction >= CLOUD_BOLD_FROM ? 'var(--_ink)' : 'var(--_ink-2)';
    if (colour === 'accent') return word.rank < 3 ? 'var(--_s1)' : word.fraction >= CLOUD_BOLD_FROM ? 'var(--_ink)' : 'var(--_ink-2)';
    return word.size >= 24 ? this.chart._colour(word.hash % this.chart._seriesCount) : 'var(--_ink-2)';
  }

  fitText(text, size, weight, maxWidth, extra) {
    const family = this.family;
    const measure = (value, fontSize) => textWidth(value, fontSize, weight, family);
    const wrap = (fontSize, width) => {
      const lines = [];
      let line = '';
      for (const word of text.split(' ')) {
        const candidate = line ? `${line} ${word}` : word;
        if (!line || measure(candidate, fontSize) <= width) line = candidate; else { lines.push(line); line = word; }
      }
      if (line) lines.push(line);
      return lines;
    };
    const truncate = (value, fontSize, width) => {
      if (measure(value, fontSize) <= width) return value;
      let cut = value;
      while (cut.length > 1 && measure(cut + '…', fontSize) > width) cut = cut.slice(0, -1);
      return cut.trimEnd() + '…';
    };
    for (let fontSize = size; ;) {
      const single = measure(text, fontSize) + extra;
      if (single <= maxWidth) return { size: fontSize, lines: [text] };
      let lines = wrap(fontSize, maxWidth - extra);
      if (lines.length > 1 && lines.length <= 3) { const balanced = wrap(fontSize, single / lines.length * 1.12); if (balanced.length === lines.length) lines = balanced; }
      if (lines.length <= 3 && lines.every(line => measure(line, fontSize) <= maxWidth - extra)) return { size: fontSize, lines };
      if (fontSize > CLOUD_MIN_FONT) { fontSize = Math.max(CLOUD_MIN_FONT, Math.floor(fontSize * 0.86)); continue; }
      const kept = lines.slice(0, 3).map(line => truncate(line, fontSize, maxWidth - extra));
      if (lines.length > 3) kept[2] = truncate(kept[2] + '…', fontSize, maxWidth - extra);
      return { size: fontSize, lines: kept };
    }
  }

  layoutWords(words, width, height, blocked, previous) {
    const options = this.options, formats = this.chart._formats();
    const columns = Math.ceil(width / CLOUD_CELL), rows = Math.ceil(height / CLOUD_CELL);
    const freeCells = blocked ? blocked.reduce((count, cell) => count + (cell ? 0 : 1), 0) : columns * rows;
    const capacity = Math.max(12, Math.floor(freeCells * CLOUD_CELL * CLOUD_CELL / 2600));
    const list = words.slice(0, Math.min(options.maxWords, capacity));
    if (!list.length) return [];
    const scaleOf = CLOUD_FONT_SCALES[options.fontScale] || Math.sqrt;
    const top = scaleOf(list[0].value), bottom = scaleOf(list[list.length - 1].value);
    const freeShare = freeCells / (columns * rows);
    let widestRun = width;
    if (blocked) {
      let best = 0;
      for (let row = 0; row < rows; row++) { let run = 0; for (let column = 0; column < columns; column++) { run = blocked[row * columns + column] ? 0 : run + 1; if (run > best) best = run; } }
      widestRun = best * CLOUD_CELL;
    }
    let largest = clamp(Math.sqrt(width * height * freeShare) / (width < 480 ? 6.5 : 5.2) * (list.length < 12 ? 1.15 : 1), 26, 96);
    const smallestLargest = Math.max(24, 0.5 * largest);
    let result = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      const grid = blocked ? blocked.slice() : new Uint8Array(columns * rows);
      const failed = [];
      result = list.map((word, rank) => {
        const fraction = top === bottom ? 0.6 : (scaleOf(word.value) - bottom) / (top - bottom);
        const weight = fraction >= CLOUD_BOLD_FROM ? 600 : 400;
        const hash = stableHash(word.key);
        const countText = options.showCounts && fraction >= CLOUD_BOLD_FROM ? formats.count.format(word.value) : '';
        const countWidth = countText ? textWidth(countText, CLOUD_MIN_FONT, 400, this.family) + 8 : 0;
        const baseSize = Math.round(CLOUD_MIN_FONT + fraction * (largest - CLOUD_MIN_FONT));
        const maxWidth = Math.min(width * (word.text.includes(' ') ? 0.52 : 0.94), 0.92 * widestRun);
        const earlier = previous && previous.get(word.key);
        const tryAt = (size) => {
          const fitted = this.fitText(word.text, size, weight, maxWidth, countWidth);
          const widths = fitted.lines.map(line => textWidth(line, fitted.size, weight, this.family));
          const boxWidth = Math.max(...widths.slice(0, -1), widths[widths.length - 1] + countWidth);
          const boxHeight = fitted.lines.length * fitted.size * 1.15;
          let angle = 0;
          const rotatable = rank >= 3 && fitted.lines.length === 1 && boxWidth < 0.8 * height;
          if (rotatable && options.rotation === 'mixed' && hash % 4 === 0) angle = 90;
          if (rotatable && options.rotation === 'angled') angle = [0, -45, 45][hash % 3];
          const hopeless = failed.some(box => box.angle === angle && boxWidth >= box.width && boxHeight >= box.height);
          const spot = hopeless ? null : placeOnGrid(grid, columns, rows, footprint(boxWidth, boxHeight, angle), earlier ? earlier.x : width / 2, earlier ? earlier.y : height / 2);
          if (!spot) failed.push({ angle, width: boxWidth, height: boxHeight });
          return { fitted, boxWidth, boxHeight, angle, spot };
        };
        let attemptResult = tryAt(baseSize);
        if (!attemptResult.spot && 0.8 * baseSize >= CLOUD_MIN_FONT) attemptResult = tryAt(Math.round(0.8 * baseSize));
        const { fitted, boxWidth, boxHeight, angle, spot } = attemptResult;
        return { key: word.key, word, rank, fraction, weight, hash, size: fitted.size, lines: fitted.lines, countText, angle,
          width: boxWidth, height: boxHeight, placed: !!spot, x: spot ? spot.x : 0, y: spot ? spot.y : 0 };
      });
      if (result.slice(0, 3).every(entry => entry.placed) && result.filter(entry => entry.placed).length / result.length >= 0.8) break;
      largest *= 0.85;
      if (largest < smallestLargest) break;
    }
    return result;
  }

  draw(reason) {
    this.stop();
    const chart = this.chart, options = this.options, copy = chart._copy(), formats = chart._formats(), motion = chart._motion();
    this.interactive = !!options.removable;
    this.family = getComputedStyle(this.stage).fontFamily;
    this.all = this.entries();
    const hiddenKeys = new Set(this.hidden.map(entry => entry.key));
    this.visible = this.all.filter(word => !hiddenKeys.has(word.key));
    const width = Math.max(120, this.stage.clientWidth);
    const height = width < 480 ? Math.round(clamp(1.1 * width, 260, options.height)) : options.height;
    this.stage.style.height = `${height}px`;
    const blocked = shapeMask(options.shape, Math.ceil(width / CLOUD_CELL), Math.ceil(height / CLOUD_CELL), this.maskImage());
    const previous = reason === 'enter' ? null : new Map([...this.words].map(([key, node]) => [key, node._placement]));
    const placements = this.layoutWords(this.visible, width, height, blocked, previous);
    const total = sum(this.visible.map(word => word.value)) || 1;
    const shareText = value => formats.percent.format(value / total);
    const transform = entry => `translate(-50%, -50%) rotate(${entry.angle}deg)`;
    const pending = [], live = new Set();
    for (const entry of placements) {
      if (!entry.placed) continue;
      live.add(entry.key);
      let node = this.words.get(entry.key);
      const isNew = !node;
      if (isNew) { node = this.createWord(); this.words.set(entry.key, node); }
      const before = node._placement;
      node._placement = entry;
      node.textContent = entry.lines.join('\n');
      if (entry.countText) create('span', 'word-count', node).textContent = ` ${entry.countText}`;
      Object.assign(node.style, { fontSize: `${entry.size}px`, fontWeight: String(entry.weight), color: this.colourFor(entry), left: `${entry.x}px`, top: `${entry.y}px` });
      node.dataset.key = entry.key;
      node.dataset.cat = entry.key;
      node.classList.toggle('is-removable', !!options.removable);
      node.tabIndex = options.removable ? 0 : -1;
      node.setAttribute('aria-label', `${entry.word.text}: ${chart._plural('submissions', entry.word.value)}, ${shareText(entry.word.value)}.${options.removable ? ` ${copy.wordcloudHideKey}` : ''}`);
      node._tip = options.showTooltip ? () => ({
        title: entry.word.text,
        lines: [{ text: chart._plural('submissions', entry.word.value), muted: `· ${shareText(entry.word.value)}` },
          ...(entry.word.variants.length > 1 ? [fill(copy.wordcloudMerged, { variants: entry.word.variants.map(([text, count]) => `“${text}” ${formats.count.format(count)}`).join(', ') })] : [])],
        hint: options.removable ? (this.pointerType === 'touch' ? copy.wordcloudHideHintTouch : copy.wordcloudHideHint) : '',
      }) : null;
      const target = transform(entry);
      node.style.transition = 'none';
      if (reason === 'enter' || isNew || !before) {
        const delay = reason === 'enter' ? Math.min(entry.rank, 15) * motion.stagger : 0;
        node.style.opacity = '0';
        node.style.transform = `${target} scale(0.6)`;
        pending.push(() => {
          node.style.transition = `opacity ${motion.enter}ms var(--_ease) ${delay}ms, transform ${motion.enter}ms var(--_ease) ${delay}ms`;
          node.style.opacity = '1';
          node.style.transform = target;
        });
      } else if (reason === 'update') {
        node.style.opacity = '1';
        node.style.transform = `translate(-50%, -50%) translate(${before.x - entry.x}px, ${before.y - entry.y}px) rotate(${before.angle}deg) scale(${before.size / entry.size})`;
        pending.push(() => {
          node.style.transition = `transform ${motion.update}ms var(--_ease), opacity var(--aha-motion-mid,.2s) linear`;
          node.style.transform = target;
        });
      } else { node.style.opacity = '1'; node.style.transform = target; }
    }
    for (const [key, node] of this.words) {
      if (live.has(key)) continue;
      this.words.delete(key);
      node.tabIndex = -1;
      node.style.pointerEvents = 'none';
      node.style.transition = `opacity ${motion.update / 2}ms linear, transform ${motion.update / 2}ms var(--_ease)`;
      node.style.opacity = '0';
      if (node._placement) node.style.transform = `${transform(node._placement)} scale(0.6)`;
      setTimeout(() => node.remove(), motion.update / 2 + 20);
    }
    if (pending.length) { void this.stage.offsetWidth; pending.forEach(apply => apply()); }
    this.note.textContent = copy.wordcloudAllHidden;
    this.note.hidden = !(this.all.length && !this.visible.length);
    this.syncModeration();
    if (!this.words.has(this.armed)) this.armed = null;
  }

  createWord() {
    const node = create('span', 'word', this.stage);
    node.setAttribute('role', 'listitem');
    node.addEventListener('pointerdown', event => { this.pointerType = event.pointerType || 'mouse'; });
    node.addEventListener('click', () => {
      if (!this.options.removable) return;
      const key = node.dataset.key;
      if (this.pointerType === 'touch' && this.armed !== key) {
        this.armed = key;
        if (node._tip && this.chart._tooltipOn) this.chart._showTipOver(node, node._tip);
        return;
      }
      this.hide(key);
    });
    node.addEventListener('keydown', event => {
      if (this.options.removable && ['Delete', 'Backspace', 'Enter'].includes(event.key)) { event.preventDefault(); this.hide(node.dataset.key); }
    });
    return node;
  }

  hide(key) {
    const word = this.visible.find(entry => entry.key === key);
    if (!word) return;
    const node = this.words.get(key);
    const hadFocus = node && this.chart.shadowRoot.activeElement === node;
    const rank = this.visible.indexOf(word);
    this.hidden.push({ key, text: word.text });
    this.armed = null;
    this.chart._hideTip();
    this.draw('update');
    this.chart._describe(this.describe(this.chart._copy(), this.chart._formats()));
    this.chart._emit('wordcloud-hide', { hidden: this.hidden.map(entry => entry.text) });
    if (hadFocus) {
      const next = [...this.words.values()].filter(entry => entry._placement).sort((a, b) => a._placement.rank - b._placement.rank).find(entry => entry._placement.rank >= rank);
      (next || this.stage).focus({ preventScroll: true });
    }
  }

  restore(key) {
    if (key === undefined) this.hidden = [];
    else { const index = this.hidden.map(entry => entry.key).lastIndexOf(key); if (index >= 0) this.hidden.splice(index, 1); }
    this.draw('update');
    this.chart._describe(this.describe(this.chart._copy(), this.chart._formats()));
    this.chart._emit('wordcloud-hide', { hidden: this.hidden.map(entry => entry.text) });
  }

  syncModeration() {
    const chart = this.chart, copy = chart._copy(), formats = chart._formats();
    const hiddenKeys = new Set(this.hidden.map(entry => entry.key));
    const hiddenWords = this.all.filter(word => hiddenKeys.has(word.key));
    this.moderation.replaceChildren();
    this.moderation.hidden = !hiddenWords.length;
    if (!hiddenWords.length) return;
    const last = this.hidden[this.hidden.length - 1];
    create('span', null, this.moderation).textContent = fill(copy.wordcloudHidden, { count: formats.count.format(hiddenWords.length), submissions: chart._plural('submissions', sum(hiddenWords.map(word => word.value))) });
    const undo = create('button', 'button', this.moderation);
    undo.type = 'button';
    undo.textContent = fill(copy.wordcloudUndo, { word: last.text });
    undo.addEventListener('click', () => this.restore(last.key));
    if (hiddenWords.length > 1) {
      const all = create('button', 'button', this.moderation);
      all.type = 'button';
      all.textContent = copy.wordcloudRestoreAll;
      all.addEventListener('click', () => this.restore());
    }
  }

  describe(copy, formats) {
    const chart = this.chart, words = this.visible || [], total = sum(words.map(word => word.value)), typeName = copy.typeNames.wordcloud;
    let summary;
    if (!words.length) summary = fill(copy.emptySummary, { type: typeName });
    else {
      summary = fill(copy.wordcloudSummary, { type: typeName, items: formats.count.format(words.length), responses: chart._responsesText(total) });
      summary += ' ' + fill(copy.wordcloudLeader, { label: words[0].text, value: formats.count.format(words[0].value) });
    }
    return { summary, head: [copy.word, copy.count], rows: words.map(word => [word.text, formats.count.format(word.value)]) };
  }
}

const MINDMAP_WIDE_FROM = 640;
const MINDMAP_BRANCH_GAP = 18;
const MINDMAP_IDEA_GAP = 6;
const MINDMAP_ADD_ROOM = 34;
const MINDMAP_OUTLINE_INDENT = 24;
const MINDMAP_PRESETS = [
  { widths: { 1: 200, 2: 190, 3: 180, 4: 170, 5: 170 }, gaps: { 1: 44, 2: 32, 3: 32, 4: 32 } },
  { widths: { 1: 170, 2: 160, 3: 150, 4: 140, 5: 140 }, gaps: { 1: 44, 2: 32, 3: 32, 4: 32 } },
  { widths: { 1: 150, 2: 140, 3: 124, 4: 116, 5: 116 }, gaps: { 1: 26, 2: 26, 3: 26, 4: 26 } },
  { widths: { 1: 132, 2: 124, 3: 108, 4: 100, 5: 100 }, gaps: { 1: 26, 2: 26, 3: 26, 4: 26 } },
  { widths: { 1: 120, 2: 112, 3: 100, 4: 92, 5: 92 }, gaps: { 1: 26, 2: 26, 3: 26, 4: 26 } },
  { widths: { 1: 112, 2: 104, 3: 92, 4: 86, 5: 86 }, gaps: { 1: 26, 2: 26, 3: 26, 4: 26 } },
  { widths: { 1: 104, 2: 96, 3: 86, 4: 80, 5: 80 }, gaps: { 1: 26, 2: 26, 3: 26, 4: 26 } },
];
const MINDMAP_LINK_WIDTHS = { 2: 2.5, 3: 1.5, 4: 1, 5: 1 };

class MindmapRenderer extends Renderer {
  constructor(chart) {
    super(chart, 'mindmap');
    this.interactive = true;
    this.stage = create('div', 'mindmap', this.plot);
    this.links = createSvg('svg', { class: 'mindmap-links', 'aria-hidden': 'true' }, this.stage); // ds-lint-allow: svg (connector geometry drawn from data, not an icon glyph)
    this.nodeLayer = create('div', null, this.stage);
    this.views = new Map();
    this.collapsed = new Set();
    this.expanded = new Set();
    this.addingTo = null;
    this.renaming = null;
    this.focusAfter = null;
  }

  destroy() { super.destroy(); this.stage.remove(); }

  get options() { return this.chart._optionsFor('mindmap'); }

  // ids follow the label path, so a live addition keeps every other node in place
  readTree() {
    const data = isObject(this.chart.data) ? this.chart.data : {};
    const options = this.options;
    this.nodes = new Map();
    const root = { id: 'root', text: String(data.label ?? data.root ?? ''), depth: 1, cat: null, parent: null, children: [] };
    this.nodes.set('root', root);
    const add = (parent, raw) => {
      const text = String(typeof raw === 'object' && raw ? (raw.label ?? raw.text ?? '') : raw ?? '');
      let id = `${parent.id}/${text}`, repeat = 1;
      while (this.nodes.has(id)) id = `${parent.id}/${text}#${++repeat}`;
      const node = { id, text, parent, depth: parent.depth + 1, children: [] };
      node.cat = node.depth === 2 ? parent.children.length : parent.cat;
      parent.children.push(node);
      this.nodes.set(id, node);
      const children = typeof raw === 'object' && raw ? [raw.children, raw.ideas].find(Array.isArray) || [] : [];
      if (node.depth < options.maxDepth) children.forEach(child => add(node, child));
      return node;
    };
    ([data.children, data.branches].find(Array.isArray) || []).slice(0, options.maxBranches).forEach(branch => add(root, branch));
    this.root = root;
  }

  canAdd(node) { return this.options.editable && node.depth < this.options.maxDepth && !(node.depth === 1 && node.children.length >= this.options.maxBranches); }

  addIdea(parent, text) {
    const value = String(text || '').trim();
    if (!value || !this.canAdd(parent)) return null;
    let id = `${parent.id}/${value}`, repeat = 1;
    while (this.nodes.has(id)) id = `${parent.id}/${value}#${++repeat}`;
    const node = { id, text: value, parent, depth: parent.depth + 1, children: [] };
    node.cat = node.depth === 2 ? parent.children.length : parent.cat;
    parent.children.push(node);
    this.nodes.set(id, node);
    if (parent.depth > 1 && parent.children.length > this.options.pageSize) this.expanded.add(parent.id);
    return node;
  }

  treeData(node = this.root) {
    const entry = { label: node.text };
    if (node.children.length) entry.children = node.children.map(child => this.treeData(child));
    return entry;
  }

  changed() { this.chart._emit('mindmap-change', { tree: this.treeData() }); this.chart._describe(this.describe(this.chart._copy(), this.chart._formats())); }

  visibleTree() {
    const pageSize = this.options.pageSize;
    const walk = (node) => {
      const entry = { id: node.id, kind: 'node', node, depth: node.depth, cat: node.cat, children: [] };
      if (node.depth === 1 || !this.collapsed.has(node.id)) {
        const limit = node.depth === 1 || this.expanded.has(node.id) ? Infinity : pageSize;
        node.children.slice(0, limit).forEach(child => entry.children.push(walk(child)));
        if (node.children.length > limit) entry.children.push({ id: `${node.id}:more`, kind: 'more', owner: node, depth: node.depth + 1, cat: node.cat, children: [], hidden: node.children.length - limit });
      }
      if (this.addingTo === node.id) entry.children.push({ id: `${node.id}:editor`, kind: 'editor', owner: node, depth: node.depth + 1, cat: node.depth === 1 ? node.children.length : node.cat, children: [] });
      return entry;
    };
    return walk(this.root);
  }

  flatten(entry, list = []) { list.push(entry); entry.children.forEach(child => this.flatten(child, list)); return list; }

  viewFor(entry) {
    let view = this.views.get(entry.id);
    if (view) return view;
    const chart = this.chart;
    if (entry.kind === 'more') {
      const button = create('button', 'node node-more', this.nodeLayer);
      button.type = 'button';
      button.addEventListener('click', () => { this.expanded.add(entry.owner.id); this.draw('reorder'); });
      view = { element: button, text: button };
    } else if (entry.kind === 'editor') {
      const element = create('div', 'node node-editor', this.nodeLayer);
      const input = create('input', null, element);
      input.type = 'text';
      input.maxLength = 80;
      input.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Enter') { event.preventDefault(); this.commitAdd(input.value); }
        if (event.key === 'Escape') { event.preventDefault(); this.cancelAdd(); }
      });
      input.addEventListener('blur', () => setTimeout(() => {
        if (this.addingTo === entry.owner.id && this.views.get(entry.id)?.input === input) { if (input.value.trim()) this.commitAdd(input.value); else this.cancelAdd(false); }
      }, 0));
      view = { element, input };
    } else {
      const id = entry.id, depth = entry.node.depth, current = () => this.nodes.get(id);
      const element = create('div', `node node-${Math.min(depth, 5)}`, this.nodeLayer);
      element.tabIndex = 0;
      view = { element, text: create('span', 'node-text', element) };
      if (depth > 1) {
        view.toggle = create('button', 'node-toggle', element);
        view.toggle.type = 'button';
        view.toggle.addEventListener('click', () => {
          if (this.collapsed.has(id)) this.collapsed.delete(id); else this.collapsed.add(id);
          this.draw('reorder');
        });
      }
      if (depth < this.options.maxDepth) {
        view.add = create('button', 'node-add', element);
        view.add.type = 'button';
        icon('system-plus', 14, view.add);
        view.add.addEventListener('click', event => { event.stopPropagation(); if (current()) this.startAdd(current()); });
      }
      element.addEventListener('dblclick', event => { if (this.options.editable && current() && (event.target === element || event.target === view.text)) this.startRename(current()); });
      element.addEventListener('keydown', event => {
        const node = current();
        if (event.target !== element || !this.options.editable || !node) return;
        if (event.key === 'Enter' || event.key === 'F2') { event.preventDefault(); this.startRename(node); }
        if ((event.key === '+' || event.key === 'Insert') && this.canAdd(node)) { event.preventDefault(); this.startAdd(node); }
      });
    }
    this.views.set(entry.id, view);
    return view;
  }

  syncView(entry, view) {
    const chart = this.chart, copy = chart._copy(), formats = chart._formats();
    if (entry.cat != null) view.element.dataset.cat = String(entry.cat);
    else delete view.element.dataset.cat;
    if (entry.kind === 'node' && entry.depth === 2) view.element.style.setProperty('--_tint', chart._tint(entry.cat));
    if (entry.kind === 'more') { view.element.textContent = fill(copy.mindmapMore, { count: formats.count.format(entry.hidden) }); return; }
    if (entry.kind === 'editor') {
      view.input.placeholder = copy.mindmapNewIdea;
      view.input.setAttribute('aria-label', fill(copy.mindmapAdd, { label: entry.owner.text }));
      return;
    }
    const node = entry.node, editable = this.options.editable;
    view.text.textContent = node.text;
    view.text.hidden = this.renaming === node.id;
    if (this.renaming === node.id && !view.rename) {
      view.rename = create('input');
      view.element.insertBefore(view.rename, view.text);
      view.rename.value = node.text;
      view.rename.maxLength = 80;
      view.rename.setAttribute('aria-label', fill(copy.mindmapEdit, { label: node.text }));
      view.rename.addEventListener('keydown', event => {
        event.stopPropagation();
        if (event.key === 'Enter') { event.preventDefault(); this.commitRename(view.rename.value); }
        if (event.key === 'Escape') { event.preventDefault(); this.commitRename(null); }
      });
      view.rename.addEventListener('blur', () => setTimeout(() => { if (this.renaming === node.id) this.commitRename(view.rename.value.trim() ? view.rename.value : null); }, 0));
    }
    if (this.renaming !== node.id && view.rename) { view.rename.remove(); view.rename = null; }
    view.element.title = editable ? copy.mindmapEditHint : '';
    view.element.setAttribute('aria-label', fill(copy.mindmapLevel, { depth: formats.count.format(node.depth), label: node.text })
      + (node.children.length ? `, ${fill(copy.mindmapChildren, { count: formats.count.format(node.children.length) })}` : ''));
    if (view.toggle) {
      const isCollapsed = this.collapsed.has(node.id);
      view.toggle.hidden = !node.children.length;
      view.toggle.replaceChildren();
      if (isCollapsed) view.toggle.textContent = formats.count.format(node.children.length);
      else icon('system-minus', 14, view.toggle);
      view.toggle.setAttribute('aria-label', isCollapsed ? fill(copy.mindmapExpand, { count: formats.count.format(node.children.length), label: node.text }) : fill(copy.mindmapCollapse, { label: node.text }));
      view.toggle.setAttribute('aria-expanded', String(!isCollapsed));
    }
    if (view.add) {
      view.add.hidden = !editable;
      const allowed = this.canAdd(node);
      view.add.disabled = !allowed;
      const label = allowed ? (node.depth === 1 ? copy.mindmapAddBranch : fill(copy.mindmapAdd, { label: node.text })) : fill(copy.mindmapMaxBranches, { count: formats.count.format(this.options.maxBranches) });
      view.add.title = label;
      view.add.setAttribute('aria-label', label);
    }
  }

  draw(reason) {
    if (reason !== 'reorder' && reason !== 'resize') {
      const signature = JSON.stringify(this.chart.data) + JSON.stringify(this.options);
      if (signature !== this.signature || reason === 'enter') {
        this.signature = signature;
        this.readTree();
        this.renaming = this.addingTo = null;
      }
    }
    this.stop();
    const chart = this.chart;
    const tree = this.visibleTree(), list = this.flatten(tree), ids = new Set(list.map(entry => entry.id));
    for (const [id, view] of this.views) if (!ids.has(id)) { view.element.remove(); this.views.delete(id); }
    list.forEach(entry => this.syncView(entry, this.viewFor(entry)));
    list.forEach(entry => this.nodeLayer.appendChild(this.views.get(entry.id).element));
    const { targets, height } = this.layout(tree, list);
    list.forEach(entry => this.views.get(entry.id).element.classList.toggle('is-left', targets.get(entry.id).side === -1));
    this.stage.style.height = `${height}px`;
    this.links.setAttribute('width', String(this.stage.clientWidth));
    this.links.setAttribute('height', String(height));
    const motion = chart._motion(), rootTarget = targets.get('root');
    const plans = new Map();
    list.forEach((entry, index) => {
      const view = this.views.get(entry.id);
      let from = view.position && reason !== 'enter' ? { ...view.position, opacity: 1 } : null;
      const isNew = !from;
      if (isNew) {
        const parentId = entry.depth === 1 ? null : entry.kind === 'node' ? entry.node.parent.id : entry.owner.id;
        const origin = reason === 'enter' ? rootTarget : (this.views.get(parentId)?.position || targets.get(parentId) || rootTarget);
        from = { x: origin.x, y: origin.y, opacity: 0 };
      }
      plans.set(entry.id, { ...from, delay: reason === 'enter' ? index * motion.stagger : 0, duration: reason === 'resize' ? 0 : isNew ? motion.enter : motion.reorder });
    });
    const total = Math.max(0, ...[...plans.values()].map(plan => plan.delay + plan.duration));
    this.animate(total, elapsed => {
      const frames = new Map();
      list.forEach(entry => {
        const plan = plans.get(entry.id), target = targets.get(entry.id), view = this.views.get(entry.id);
        const step = progressAt(elapsed, plan.delay, plan.duration);
        const current = { x: lerp(plan.x, target.x, step), y: lerp(plan.y, target.y, step), side: target.side, opacity: lerp(plan.opacity, 1, step) };
        frames.set(entry.id, current);
        view.element.style.transform = `translate(${current.x}px, ${current.y}px)`;
        view.element.style.opacity = String(current.opacity);
        if (step >= 1) view.position = { x: target.x, y: target.y };
      });
      this.drawLinks(list, frames);
    });
    if (this.focusAfter && this.views.get(this.focusAfter)) { this.views.get(this.focusAfter).element.focus({ preventScroll: true }); this.focusAfter = null; }
    chart._applyHighlight();
  }

  layout(tree, list) {
    const width = this.stage.clientWidth || this.plot.clientWidth || 600, maxDepth = this.options.maxDepth;
    const views = this.views;
    const blockOf = (entry) => {
      if (entry.block != null) return entry.block;
      const children = entry.children;
      const stacked = children.length ? sum(children.map(blockOf)) + (children.length - 1) * (children[0].depth === 2 ? MINDMAP_BRANCH_GAP : MINDMAP_IDEA_GAP) : 0;
      entry.block = Math.max(entry.h, stacked);
      return entry.block;
    };
    const setWidths = (entries, widthOf) => {
      entries.forEach(entry => { views.get(entry.id).element.style.maxWidth = `${widthOf(entry)}px`; });
      entries.forEach(entry => { const element = views.get(entry.id).element; entry.w = element.offsetWidth; entry.h = element.offsetHeight; entry.block = null; });
    };
    const columnWidths = (entries) => { const widths = {}; entries.forEach(entry => { widths[entry.depth] = Math.max(widths[entry.depth] || 0, entry.w); }); return widths; };
    const targets = new Map();
    let gaps = MINDMAP_PRESETS[0].gaps;
    const descendants = (branches) => branches.flatMap(branch => this.flatten(branch));
    const sideWidth = (branches) => {
      const widths = columnWidths(descendants(branches));
      let total = 0, depth = 2;
      for (; widths[depth] != null; depth++) total += gaps[depth - 1] + widths[depth];
      return total ? total + (depth - 1 < maxDepth ? MINDMAP_ADD_ROOM : 0) : 0;
    };
    const sideHeight = (branches) => (branches.length ? sum(branches.map(blockOf)) + MINDMAP_BRANCH_GAP * (branches.length - 1) : 0);
    const placeSide = (branches, direction, startX, totalHeight) => {
      const widths = columnWidths(descendants(branches)), columnX = {};
      let x = startX;
      for (let depth = 2; widths[depth] != null; depth++) { x += direction * gaps[depth - 1]; columnX[depth] = x; x += direction * widths[depth]; }
      const place = (entry, top) => {
        const block = blockOf(entry);
        targets.set(entry.id, { x: direction > 0 ? columnX[entry.depth] : columnX[entry.depth] - entry.w, y: top + block / 2 - entry.h / 2, side: direction });
        const children = entry.children;
        const stacked = children.length ? sum(children.map(blockOf)) + (children.length - 1) * (children[0].depth === 2 ? MINDMAP_BRANCH_GAP : MINDMAP_IDEA_GAP) : 0;
        let childTop = top + (block - stacked) / 2;
        children.forEach(child => { place(child, childTop); childTop += blockOf(child) + (child.depth === 2 ? MINDMAP_BRANCH_GAP : MINDMAP_IDEA_GAP); });
      };
      let top = (totalHeight - sideHeight(branches)) / 2;
      branches.forEach(branch => { place(branch, top); top += blockOf(branch) + MINDMAP_BRANCH_GAP; });
    };
    const applyPreset = (branches, preset) => { gaps = preset.gaps; setWidths(descendants(branches), entry => preset.widths[entry.depth] || 100); return preset; };
    const fitPreset = (branches, room) => {
      for (const preset of MINDMAP_PRESETS) { applyPreset(branches, preset); if (sideWidth(branches) <= room) return preset; }
      return null;
    };
    const mix = (from, to, amount) => { const result = {}; for (const key in from) result[key] = Math.round(lerp(from[key], to[key], amount)); return result; };
    const refine = (branches, room, preset) => {
      const wider = MINDMAP_PRESETS[MINDMAP_PRESETS.indexOf(preset) - 1];
      if (!wider || !branches.length) return applyPreset(branches, preset);
      let low = 0, high = 1, best = preset;
      for (let step = 0; step < 5; step++) {
        const middle = (low + high) / 2, candidate = { widths: mix(preset.widths, wider.widths, middle), gaps: mix(preset.gaps, wider.gaps, middle) };
        applyPreset(branches, candidate);
        if (sideWidth(branches) <= room) { low = middle; best = candidate; } else high = middle;
      }
      return applyPreset(branches, best);
    };
    const branches = tree.children;
    if (width >= MINDMAP_WIDE_FROM) {
      for (const rootWidth of new Set(MINDMAP_PRESETS.map(preset => preset.widths[1]))) {
        setWidths([tree], () => rootWidth);
        const room = width / 2 - tree.w / 2;
        let best = null;
        for (let split = 1; split <= Math.max(1, branches.length - 1); split++) {
          const sides = [branches.slice(0, split), branches.slice(split)];
          const presets = sides.map(side => fitPreset(side, room));
          if (presets.includes(null)) continue;
          const height = Math.max(...sides.map(sideHeight));
          if (!best || height < best.height - 0.5) best = { sides, presets, height };
        }
        if (!best) continue;
        best.presets = best.sides.map((side, index) => refine(side, room, best.presets[index]));
        const centreX = width / 2, height = Math.max(tree.h, ...best.sides.map(sideHeight)) + 16;
        targets.set('root', { x: centreX - tree.w / 2, y: height / 2 - tree.h / 2, side: 0 });
        best.sides.forEach((side, index) => {
          const direction = index === 0 ? 1 : -1;
          gaps = best.presets[index].gaps;
          placeSide(side, direction, centreX + direction * tree.w / 2, height);
        });
        return { targets, height };
      }
      for (const preset of MINDMAP_PRESETS) {
        applyPreset([tree], preset);
        const total = tree.w + MINDMAP_ADD_ROOM + sideWidth(branches);
        if (total > width) continue;
        const height = Math.max(tree.h, sideHeight(branches)) + 16, left = Math.max(0, (width - total) / 2);
        targets.set('root', { x: left, y: height / 2 - tree.h / 2, side: 0 });
        placeSide(branches, 1, left + tree.w, height);
        return { targets, height };
      }
    }
    setWidths(list, entry => Math.max(120, width - MINDMAP_OUTLINE_INDENT * (entry.depth - 1) - MINDMAP_ADD_ROOM));
    let y = 0;
    list.forEach(entry => {
      if (entry.depth === 2 && y > 0) y += 8;
      targets.set(entry.id, { x: MINDMAP_OUTLINE_INDENT * (entry.depth - 1), y, side: 2 });
      y += entry.h + (entry.depth === 1 ? 14 : 4);
    });
    return { targets, height: y };
  }

  drawLinks(list, frames) {
    this.links.replaceChildren();
    const byId = new Map(list.map(entry => [entry.id, entry]));
    list.forEach(entry => {
      if (entry.depth === 1) return;
      const parentId = entry.kind === 'node' ? entry.node.parent.id : entry.owner.id;
      const parent = byId.get(parentId), from = frames.get(parentId), to = frames.get(entry.id);
      if (!parent || !from || !to) return;
      const colour = entry.cat == null ? 'var(--_axis)' : this.chart._colour(entry.cat);
      let d;
      if (to.side === 2) {
        const railX = from.x + 12;
        if (entry.depth === 2) {
          createSvg('path', { d: `M${railX},${from.y + parent.h}V${to.y + entry.h / 2}`, style: 'fill:none;stroke:var(--_axis);stroke-width:2.5' }, this.links);
          d = `M${railX},${to.y + entry.h / 2}H${to.x}`;
        } else d = `M${railX},${from.y + parent.h}V${to.y + entry.h / 2}H${to.x}`;
      } else {
        const direction = to.side, startX = direction > 0 ? from.x + parent.w : from.x, startY = from.y + parent.h / 2;
        const endX = direction > 0 ? to.x : to.x + entry.w, endY = to.y + entry.h / 2, bend = (endX - startX) / 2;
        d = `M${startX},${startY}C${startX + bend},${startY} ${endX - bend},${endY} ${endX},${endY}`;
      }
      createSvg('path', { d, 'data-cat': entry.cat ?? '',
        style: `fill:none;stroke:${colour};stroke-width:${MINDMAP_LINK_WIDTHS[entry.depth] || 1};stroke-linecap:round;opacity:${to.opacity ?? 1}${entry.kind === 'editor' ? ';stroke-dasharray:4 4' : ''}` }, this.links);
    });
  }

  startAdd(node) {
    if (!this.canAdd(node)) return;
    this.addingTo = node.id;
    this.collapsed.delete(node.id);
    this.draw('reorder');
    const editor = this.views.get(`${node.id}:editor`);
    if (editor) editor.input.focus({ preventScroll: true });
  }

  commitAdd(text) {
    const parent = this.nodes.get(this.addingTo);
    this.addingTo = null;
    const added = parent ? this.addIdea(parent, text) : null;
    if (added) this.focusAfter = added.id;
    this.draw('reorder');
    if (added) this.changed();
    else if (parent) this.views.get(parent.id)?.add?.focus({ preventScroll: true });
  }

  cancelAdd(refocus = true) {
    const parent = this.nodes.get(this.addingTo);
    this.addingTo = null;
    this.draw('reorder');
    if (refocus && parent) this.views.get(parent.id)?.add?.focus({ preventScroll: true });
  }

  startRename(node) {
    if (this.addingTo) this.cancelAdd(false);
    this.renaming = node.id;
    this.draw('reorder');
    const input = this.views.get(node.id).rename;
    input.focus({ preventScroll: true });
    input.select();
  }

  commitRename(text) {
    const node = this.nodes.get(this.renaming), view = node && this.views.get(node.id);
    if (!node) return;
    if (text != null && !text.trim()) {
      view.rename.setAttribute('aria-invalid', 'true');
      view.rename.placeholder = this.chart._copy().mindmapNotEmpty;
      return;
    }
    const renamed = text != null && text.trim() !== node.text;
    if (text != null) node.text = text.trim();
    this.renaming = null;
    this.draw('reorder');
    view.element.focus({ preventScroll: true });
    if (renamed) this.changed();
  }

  describe(copy, formats) {
    const count = (node) => node.children.length + sum(node.children.map(count));
    const branches = this.root.children.length;
    return {
      summary: fill(copy.mindmapSummary, { type: copy.typeNames.mindmap, label: this.root.text, branches: formats.count.format(branches), ideas: formats.count.format(count(this.root)) }),
      outline: (function toOutline(node) { return { label: node.text, children: node.children.map(toOutline) }; })(this.root),
    };
  }
}

const RENDERERS = {
  bar: BarRenderer, column: ColumnRenderer, stacked: StackedRenderer, donut: DonutRenderer, radial: RadialRenderer, treemap: TreemapRenderer,
  quadrant: QuadrantRenderer, bell: BellRenderer, radar: RadarRenderer, wordcloud: WordcloudRenderer, mindmap: MindmapRenderer,
};

export function defineAhaChart(tag = 'aha-chart') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaChart);
  return true;
}
if (typeof window !== 'undefined') defineAhaChart();

export default { AhaChart, defineAhaChart, chartStrings, chartOptionDefaults, readableInkOn };
