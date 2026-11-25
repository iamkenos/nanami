## About

Spotify full app display theme. 

## Requirements

- Install [spicetify](https://spicetify.app/docs/advanced-usage/installation)

## Install and Upgrade
```
brew install spicetify-cli
curl -fsSL https://raw.githubusercontent.com/spicetify/marketplace/main/resources/install.sh | sh
spicetify backup apply
```

## Usage

- Open the Spicetify config directory with `spicetify config-dir`.
- Copy the complete `Themes/dandelionwishing` and `Themes/modoludens` folders into its `Themes/` directory, preserving each `assets/` folder. Copy `Extensions/full-app-display.js` into its `Extensions/` directory.
- Keep the Full App Display extension enabled for any theme. Theme-specific styling belongs in that theme's `user.css`; each theme can register its own optional renderer from a JavaScript file in its `assets/` directory.
- Run

   ```
   spicetify config current_theme <theme name>
   spicetify config inject_css 1
   spicetify config inject_theme_js 0
   spicetify config extensions full-app-display.js
   spicetify config overwrite_assets 1
   spicetify apply
   ```

When upgrading from the legacy extension, do not enable both `ae-fad-override.js` and `full-app-display.js`; both add the Full App Display button. Remove the legacy entry and reapply:

   ```
   spicetify config extensions ae-fad-override.js-
   spicetify apply
   ```

To switch between the included themes, change only `current_theme` and apply:

   ```
   spicetify config current_theme modoludens
   spicetify apply
   ```

Use `spicetify config current_theme dandelionwishing` followed by `spicetify apply` to switch back. Keep the shared `full-app-display.js` extension enabled for either theme.

## Creating a theme

1. Create a folder at `Themes/<theme-name>/` in this repository. Add `color.ini` for the Spotify color palette and `user.css` for theme styling. Put theme-specific files in `Themes/<theme-name>/assets/`.
2. Define Full App Display styling tokens on `#fad-body` in `user.css`. For a custom artwork renderer, set `--fad-theme-id` and `--fad-theme-script-file` there; the script filename is the basename only, for example `mytheme-theme.js`.
3. In the asset script, register a renderer using the same theme ID with `window.FullAppDisplayThemeRegistry.register("<theme-name>", { mount(root) { ... } })`. The renderer can add theme artwork to `root` and return a cleanup function.
4. Copy the complete `Themes/<theme-name>/` folder, including `assets/`, into the `Themes/` directory opened by `spicetify config-dir`. The shared `Extensions/full-app-display.js` only needs to be installed and enabled once.
5. Select and apply the theme:

   ```
   spicetify config current_theme <theme-name>
   spicetify apply
   ```

Keep `overwrite_assets` enabled so Spicetify copies theme assets for the renderer and CSS to use. After installing another theme, repeat only steps 4–5; no extension or other code changes are needed.

## Theme customization

The shared extension provides the disc, player controls, and a theme-artwork mount point. Each theme owns its background, artwork, colors, fonts, and additional text. Define theme tokens in that theme's `user.css` on `#fad-body`, including `--fad-icon-hover-color`, `--fad-font-body`, `--fad-font-header`, and `--fad-font-mono`. The artist uses the heading font, the player time uses the mono font, and other text uses the main font.

A theme can optionally set `--fad-theme-id` and `--fad-theme-script-file` to load a renderer from that theme's `assets/` directory. The renderer registers with `window.FullAppDisplayThemeRegistry.register(themeId, { mount(root) { ... } })` and may return a cleanup function. SVG and PNG assets can be referenced from theme CSS. The shared extension makes no assumptions about theme artwork or markup. `overwrite_assets` must be enabled for Spicetify to copy theme assets into XPUI's root.

## Themes

### Dandelion Wishing

This theme uses Merriweather for artist headings and Geist Mono for player time, with Raleway as its main font. These fonts load from Google Fonts and require an internet connection when Spotify loads the theme. The theme renderer tries `dandelionwishing-sloth.svg` first, then `dandelionwishing-sloth.png`, so a same-basename PNG can replace the SVG without changing the renderer.

### Modoludens

This theme migrates the original Ludens artwork and colors into the shared theme structure. It uses Quicksand for body text, Geist for headings, Geist Mono for time displays, and its own `color.ini`, CSS, renderer, and `assets/` directory; it does not require changing the shared extension when switching themes.

## Troubleshooting

To inspect missing theme assets, enable Spotify DevTools with `spicetify enable-devtools`, then run `spicetify apply`. Open Spotify's Console with **Cmd+Option+I** on macOS (**Ctrl+Shift+I** on Windows/Linux) and filter for `[Full App Display]`; failed asset loads include their resolved URL.