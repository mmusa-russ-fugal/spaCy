/**
 * Code generators for the pipeline builder: pure functions from the builder
 * state (see spec.ts for the state contract) to the code shown in the
 * widget's output pane.
 *
 * The three per-mode outputs (Python for tour/build, config.cfg INI for
 * config, single add_pipe call for snippet) follow the placeholder widget's
 * generators; the Python/INI rendering of literals, `config=` overrides and
 * ruler patterns is ported from `pipeline-composer/src/lib/pygen.ts` and
 * `cfggen.ts`.
 */
import type { BuilderPreset } from './presets'
import type { BuilderState, PipelineComponentState } from './spec'

/** Render a JSON-ish value as a Python literal (composer pygen port). */
export function pyLiteral(value: unknown): string {
    if (value === null || value === undefined) return 'None'
    if (value === true) return 'True'
    if (value === false) return 'False'
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') return JSON.stringify(value)
    if (Array.isArray(value)) {
        return `[${value.map(pyLiteral).join(', ')}]`
    }
    if (typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>).map(
            ([k, v]) => `${JSON.stringify(k)}: ${pyLiteral(v)}`
        )
        return `{${entries.join(', ')}}`
    }
    return JSON.stringify(value)
}

/**
 * Render a config value in confection (config.cfg) syntax: JSON values,
 * with the same conventions `spacy init config` output uses (cfggen port).
 */
export function cfgValue(value: unknown): string {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'string') return JSON.stringify(value)
    if (typeof value === 'boolean' || typeof value === 'number') return String(value)
    return JSON.stringify(value)
}

const quote = (value: string): string => `"${value}"`

function sourceVar(source: string): string {
    return source.replace(/[^a-zA-Z0-9]/g, '_')
}

function formatPipeNames(state: BuilderState): string {
    const names = state.pipeline
        .filter((c) => !c.disabled)
        .map((c) => `'${c.name}'`)
        .join(', ')
    // A trained-model base contributes pipes we can't enumerate here, unless
    // the listed components ARE the base pipeline (tour mode's fromBase
    // seeding) — fall back to a placeholder so the comment stays honest.
    if (state.base && !state.pipeline.some((c) => c.fromBase)) {
        return names ? `[<${state.base} pipes> + ${names}]` : `[<${state.base} pipes>]`
    }
    return `[${names}]`
}

function hasConfig(component: PipelineComponentState): boolean {
    return Boolean(component.config && Object.keys(component.config).length)
}

/**
 * Python output for the 'tour' and 'build' modes: create the nlp object
 * and add each component with nlp.add_pipe(), including source= for
 * sourced components, config= for non-default settings, add_patterns()
 * for ruler patterns and nlp.disable_pipe() for disabled components.
 */
export function generatePython(state: BuilderState): string {
    const sources = [
        ...new Set(state.pipeline.map((c) => c.source).filter((s): s is string => Boolean(s))),
    ]
    const lines = ['import spacy', '']
    for (const source of sources) {
        lines.push(`source_${sourceVar(source)} = spacy.load(${quote(source)})`)
    }
    lines.push(
        state.base
            ? `nlp = spacy.load(${quote(state.base)})`
            : `nlp = spacy.blank(${quote(state.lang)})`
    )
    let rulerCount = 0
    for (const component of state.pipeline) {
        // Components flagged fromBase are already part of the loaded
        // pipeline (tour mode), so no add_pipe call is generated for them
        if (component.fromBase) continue
        const args: string[] = []
        if (component.source) {
            // With source= set, the first argument is the pipe's name in
            // the source pipeline — its factory name — and name= renames it
            // in the receiving pipeline (config= is ignored for sourced
            // components).
            args.push(quote(component.factory), `source=source_${sourceVar(component.source)}`)
            if (component.name !== component.factory) {
                args.push(`name=${quote(component.name)}`)
            }
        } else {
            args.push(quote(component.factory))
            if (component.name !== component.factory) {
                args.push(`name=${quote(component.name)}`)
            }
            if (hasConfig(component)) {
                args.push(`config=${pyLiteral(component.config)}`)
            }
        }
        const call = `nlp.add_pipe(${args.join(', ')})`
        if (component.patterns?.length) {
            rulerCount += 1
            const varName = rulerCount === 1 ? 'ruler' : `ruler${rulerCount}`
            lines.push(`${varName} = ${call}`)
            lines.push(`${varName}.add_patterns(${pyLiteral(component.patterns)})`)
        } else {
            lines.push(call)
        }
    }
    const disabled = state.pipeline.filter((c) => c.disabled)
    if (disabled.length) {
        lines.push('')
        for (const component of disabled) {
            lines.push(`nlp.disable_pipe(${quote(component.name)})`)
        }
    }
    lines.push('')
    lines.push(`print(nlp.pipe_names)  # ${formatPipeNames(state)}`)
    return lines.join('\n')
}

