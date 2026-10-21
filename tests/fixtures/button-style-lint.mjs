export const BUTTON_STYLE_RULE_FIXTURES = [
  {
    rule: 'hand-rolled-button', severity: 'hard', surfaces: ['product', 'canvas', 'audience'],
    fail: [
      // A vendored marketing Navigation that drew Log in / Sign up itself, then had a grey hover added on top.
      '<style>\n.aha-header__button{height:40px;padding:0 20px;border:1px solid var(--aha-border);background:var(--aha-white);color:var(--aha-text)}\n.aha-header__button:hover{background:var(--aha-gray-10);border-color:var(--aha-gray-30)}\n</style>',
      '.aha-header__button--primary { background: var(--aha-color-primary); color: var(--aha-text-inverse) }',
      '.aha-header__button--primary:hover { background: var(--aha-gray-80) }',
      '.hero__cta { background: var(--aha-white); color: var(--aha-color-primary) }',
      '.btn-primary{background-color:var(--aha-color-primary)}',
      '.hero__primary-cta { background: var(--aha-white) }',
      '.toolbar button { border: 1px solid var(--aha-border) }',
      '.tile[role=button] { background: var(--aha-gray-10) }',
    ],
    pass: [
      '<aha-button variant="primary" size="lg" href="/signup">Sign up</aha-button>',
      '.aha-header__buttons { display: flex; gap: var(--aha-space-2) }',
      '.aha-header__buttons { background: var(--aha-bg-base) }',
      '.hero__cta-group { background: var(--aha-white) }',
      '.aha-header-section-header-pink-space-between-buttons__title { color: var(--aha-text-inverse) }',
      '.aha-header__button { flex: 1 }',
      '.cta-section h2 { color: var(--aha-text) }',
      '.reset button { background: none; border: 0 }',
      `document.querySelector('.aha-header__button').addEventListener('click', () => { open(); });`,
      '/* .aha-header__button { background: red } */',
      '.legacy__button { background: var(--aha-white) } /* ds-lint-allow: hand-rolled-button (a third-party widget we cannot swap) */',
    ],
  },
  {
    rule: 'restyled-button', severity: 'hard', surfaces: ['product', 'canvas', 'audience'],
    fail: [
      'aha-button:hover { background: var(--aha-gray-10) }',
      '.nav aha-button { border-color: var(--aha-gray-30) }',
      'aha-button::part(button) { height: 44px }',
      '.hero aha-button[variant="primary"] { color: var(--aha-color-primary) }',
    ],
    pass: [
      '.nav aha-button { flex: 1; --aha-button-primary-bg: var(--aha-white); --aha-button-primary-text: var(--aha-color-primary) }',
      '.brand { --aha-button-default-bg-hover: var(--aha-vivid-pink-dark) }',
      '.card-form aha-button { width: 100% }',
      'aha-button { font: inherit }',
      'aha-button:hover { background: var(--aha-gray-10) } /* ds-lint-allow: button-style (a demo of what the rule catches) */',
    ],
  },
];
