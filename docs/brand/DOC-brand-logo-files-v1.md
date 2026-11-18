# DOC-brand-logo-files-v1: Gajju logo and favicon files
Version: v1 · Date: 18 Nov 2026 · Owner: website thread (role not yet set) · Status: Draft, for Ayyappa's approval
Changes since last version: first version. Vector rebuild of Primary_logo.png (17 Nov 2026); shapes and colours unchanged.

## What's inside
| Folder | Files |
|---|---|
| svg/ | 16 SVGs: logo (symbol + "Gajju"), Gajju Mini lock-up, symbol alone, wordmark alone; each in 4 versions |
| png/ | The same, transparent background, at 120/240/480 px high (logos) and 64/256/512 px (symbol) |
| favicon/ | favicon.ico (16, 32, 48), favicon.svg, favicon-16/32/48 PNG, apple-touch-icon.png (180), android-chrome 192 and 512, site.webmanifest |

## Which version to use
| Version | Use it on |
|---|---|
| full-colour | Cream or Paper backgrounds (the main version) |
| reverse | Ink or other dark backgrounds (Paper head, saffron ears) |
| one-colour-ink | One-colour printing on light paper (eyes and dots are cut out) |
| one-colour-paper | One-colour on dark backgrounds, e.g. laser marking, white-on-dark merchandise |

## Rules (from the brand guidelines)
- Clear space on every side = the height of the "G".
- Smallest size: 24 px high on screen, 10 mm in print. Below that, use the symbol alone.
- Don't stretch, rotate, outline, add shadows or glows, recolour, or place on a busy photo.
- Gajju Mini lock-up: "Mini" in Nunito Sans Bold, cap height = height of the lower-case "a" in Gajju, baseline aligned; Saffron Deep (#A9530B) on light, Saffron (#F08A24) on dark.

## Favicon: paste into every page's <head>
```html
<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#F6EFE3">
```
Put all favicon/ files in the site's root folder. favicon.svg switches to a Paper head in dark browser themes. The 16 and 32 px icons use a simplified symbol (no head dots, larger eyes) so they stay readable in a browser tab.

## Notes
- Built from the Primary_logo.png artwork: geometry measured from the PNG; wordmark set in Rubik Bold (Google Fonts, SIL Open Font License) and converted to outlines, so no font is needed to display the files.
- The brand guidelines (17 Nov) still say "Gajju has no logo yet" and should be updated to point to these files.