/**
 * Name a component is referred to by in config.cfg. For sourced components
 * the section name must match the pipe's name in the source pipeline — its
 * factory name — because a local rename is not expressible in config.cfg
 * (validate.ts warns when one is dropped this way).
 */
function cfgComponentName(component: PipelineComponentState): string {
    return component.source ? component.factory : component.name
}

/**
 * config.cfg excerpt for the 'config' mode: [nlp] block with the pipeline
 * order, one [components.*] block per component (factory = trained from
 * scratch, source = copied from a trained pipeline) with any non-default
 * config keys, and, if any components are frozen, the [training] block
 * listing frozen_components.
 */
export function generateConfig(state: BuilderState): string {
    const lines = ['[nlp]', `lang = ${quote(state.lang)}`]
    lines.push(`pipeline = [${state.pipeline.map((c) => quote(cfgComponentName(c))).join(',')}]`)
    lines.push('')
    lines.push('[components]')
    for (const component of state.pipeline) {
        lines.push('')
        lines.push(`[components.${cfgComponentName(component)}]`)
        if (component.source) {
            lines.push(`source = ${quote(component.source)}`)
        } else {
            lines.push(`factory = ${quote(component.factory)}`)
            for (const [key, value] of Object.entries(component.config ?? {})) {
                if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
                    continue // nested dicts would need subsections; none of our fields emit them
                }
                lines.push(`${key} = ${cfgValue(value)}`)
            }
        }
        if (component.patterns?.length) {
            lines.push(
                `# ${component.patterns.length} ruler pattern(s) are not expressible in config.cfg;`
            )
            lines.push(
                '# add them at runtime via pipe.add_patterns(...) or an initialize callback.'
            )
        }
    }
    const frozen = state.pipeline.filter((c) => c.disabled)
    if (frozen.length) {
        lines.push('')
        lines.push('[training]')
        lines.push(
            `frozen_components = [${frozen.map((c) => quote(cfgComponentName(c))).join(',')}]`
        )
    }
    return lines.join('\n')
}

/**
 * Python output for the 'snippet' mode: a single nlp.add_pipe() call
 * combining the placement argument (before/after/first/last) with the
 * optional source= argument from the add_pipe API table.
 */
export function generateSnippet(state: BuilderState): string {
    const component = state.pipeline[0]
    if (!component) return 'import spacy'
    const placement = state.placement
    const lines = ['import spacy', '']
    if (component.source) {
        lines.push(`source_nlp = spacy.load(${quote(component.source)})`)
    }
    lines.push(`nlp = spacy.load(${quote(state.base ?? 'en_core_web_sm')})`)
    // With source= set, the first argument is the component's name in the
    // source pipeline, not its factory (see the source= row in the table
    // above)
    const args = [quote(component.source ? component.name : component.factory)]
    if (placement.arg === 'before' || placement.arg === 'after') {
        args.push(`${placement.arg}=${quote(placement.target || 'ner')}`)
    } else if (placement.arg === 'first') {
        args.push('first=True')
    }
    if (component.source) {
        args.push('source=source_nlp')
    }
    lines.push(`nlp.add_pipe(${args.join(', ')})`)
    return lines.join('\n')
}

export function generate(state: BuilderState, preset: BuilderPreset): string {
    if (preset.mode === 'snippet') return generateSnippet(state)
    if (preset.output === 'ini') return generateConfig(state)
    return generatePython(state)
}
