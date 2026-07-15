// Generates meta/site.generated.mjs, a plain-JS mirror of meta/site.json.
// meta/dynamicMeta.mjs is loaded both by raw Node (next.config.mjs /
// next-sitemap.config.mjs) and bundled to the browser (remark plugins run
// client-side). No ESM JSON import-attribute syntax is accepted by both Node 22
// (needs `with`, rejects `assert`) and Next 13's SWC (accepts `assert`, rejects
// `with`), so dynamicMeta imports this generated JS module instead of the JSON.
import { readFileSync, writeFileSync } from 'fs'

const src = new URL('../meta/site.json', import.meta.url)
const dest = new URL('../meta/site.generated.mjs', import.meta.url)

const site = JSON.parse(readFileSync(src))
const header =
    '// AUTO-GENERATED from meta/site.json by setup/generateSiteModule.mjs — do not edit.\n'
writeFileSync(dest, `${header}export default ${JSON.stringify(site, null, 4)}\n`)
