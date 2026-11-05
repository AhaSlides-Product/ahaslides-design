# Keyboard run: presenting view, PR sandbox, Chrome, no mouse after load

Cheatsheet opened with `K`. Rows listed: Next slide (→), Previous slide (←), Timer (T), Annotate (D), Hotkeys (K), Exit presenting (Esc).

| Control | State | Key pressed | What happened |
|---|---|---|---|
| Timer | nothing open | Tab to button | Tooltip "Timer" with chip T; screen reader reads "Timer (T)" |
| Timer | nothing open | T | Timer started |
| Annotate | nothing open | Tab to button | Tooltip "Annotate" with chip D; screen reader reads "Annotate (D)" |
| Annotate | nothing open | D | Picker opened; focus on "Pen" inside the picker |
| Annotate | picker open | Tab, Tab, Tab | Focus cycled Pen → Highlighter → Eraser → Pen, never left the picker |
| Annotate | picker open | Esc | Picker closed; focus on the Annotate button; still presenting, same slide |
| Annotate | nothing open | Enter on focused trigger | Picker opened; focus on "Pen" |
| Annotate | picker open | Esc | Picker closed; focus on the Annotate button; still presenting |
| — | nothing open | Esc | Presenting view closed |
| Cheatsheet | nothing open | K | Cheatsheet opened |
| Cheatsheet | open | (read, then pressed each listed key) | Every control-bar key listed with the same name; each listed key worked |

## Cheatsheet screenshots: whole presenting screen, 1440 × 810

`cheatsheet-rest.png` (cheatsheet open, bar at rest) and `cheatsheet-bar-collapsed.png` (bar collapsed to its compact width, window narrowed to 1024, cheatsheet reopened). Measured with `getBoundingClientRect()` on each control and on each connector dot.

| Panel | Connector | Control's span (x) | Dot centre (x) | Overlap | After the bar change |
|---|---|---|---|---|---|
| Back to Editor | line + dot, rounded corner, same as the others | 24–64 | 44 | none | dot 44 on span 24–64, still joined |
| QR code | line + dot, rounded corner | 996–1036 | 1016 | none | dot 812 on span 792–832, panel moved with it |
| Timer | line + dot, rounded corner | 1092–1132 | 1112 | none | dot 868 on span 848–888, panel moved with it |
| Annotate | line + dot, rounded corner | 1140–1180 | 1160 | none | dot 916 on span 896–936, panel moved with it |

Every panel sits beside its own control; no panel overlaps another panel, a connector or its control, at rest or after the change.
