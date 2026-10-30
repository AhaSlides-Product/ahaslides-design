/*
 * screen-lint rules for colour and icons that never reach the DS tokens or the icon registry:
 * a utility class that paints status in a hue (colour rules 7.1, 7.2), an icon from another icon
 * library, and a third-party logo kept in its brand colours at rest (colour rule 2.6).
 */
export const STATUS_HUE_RULE_GROUPS = {
  'status-hue': ['status-hue-class'],
  'icon-library': ['foreign-icon-library'],
  'brand-logo': ['brand-logo-colour'],
};

const COLOUR_RULES_DOC = 'https://design.ahaslides.io/colour-rules.md';
const ICON_GALLERY = 'https://design.ahaslides.io/icons/index.html';
const LOGO_LIBRARY = 'https://design.ahaslides.io/logo/index.html';
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*(?:\s|\/|$)|<!--(?:(?!-->).)*(?:-->\s*)?$)/;

const UTILITY_PREFIX = '(?:[a-z0-9-]+:)*';
const STATUS_HUE_CLASS = new RegExp(`(?<![\\w$-])${UTILITY_PREFIX}((?:text|bg|border(?:-[trblxy])?|fill|stroke|ring|outline|decoration|divide|caret|accent|placeholder|shadow)-(red|rose|green|emerald|lime|yellow|amber|orange|blue|sky|danger|success|warning)(?:-\\d{1,3})?)(?![\\w-])`, 'g');
const ANSWER_HUES = new Set(['red', 'rose', 'green', 'emerald', 'lime']);
const ANSWER_MARKER = /(?<![a-z])(?:correct|wrong|incorrect|answer|verdict)/i;

const FOREIGN_ICON_TAG = /<(font-awesome-icon|font-awesome-layers|FontAwesomeIcon|fa-icon|v-icon|mat-icon|ion-icon)\b/;
const FOREIGN_ICON_IMPORT = /(?:from\s+|import\s*\(?\s*|require\(\s*)['"](@fortawesome\/[a-z-]+|font-awesome(?:\/[^'"]*)?|react-icons(?:\/[^'"]*)?|@mdi\/[a-z-]+|@heroicons\/[^'"]+|lucide(?:-[a-z]+)?|@phosphor-icons\/[a-z-]+|bootstrap-icons(?:\/[^'"]*)?)['"]/;
const CLASS_VALUE = /(?<![\w-])(?::class|className|class)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
const FOREIGN_ICON_CLASS = /(?<![\w-])(fa[srlbdt]?\s+fa-[a-z0-9-]+|fa-solid\s+fa-[a-z0-9-]+|fa-regular\s+fa-[a-z0-9-]+|zmdi\s+zmdi-[a-z0-9-]+|mdi\s+mdi-[a-z0-9-]+|bi\s+bi-[a-z0-9-]+|glyphicon\s+glyphicon-[a-z0-9-]+|ti-[a-z][a-z0-9-]+|material-icons(?:-[a-z]+)?|material-symbols-[a-z]+)(?![\w-])/;

const FULL_COLOUR_LOGO = /(?<![\w-])icon-maintain-colou?r(?![\w-])|\/logo\/original\/[a-z0-9-]+\.svg/i;
const HOVER_PATTERN = /brand-logo-original/;

export function statusHueFindings(line) {
  if (COMMENT_LINE.test(line)) return [];
  const findings = [];

  const answerContext = ANSWER_MARKER.test(line);
  const hueClasses = [...line.matchAll(STATUS_HUE_CLASS)]
    .filter(([, , hue]) => !(answerContext && ANSWER_HUES.has(hue)))
    .map(([, className]) => className);
  if (hueClasses.length)
    findings.push({ rule: 'status-hue-class', severity: 'hard', message: `${[...new Set(hueClasses)].join(', ')} paints status or emphasis in a hue: red, yellow, green and blue are never used for danger, warning, success or information (colour rules 7.1, 7.2, ${COLOUR_RULES_DOC}). Error text stays the default ink: an input's error is <aha-field-error>, a form or page message is <aha-alert type="error">, both with their DS icon. A correct or wrong answer mark uses the --aha-answer-* tokens (section 11)` });

  const tag = line.match(FOREIGN_ICON_TAG);
  const imported = line.match(FOREIGN_ICON_IMPORT);
  let iconClass = null;
  for (const match of line.matchAll(CLASS_VALUE)) {
    const hit = (match[1] ?? match[2] ?? match[3] ?? '').match(FOREIGN_ICON_CLASS);
    if (hit) { iconClass = hit[1]; break; }
  }
  const foreign = tag ? `<${tag[1]}>` : imported ? `"${imported[1]}"` : iconClass ? `class "${iconClass}"` : '';
  if (foreign)
    findings.push({ rule: 'foreign-icon-library', severity: 'hard', message: `${foreign} is an icon from another icon library: every glyph is <aha-icon name="…"> from the DS icon registry (${ICON_GALLERY}), at 12, 16, 24 or 32 px. A form or field error uses the icon <aha-field-error> or <aha-alert type="error"> already draws` });

  if (FULL_COLOUR_LOGO.test(line) && !HOVER_PATTERN.test(line))
    findings.push({ rule: 'brand-logo-colour', severity: 'hard', message: `a third-party logo in its brand colours at rest: a Google, Microsoft or other tool logo (sign-in and connect buttons included) is one colour, greyscale, at rest and shows its own colours only on hover and keyboard focus (colour rule 2.6, ${COLOUR_RULES_DOC}). Use the greyscale file from the Logo library (${LOGO_LIBRARY}) with its hover pattern; a listing page whose logos are the content justifies it with ds-lint-allow: brand-logo (why)` });

  return findings;
}
