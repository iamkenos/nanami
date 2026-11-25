## About

E's custom Spotify full app display theme. 

## Requirements

- Install [spicetify](https://spicetify.app/docs/advanced-usage/installation)

## Usage

- Open spicetify config: `spicetify config-dir`
- Copy files to Themes and Extensions
- Keep the Full App Display extension enabled for any theme. Theme-specific styling belongs in that theme's `user.css`; each theme can register its own optional renderer from a JavaScript file in its `assets/` directory.
- Run

   ```
   spicetify config current_theme dandelionwishing
   spicetify config inject_css 1
   spicetify config inject_theme_js 0
   spicetify config extensions full-app-display.js
   spicetify config overwrite_assets 1
   spicetify apply
   ```

## Theme customization

The shared extension provides the disc, player controls, and a theme-artwork mount point. Each theme owns its background, artwork, colors, fonts, and additional text. Define theme tokens in that theme's `user.css` on `#fad-body`, including `--fad-icon-hover-color`, `--fad-font-body`, `--fad-font-header`, and `--fad-font-mono`. The artist uses the heading font, the player time uses the mono font, and other text uses the main font.

A theme can optionally set `--fad-theme-id` and `--fad-theme-script-file` to load a renderer from that theme's `assets/` directory. The renderer registers with `window.FullAppDisplayThemeRegistry.register(themeId, { mount(root) { ... } })` and may return a cleanup function. SVG and PNG assets can be referenced from theme CSS. The shared extension makes no assumptions about theme artwork or markup. `overwrite_assets` must be enabled for Spicetify to copy theme assets into XPUI's root.

## Themes

### Dandelion Wishing

This theme uses Merriweather for artist headings and Geist Mono for player time, with Raleway as its main font. These fonts load from Google Fonts and require an internet connection when Spotify loads the theme. The theme renderer tries `dandelionwishing-sloth.svg` first, then `dandelionwishing-sloth.png`, so a same-basename PNG can replace the SVG without changing the renderer.

## Troubleshooting

To inspect missing theme assets, enable Spotify DevTools with `spicetify enable-devtools`, then run `spicetify apply`. Open Spotify's Console with **Cmd+Option+I** on macOS (**Ctrl+Shift+I** on Windows/Linux) and filter for `[Full App Display]`; failed asset loads include their resolved URL.