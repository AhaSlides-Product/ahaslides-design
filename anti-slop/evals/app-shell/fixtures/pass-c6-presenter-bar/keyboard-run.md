# Keyboard run: presenting view, PR sandbox, Chrome, no mouse after load

Cheatsheet opened with `?`. Rows listed: Next slide (→), Previous slide (←), Timer (T), Annotate (D), Hotkeys (?), Exit presenting (Esc).

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
| Cheatsheet | open | (read, then pressed each listed key) | Every control-bar key listed with the same name; each listed key worked |
