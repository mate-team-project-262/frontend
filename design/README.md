# Design reference (not bundled into the app)

Figma exports for the "What to Watch" (W2W) redesign. Keep them as the source of truth for later pages.

- `landing-main-page-1440.png` - full landing frame (1440px), used to verify the landing pixel by pixel.
- `ui-kit/UI-Kit.png` - buttons (default / hover / pressed / disabled), chips, inputs (default / hover / focus / filled / error / disabled), participant item, icons.
- `ui-kit/*-icon.png` - back, copy, leave, waiting, qr, telegram, error icons (24x24 PNG - ask for SVG).
- `ui-kit/text-styles.png` - typography: Hero Geologica Black 96/100, H1 Geologica Black 64/100, H2 Geologica Bold 48/120,
  H3 Geologica Bold 36/120, H4 Geologica Regular 24/135, Main text Inter Regular 16/150, Secondary text Inter Regular 14/150,
  Button text Geologica Regular 16/100 (size / line-height %).

## UI kit v2 (November 2026)

- `ui-kit/UI-Kit-v2.png` - updated kit. Inputs (dark): default #2f2270 fill, hover / focus / filled #170e43, 1px border
  #b18aff, error border #930002, success border #00924e, disabled #645b8d, no error icon, no glow; focus fades the placeholder.
  Buttons: ghost hover border #7835ff, pressed #2f2270 fill, disabled #645b8d; new cream "light" button and violet text
  links for light surfaces; light (cream) inputs.
- Not built yet (movie picking / results / account pages): progress bar "7 / 20", round icon button (heart),
  movie navigation (X / heart, "Swipe or tap to vote"), participant progress chips (Done / Swiping... / Waiting...),
  user menu (name pill with Profile / Settings / Log out), swipe movie card, movie details card (Director, Cast,
  Age rating, Budget, Revenue, Original language, Close details), result cards ("4 / 4 liked it" with crown, View details;
  compact "3 / 4 liked it" with Details), translucent header variant, icons (check, crown, star, heart, x, arrow right,
  mail, lock, eye / eye-off, user, chevrons, Google, Facebook).

## UI kit v3 and the swipe session (November 2026)

- `ui-kit/v3/*.png` - the kit as separate pages: Colors (tokens: Accent/100 #7835FF, Accent/80 #B18BFF,
  Accent/40 #E2D4FF, Navy/100 #070125 ... Navy/20 #D8D3E6, Cream #FFFAEF, Background light #FFF9EA,
  Error on dark #EB4B5B, Error on light #D60004, Success #00924E, Info #0E3DB3, Warning #EACF00),
  Buttons (+ red "system error" button, round icon button states), Text Input, Tabs/dropdowns (chips,
  tab item, user dropdown), Other (toast, progress bar, participant progress states, movie card,
  details modal, winner / highly-rated / session cards), Icons, Typography (H4 = Geologica Bold 24/120,
  H5 = Geologica Regular 24/135), Grid (4 columns, 120px margins, 20px gutter).
- `swipe-session/*.png` - 06 Swipe session frames (card, details, mobile) used for the swipe page.
