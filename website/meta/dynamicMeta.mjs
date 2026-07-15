// site.json is imported via the generated JS mirror site.generated.mjs (built
// by setup/setup.sh) rather than a JSON module: this file is loaded both by raw
// Node (next.config.mjs / next-sitemap.config.mjs) and bundled to the browser
// (remark plugins run client-side), and no ESM JSON import-attribute syntax is
// accepted by both Node 22 and Next 13's SWC. A plain JS module sidesteps that.
import site from './site.generated.mjs'

export const domain = process.env.BRANCH || site.domain
export const siteUrl = `https://${domain}`
export const nightly = site.nightlyBranches.includes(domain)
export const legacy = site.legacy || !!+process.env.SPACY_LEGACY
export const binderBranch = domain
export const branch = nightly ? 'develop' : 'master'
export const replacements = {
    GITHUB_SPACY: `https://github.com/explosion/spaCy/tree/${branch}`,
    GITHUB_PROJECTS: `https://github.com/${site.projectsRepo}`,
    SPACY_PKG_NAME: nightly ? 'spacy-nightly' : 'spacy',
    SPACY_PKG_FLAGS: nightly ? ' --pre' : '',
}
