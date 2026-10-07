// @ahaslides-product/design/tokens — the canonical design tokens (generated from tokens.canonical.json).
export const tokens = {
  "$about": "R1 — the single canonical token set for the AhaSlides design-system-for-agents. Resolved from two disagreeing sources; see TOKENS.canonical.md for the ledger.",
  "$precedence": "MEASURED component-standard contract.json (what ships) > DS EXPORT (brand/identity/palette, Brian's stated SoT) > aha-design SKILL data (rules/format). Non-canonical skill bolt-ons (Tailwind neutrals, black-alpha text) discarded.",
  "color": {
    "$colourRules": "Colour rules of 7 October 2026 (brand guideline v8) override the DS V3 values below: Vivid Pink #E70E68 is the one primary, Darker Pink #DB005B is hover and press, Vivid Pink at 5% (#FEF3F7 flat) is light hover and selected backgrounds, and status (success, warning, error, info) is black, grey or white with an icon, never red, amber, green or blue. Purple (primitives.purple, brand.1) is the logo only.",
    "$source": "Full color system, transcribed from the DS-EXPORT (palette.css + semantic.css), which is 'verbatim from the Figma DS V3 Variable collections'. Verified 2026-09-08. Two corrections applied per Brian: bgContainerDisabled gray-40→gray-30 (Figma bg-container-disabled); checkboxBorder off-palette #B4BCCF→gray-50 #D4D4D4.",
    "primary": "#E70E68",
    "primaryHover": "#DB005B",
    "primaryActive": "#DB005B",
    "success": "#000000",
    "warning": "#000000",
    "error": "#000000",
    "info": "#000000",
    "textDefault": "#1A1A1A",
    "textSecondary": "#4A4A4A",
    "textTertiary": "#8A8A8A",
    "textPlaceholder": "#999999",
    "textDisabled": "#B5B5B5",
    "textInverse": "#FFFFFF",
    "textLink": "#000000",
    "textLinkHover": "#E70E68",
    "textPrimaryInk": "#3E3E5A",
    "textPositive": "#000000",
    "textNegative": "#000000",
    "textWarning": "#000000",
    "border": "#E3E3E3",
    "borderInput": "#D3D7E1",
    "borderSecondary": "#F1F1F1",
    "borderStrong": "#D4D4D4",
    "borderDisabled": "#EBEBEB",
    "borderHover": "#E70E68",
    "borderActive": "#DB005B",
    "borderError": "#000000",
    "borderSuccess": "#000000",
    "borderWarning": "#000000",
    "borderInfo": "#000000",
    "checkboxBorder": "#D4D4D4",
    "focus": "#E70E68",
    "focusRingSoft": "rgba(231,14,104,.3)",
    "bgBase": "#FFFFFF",
    "bgContainer": "#FFFFFF",
    "bgContainerSecondary": "#F7F7F7",
    "bgContainerDisabled": "#F1F1F1",
    "bgElevated": "#FFFFFF",
    "bgLayout": "#F7F7F7",
    "bgAccent": "#FEF3F7",
    "bgInformative": "#FFFFFF",
    "bgHover": "#F7F7F7",
    "bgPositive": "#FFFFFF",
    "bgNegative": "#FFFFFF",
    "bgWarning": "#FFFFFF",
    "bgWarningSubtle": "#FFFFFF",
    "bgOverlay": "rgba(0,0,0,.4)",
    "bgDark": "#1A1A2E",
    "bgDarkRaised": "#242442",
    "iconDefault": "#4A4A4A",
    "iconStrong": "#1A1A1A",
    "iconMuted": "#8A8A8A",
    "iconDisabled": "#B5B5B5",
    "iconInverse": "#FFFFFF",
    "iconActive": "#E70E68",
    "button": {
      "$source": "DS V3 Button component (Figma node 56611-11049) — latest & authoritative per Brian. Supersedes the older export for hover/fg where they disagreed.",
      "primaryBg": "#E70E68",
      "primaryBgHover": "#DB005B",
      "primaryBgPress": "#DB005B",
      "primaryFg": "#FFFFFF",
      "secondaryBg": "#FFFFFF",
      "secondaryBgHover": "#FEF3F7",
      "secondaryBorder": "#E3E3E3",
      "secondaryBorderHover": "#E70E68",
      "secondaryBorderPress": "#D4D4D4",
      "tertiaryBgHover": "#FEF3F7",
      "tertiaryBgActive": "#FEF3F7",
      "disabledBg": "#E3E3E3",
      "disabledFg": "#B5B5B5",
      "dangerBg": "#000000",
      "dangerBgHover": "#1A1A1A",
      "dangerBgPress": "#303030",
      "dangerRing": "rgba(0,0,0,.2)",
      "positiveBg": "#000000",
      "positiveBgHover": "#1A1A1A",
      "positiveBgPress": "#303030",
      "positiveFg": "#FFFFFF",
      "focusRing": "rgba(231,14,104,.3)",
      "focusRingSuccess": "rgba(0,0,0,.2)",
      "elevatePrimary": "0 2px 0 0 rgba(0,0,0,.04)",
      "elevatePrimaryHover": "0 4px 12px rgba(231,14,104,.32)",
      "elevateSecondary": "0 2px 0 0 rgba(0,0,0,.016)",
      "encourageBg": "#E70E68",
      "encourageBgHover": "#DB005B",
      "encourageBgPress": "#DB005B",
      "$note": "Colour rules 2026-10-07: primary Vivid Pink with a solid white label, Darker Pink on hover and press; secondary and tertiary hover Vivid Pink at 5% with a Vivid Pink border; danger and positive are black fills that lift to grey-100 on hover and grey-95 on press (status carries no colour); primary press is Darker Pink like hover but drops the hover shadow, since the guideline defines no press shade; encourage follows primary. Per-tone soft box-shadow focus ring (spread 2)."
    },
    "primitives": {
      "white": "#FFFFFF",
      "black": "#000000",
      "vividPink": {
        "5": "#FEF3F7",
        "30": "#F8B7D2",
        "100": "#E70E68",
        "dark": "#DB005B"
      },
      "purple": {
        "5": "#FCFBFF",
        "10": "#F9F5FF",
        "15": "#F0E4FF",
        "20": "#E6D4FF",
        "25": "#DCC4FF",
        "30": "#D3B4FF",
        "35": "#BE92F8",
        "40": "#A96FF0",
        "45": "#985AE2",
        "50": "#8644D4",
        "55": "#7831C8",
        "60": "#6A1EBB",
        "70": "#621BAF",
        "80": "#5715A0",
        "90": "#430379",
        "100": "#2B0051"
      },
      "pink": {
        "10": "#FDF6FA",
        "20": "#FFE3E9",
        "30": "#FFBACA",
        "40": "#FF91AF",
        "50": "#FF6996",
        "60": "#FF4081",
        "70": "#D92B6B",
        "80": "#B31B57",
        "90": "#8C0E5A",
        "100": "#660934"
      },
      "teal": {
        "10": "#F5FFFC",
        "20": "#D8FAEF",
        "30": "#93F5DA",
        "40": "#4EF1C5",
        "50": "#20E8B5",
        "60": "#16C49A",
        "70": "#13A181",
        "80": "#0F6E65",
        "90": "#0A4C47",
        "100": "#062A27"
      },
      "coral": {
        "10": "#FFF5F0",
        "20": "#FFE5D6",
        "30": "#FFCBB0",
        "40": "#FFAD8C",
        "50": "#FF9068",
        "60": "#FF7747",
        "70": "#E65B29",
        "80": "#CC471A",
        "90": "#993310",
        "100": "#661D05"
      },
      "red": {
        "10": "#FFF1F0",
        "20": "#FFCCC7",
        "30": "#FFA39E",
        "40": "#FF7875",
        "50": "#FF4D4F",
        "60": "#F5222D",
        "70": "#CF1322",
        "80": "#A8071A",
        "90": "#820014",
        "100": "#5C0011"
      },
      "yellow": {
        "10": "#FFFBE5",
        "20": "#FFF5B7",
        "30": "#FFEF88",
        "40": "#FFE95A",
        "50": "#FFE32C",
        "60": "#DBC123",
        "70": "#B79F1A",
        "80": "#947D12",
        "90": "#705B09"
      },
      "indigo": {
        "0": "#FFFFFF",
        "10": "#F9F9FF",
        "15": "#F0F4FF",
        "20": "#E4E4F7",
        "30": "#C0C0E6",
        "40": "#9B9BCC",
        "50": "#7777AA",
        "60": "#5A5A91",
        "70": "#434373",
        "80": "#3E3E5A",
        "90": "#242442",
        "95": "#252544",
        "100": "#1A1A2E"
      },
      "softIndigo": {
        "10": "#FAFCFF",
        "20": "#F4F8FF",
        "30": "#EAF0FF",
        "40": "#D9E2FF",
        "50": "#BFD2FF",
        "60": "#9BB3E9",
        "70": "#7B98D4",
        "80": "#5A78B5",
        "90": "#3E5D99",
        "100": "#27487A"
      },
      "lavender": {
        "10": "#FEFBFD",
        "20": "#FCF6FA",
        "30": "#FAF0F6",
        "40": "#E9C8E0",
        "50": "#D6A6CB",
        "60": "#BD7FB1",
        "70": "#A05D96",
        "80": "#88407C",
        "90": "#69305C",
        "100": "#4A1F3E"
      },
      "gray": {
        "0": "#FFFFFF",
        "10": "#FDFDFD",
        "15": "#FAFAFA",
        "20": "#F7F7F7",
        "25": "#F3F3F3",
        "30": "#F1F1F1",
        "35": "#EBEBEB",
        "40": "#E3E3E3",
        "50": "#D4D4D4",
        "55": "#CCCCCC",
        "60": "#B5B5B5",
        "65": "#A8A8A8",
        "70": "#8A8A8A",
        "80": "#616161",
        "90": "#4A4A4A",
        "95": "#303030",
        "100": "#1A1A1A"
      }
    },
    "brand": {
      "1": "#6A1EBB",
      "2": "#FF4081",
      "3": "#1A1A2E",
      "4": "#20E8B5",
      "5": "#434373",
      "6": "#FF9068",
      "7": "#93F5DA",
      "8": "#FFBACA",
      "9": "#D3B4FF",
      "10": "#BFD2FF",
      "11": "#D9E2FF",
      "12": "#FDF6FA",
      "13": "#F4F8FF"
    },
    "viz": {
      "$source": "Data-visualisation palette for <aha-chart>. Every value aliases ({color.…}) a colour token; generate.mjs emits var(--aha-…) in tokens.css and resolves hex in tokens.js. Brand charts use four colours in order (colour rules section 8): Vivid Pink for the main series, black for the second, Vivid Pink at 30%, then light grey #A8A8A8; series 5 and 6 repeat the first two, so a chart past four series also separates them with a dashed line or pattern and a written label. Vivid Pink at 30% and light grey are faint on white, so every mark carries its value as text and a tooltip. Tints sit behind ink text: Vivid Pink at 5% for the pink series, light grey for the black and grey series. Ink is textDefault, the inverse is textInverse, and neutral (Other, non-correct Pick Answer) is iconMuted. Secondary/tertiary text, axis, grid, track, hover and mark outlines use textSecondary, textTertiary, borderStrong, border, borderSecondary, bgHover and inkA10 inside the element. A deck-palette chart replaces the series with the deck's presentationColorPalette (customer content, exempt from the colour rules).",
      "ink": "#1A1A1A",
      "inkInverse": "#FFFFFF",
      "neutral": "#8A8A8A",
      "series": {
        "1": "#E70E68",
        "2": "#000000",
        "3": "#F8B7D2",
        "4": "#A8A8A8",
        "5": "#E70E68",
        "6": "#000000"
      },
      "tint": {
        "1": "#FEF3F7",
        "2": "#F7F7F7",
        "3": "#FEF3F7",
        "4": "#F7F7F7",
        "5": "#FEF3F7",
        "6": "#F7F7F7"
      }
    },
    "alpha": {
      "inkA10": "rgba(0,0,0,.1)",
      "inkA30": "rgba(0,0,0,.3)",
      "inkA50": "rgba(0,0,0,.5)",
      "inkA70": "rgba(0,0,0,.7)",
      "inkA90": "rgba(0,0,0,.9)",
      "whiteA0": "rgba(255,255,255,0)",
      "whiteA50": "rgba(255,255,255,.5)",
      "whiteA70": "rgba(255,255,255,.7)",
      "whiteA90": "rgba(255,255,255,.9)"
    },
    "$note": "Solid warm-gray text (export) chosen over the skill's black-alpha-of-indigo — alpha text is the dark-surface-invisible trap aha-design-antd itself warns about."
  },
  "font": {
    "product": "\"Plus Jakarta Sans\", -apple-system, \"Segoe UI\", Roboto, sans-serif",
    "display": "\"Nunito\", sans-serif",
    "secondary": "\"Nunito Sans\", sans-serif",
    "mono": "Menlo, Monaco, monospace",
    "stylized": null,
    "$note": "NO Inter. The export (SoT) declares Inter a Figma-local system face, 'not a brand face, not loaded'. The skill's Inter label rule is from a different Figma frame and is overruled. Load product self-hosted (aha-design-antd)."
  },
  "weight": {
    "regular": 400,
    "semibold": 600,
    "$note": "400/600 ONLY (design-owner decision 2026-09-14: 700 dropped from the product type scale — Display uses 600, not Bold). Export's unused 500 also removed. The sole remaining literal font-weight:700 is the MEASURED aha-tabs primary-tab active label (lib/aha-tabs.js) — a component-standard exception pending re-measure, not part of the scale."
  },
  "size": {
    "sm": 12,
    "default": 14,
    "l": 16,
    "h6": 18,
    "xl": 20,
    "h4": 24,
    "h3": 32,
    "h2": 40,
    "h1": 48,
    "display2": 56,
    "display1": 64,
    "$note": "18 (h6) added from skill; export's size-tiny 8px is spacing, not a text role — smallest text role is 10 (skill 'tiny')."
  },
  "lineHeight": {
    "tight": 1.2,
    "heading": 1.3,
    "body": 1.5,
    "normal": "normal",
    "$note": "Unitless RATIOS, not px. body 1.5 → 21px at 14 — matches the MEASURED shipped components (checkbox 21px). The export token file's px line-heights (22/28) are drift from what ships; export's --aha-lh-tight:8px is a bug, discarded."
  },
  "letterSpacing": {
    "headlines": "0px",
    "subheadings": "0.2px",
    "paragraph": "0.2px",
    "subtext": "0.3px"
  },
  "radius": {
    "xs": 4,
    "sm": 6,
    "default": 8,
    "lg": 12,
    "xl": 16,
    "pill": 999,
    "marketing": 20,
    "$note": "MEASURED wins: default=8 (button md / input / modal), card=12. Export MISLABELS default as 6 and lg as 8 — corrected. Export's radius-64 is off-scale (audit: likely 80) — see open items."
  },
  "controlHeight": {
    "root": 32,
    "sm": 24,
    "lg": 40,
    "button": {
      "sm": 28,
      "md": 36,
      "lg": 40,
      "xl": 52
    },
    "$note": "MEASURED wins: fields (Input/Select/DatePicker) inherit root 32 (sm 24 / lg 40); Button carries 28/36/40/52 via components.Button. Export specimen field heights (32/36/40) are drift."
  },
  "space": [
    0,
    2,
    4,
    6,
    8,
    10,
    12,
    14,
    16,
    20,
    24,
    28,
    32,
    36,
    40,
    44,
    48,
    56,
    60,
    64,
    68,
    80,
    96,
    100
  ],
  "breakpoints": {
    "phone": 375,
    "tablet": 768,
    "desktop": 1280,
    "$note": "From the export README; export space.css omits 375 (internal export nit) — README value used."
  },
  "layout": {
    "contentMaxWidth": 1440,
    "tooltipMaxWidth": 280,
    "$note": "Default max-width for centred app content: the page/screen container caps here and centres with auto side margins (max-width:var(--aha-content-max-width); margin-inline:auto). 1440 is the DS V3 desktop content ceiling — one step above the 1280 desktop breakpoint. Consume via --aha-content-max-width."
  },
  "effect": {
    "$source": "Visual effects. blur.md is the frosted-glass backdrop blur behind translucent surfaces (chart tracks, chips, legend hover, mind-map controls), from the PRO38-69 chart mockup (--viz-backdrop-blur 20px). New token; px.",
    "blur": {
      "md": 20
    }
  },
  "viz": {
    "$source": "Chart geometry + deck ink mixes for <aha-chart>. Geometry aliases the spacing scale ({space.N}) where a step exists; barThickness 38 and plotHeight 260 have no step and stay literal. Type sizes come from the type scale (--aha-size-*), not viz tokens. mix.* apply only to deck-palette charts, where the greys must be derived from the deck's own text colour; brand charts use the semantic text/border/bg tokens.",
    "barThickness": 38,
    "barGap": 24,
    "valueWidth": 100,
    "columnWidth": 96,
    "columnGap": 28,
    "plotHeight": 260,
    "stubLength": 12,
    "markMinLength": 24,
    "columnMinHeight": 16,
    "legendSwatch": 14,
    "mix": {
      "secondary": 76,
      "tertiary": 54,
      "axis": 26,
      "grid": 12,
      "track": 7,
      "stroke": 10,
      "strokeChip": 20,
      "hover": 8,
      "active": 16,
      "dim": 38
    }
  },
  "openItems": [
    "encourage-button greens (#2CB268/#168C4D/#12733F) exist in export semantic.css but in NO palette scale — add green primitives + alias, or drop the 'encourage' variant. DS-owner call.",
    "radius-64: off the 4/6/8/12/16 scale; export README documents an 80px outlier, not 64 — confirm 80 or remove.",
    "H5/H6 line-height: skill says 1.3; confirm against any shipped h5/h6 component."
  ]
};
// Tokens defined as aliases of another token: path → the referenced token path and its CSS var.
export const tokenAliases = {
  "color.viz.ink": {
    "ref": "color.textDefault",
    "cssVar": "--aha-text-default"
  },
  "color.viz.inkInverse": {
    "ref": "color.textInverse",
    "cssVar": "--aha-text-inverse"
  },
  "color.viz.neutral": {
    "ref": "color.iconMuted",
    "cssVar": "--aha-icon-muted"
  },
  "color.viz.series.1": {
    "ref": "color.primitives.vividPink.100",
    "cssVar": "--aha-vivid-pink-100"
  },
  "color.viz.series.2": {
    "ref": "color.primitives.black",
    "cssVar": "--aha-black"
  },
  "color.viz.series.3": {
    "ref": "color.primitives.vividPink.30",
    "cssVar": "--aha-vivid-pink-30"
  },
  "color.viz.series.4": {
    "ref": "color.primitives.gray.65",
    "cssVar": "--aha-gray-65"
  },
  "color.viz.series.5": {
    "ref": "color.primitives.vividPink.100",
    "cssVar": "--aha-vivid-pink-100"
  },
  "color.viz.series.6": {
    "ref": "color.primitives.black",
    "cssVar": "--aha-black"
  },
  "color.viz.tint.1": {
    "ref": "color.bgAccent",
    "cssVar": "--aha-bg-accent"
  },
  "color.viz.tint.2": {
    "ref": "color.primitives.gray.20",
    "cssVar": "--aha-gray-20"
  },
  "color.viz.tint.3": {
    "ref": "color.bgAccent",
    "cssVar": "--aha-bg-accent"
  },
  "color.viz.tint.4": {
    "ref": "color.primitives.gray.20",
    "cssVar": "--aha-gray-20"
  },
  "color.viz.tint.5": {
    "ref": "color.bgAccent",
    "cssVar": "--aha-bg-accent"
  },
  "color.viz.tint.6": {
    "ref": "color.primitives.gray.20",
    "cssVar": "--aha-gray-20"
  },
  "viz.barGap": {
    "ref": "space.24",
    "cssVar": "--aha-space-24"
  },
  "viz.valueWidth": {
    "ref": "space.100",
    "cssVar": "--aha-space-100"
  },
  "viz.columnWidth": {
    "ref": "space.96",
    "cssVar": "--aha-space-96"
  },
  "viz.columnGap": {
    "ref": "space.28",
    "cssVar": "--aha-space-28"
  },
  "viz.stubLength": {
    "ref": "space.12",
    "cssVar": "--aha-space-12"
  },
  "viz.markMinLength": {
    "ref": "space.24",
    "cssVar": "--aha-space-24"
  },
  "viz.columnMinHeight": {
    "ref": "space.16",
    "cssVar": "--aha-space-16"
  },
  "viz.legendSwatch": {
    "ref": "space.14",
    "cssVar": "--aha-space-14"
  }
};
export default tokens;
