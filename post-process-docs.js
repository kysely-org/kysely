const fs = require('fs')
const path = require('path')

const DOCS_PATH = path.join(__dirname, 'docs')
const DOCS_ASSET_PATH = path.join(DOCS_PATH, 'assets')
const DOCS_IMAGE_PATH = path.join(DOCS_ASSET_PATH, 'images')
const DOCS_CSS_PATH = path.join(DOCS_ASSET_PATH, 'css')
const DOCS_MAIN_CSS_FILE_PATH = path.join(DOCS_CSS_PATH, 'main.css')

const THEME_CSS_PATH = path.join(__dirname, 'docs-theme.css')
const ASSET_PATH = path.join(__dirname, 'assets')

// Files to go through and replace ASSET_URL_BASE with FIXED_ASSET_URL_BASE.
const ASSET_FIX_FILES = [path.join(__dirname, 'docs', 'index.html')]
const ASSET_URL_BASE = 'https://github.com/koskimas/kysely/blob/master/assets'
const FIXED_ASSET_URL_BASE = 'assets/images'

// Add our own theme stuff to the main css file.
const css = fs.readFileSync(DOCS_MAIN_CSS_FILE_PATH).toString()
const themeCss = fs.readFileSync(THEME_CSS_PATH).toString()
fs.writeFileSync(DOCS_MAIN_CSS_FILE_PATH, `${css}\n${themeCss}`)

// Copy all assets to doc assets.
for (const assetName of fs.readdirSync(ASSET_PATH)) {
  fs.copyFileSync(
    path.join(ASSET_PATH, assetName),
    path.join(DOCS_IMAGE_PATH, assetName)
  )
}

// Fix asset urls.
for (const filePath of ASSET_FIX_FILES) {
  const file = fs
    .readFileSync(filePath)
    .toString()
    .replaceAll(ASSET_URL_BASE, FIXED_ASSET_URL_BASE)

  fs.writeFileSync(filePath, file)
}
