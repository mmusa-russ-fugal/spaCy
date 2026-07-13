/**
 * Code generators for the pipeline builder. Pure functions from the
 * builder state (see workspace.js for the state contract) to the code
 * shown in the widget's output pane. When the Blockly editor lands,
 * its block generators should produce the same output — these functions
 * can then be driven by the Blockly workspace state instead of the
 * simple workspace, or be replaced by per-block Blockly generators.
 */

const quote = (value) => `"${value}"`

/**
 * Python output for the 'tour' and 'build' modes: create the nlp object
 * and add each component with nlp.add_pipe(), including source= for
 * sourced components and nlp.disable_pipe() for disabled ones.
 */
export function generatePython(state) {
    const sources = [...new Set(state.pipeline.map((c) => c.source).filter(Boolean))]
    const lines = ['import spacy', '']
    for (const source of sources) {
        lines.push(`source_${sourceVar(source)} = spacy.load(${quote(source)})`)
    }
    lines.push(
        state.base
            ? `nlp = spacy.load(${quote(state.base)})`
            : `nlp = spacy.blank(${quote(state.lang)})`
    )
    for (const component of state.pipeline) {
        // Components flagged fromBase are already part of the loaded
        // pipeline (tour mode), so no add_pipe call is generated for them
        if (component.fromBase) continue
        const args = [quote(component.name)]
        if (component.source) {
            args.push(`source=source_${sourceVar(component.source)}`)
        }
        lines.push(`nlp.add_pipe(${args.join(', ')})`)
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
 * config.cfg excerpt for the 'config' mode: [nlp] block with the pipeline
 * order, one [components.*] block per component (factory = trained from
 * scratch, source = copied from a trained pipeline) and, if any components
 * are frozen, the [training] block listing frozen_components.
 */
export function generateConfig(state) {
    const lines = ['[nlp]', `lang = ${quote(state.lang)}`]
    lines.push(`pipeline = [${state.pipeline.map((c) => quote(c.name)).join(',')}]`)
    lines.push('')
    lines.push('[components]')
    for (const component of state.pipeline) {
        lines.push('')
        lines.push(`[components.${component.name}]`)
        if (component.source) {
            lines.push(`source = ${quote(component.source)}`)
        } else {
            lines.push(`factory = ${quote(component.factory || component.name)}`)
        }
    }
    const frozen = state.pipeline.filter((c) => c.disabled)
    if (frozen.length) {
        lines.push('')
        lines.push('[training]')
        lines.push(`frozen_components = [${frozen.map((c) => quote(c.name)).join(',')}]`)
    }
    return lines.join('\n')
}

/**
 * Python output for the 'snippet' mode: a single nlp.add_pipe() call
 * combining the placement argument (before/after/first/last) with the
 * optional name= and source= arguments from the add_pipe API table.
 */
export function generateSnippet(state) {
    const component = state.pipeline[0]
    const placement = state.placement || { arg: 'last' }
    const lines = ['import spacy', '']
    if (component.source) {
        lines.push(`source_nlp = spacy.load(${quote(component.source)})`)
    }
    lines.push(`nlp = spacy.load(${quote(state.base || 'en_core_web_sm')})`)
    // With source= set, the first argument is the component's name in the
    // source pipeline, not its factory (see the source= row in the table
    // above)
    const args = [quote(component.source ? component.name : component.factory || component.name)]
    if (component.name !== component.factory && !component.source) {
        args.push(`name=${quote(component.name)}`)
    }
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

export function generate(state, preset) {
    if (preset.mode === 'snippet') return generateSnippet(state)
    if (preset.output === 'ini') return generateConfig(state)
    return generatePython(state)
}

function sourceVar(source) {
    return source.replace(/[^a-zA-Z0-9]/g, '_')
}

function formatPipeNames(state) {
    return `[${state.pipeline
        .filter((c) => !c.disabled)
        .map((c) => `'${c.name}'`)
        .join(', ')}]`
}
