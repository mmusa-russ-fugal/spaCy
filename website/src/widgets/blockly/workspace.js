import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { COMPONENT_NAMES, BUILTIN_COMPONENTS } from './components'
import classes from '../../styles/blockly-pipeline.module.sass'

/**
 * Simple DOM-based workspace for the pipeline builder.
 *
 * This is the part of the widget the Blockly editor will replace: a
 * future BlocklyWorkspace component only has to implement the same
 * contract to be swapped in (in builder.js) without touching the widget
 * chrome, generators or presets:
 *
 *   ({ state, setState, preset }) => JSX
 *
 * state shape (kept in builder.js, consumed by generators.js):
 *   {
 *     lang: 'en',                  // language code for spacy.blank()
 *     base: 'en_core_web_sm'|null, // trained pipeline for spacy.load()
 *     pipeline: [{
 *       name: 'parser',            // component name in the pipeline
 *       factory: 'parser',         // registered factory name
 *       source: 'en_core_web_sm'|null, // sourced from a trained pipeline
 *       disabled: false,           // build: disable_pipe / config: frozen
 *       fromBase: false,           // already part of the loaded base
 *     }],
 *     placement: { arg: 'last'|'first'|'before'|'after', target: 'ner' },
 *   }
 */
export default function SimpleWorkspace({ state, setState, preset }) {
    const readOnly = preset.mode === 'tour'
    const isConfig = preset.mode === 'config'
    const isSnippet = preset.mode === 'snippet'

    const updateComponent = (index, update) => {
        const pipeline = state.pipeline.map((c, i) => (i === index ? { ...c, ...update } : c))
        setState({ ...state, pipeline })
    }

    const moveComponent = (index, delta) => {
        const target = index + delta
        if (target < 0 || target >= state.pipeline.length) return
        const pipeline = [...state.pipeline]
        ;[pipeline[index], pipeline[target]] = [pipeline[target], pipeline[index]]
        setState({ ...state, pipeline })
    }

    const removeComponent = (index) => {
        setState({ ...state, pipeline: state.pipeline.filter((_, i) => i !== index) })
    }

    const addComponent = (name) => {
        if (!name) return
        const component = { name, factory: name, source: null, disabled: false }
        setState({ ...state, pipeline: [...state.pipeline, component] })
    }

    const available = COMPONENT_NAMES.filter((name) => !state.pipeline.some((c) => c.name === name))
    const toggleTitle = isConfig ? 'Freeze component during training' : 'Disable component'
    const toggleLabel = isConfig ? 'freeze' : 'disable'

    return (
        <div className={classes['workspace']}>
            <div className={classes['track']}>
                <span className={classNames(classes['chip'], classes['tokenizer'])}>tokenizer</span>
                {state.pipeline.map((component, index) => (
                    <span
                        key={component.name}
                        className={classNames(classes['chip'], {
                            [classes['chip-disabled']]: component.disabled,
                            [classes['chip-sourced']]: !!component.source,
                        })}
                        title={describeComponent(component)}
                    >
                        <span className={classes['chip-name']}>{component.name}</span>
                        {!isSnippet && (
                            <button
                                className={classes['chip-button']}
                                title={toggleTitle}
                                aria-pressed={component.disabled}
                                onClick={() =>
                                    updateComponent(index, { disabled: !component.disabled })
                                }
                            >
                                {toggleLabel}
                            </button>
                        )}
                        {!readOnly && !isSnippet && (
                            <>
                                <button
                                    className={classes['chip-button']}
                                    title="Source from a trained pipeline instead of training from scratch"
                                    aria-pressed={!!component.source}
                                    onClick={() =>
                                        updateComponent(index, {
                                            source: component.source ? null : 'en_core_web_sm',
                                        })
                                    }
                                >
                                    source
                                </button>
                                <button
                                    className={classes['chip-button']}
                                    title="Move left"
                                    disabled={index === 0}
                                    onClick={() => moveComponent(index, -1)}
                                >
                                    &lsaquo;
                                </button>
                                <button
                                    className={classes['chip-button']}
                                    title="Move right"
                                    disabled={index === state.pipeline.length - 1}
                                    onClick={() => moveComponent(index, 1)}
                                >
                                    &rsaquo;
                                </button>
                                <button
                                    className={classes['chip-button']}
                                    title="Remove component"
                                    onClick={() => removeComponent(index)}
                                >
                                    &times;
                                </button>
                            </>
                        )}
                    </span>
                ))}
            </div>
            {!readOnly && !isSnippet && (
                <div className={classes['controls']}>
                    <label>
                        Add component:{' '}
                        <select
                            value=""
                            onChange={({ target }) => addComponent(target.value)}
                            aria-label="Add pipeline component"
                        >
                            <option value="">choose factory...</option>
                            {available.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}
            {isSnippet && (
                <SnippetControls
                    state={state}
                    setState={setState}
                    updateComponent={updateComponent}
                />
            )}
        </div>
    )
}

SimpleWorkspace.propTypes = {
    state: PropTypes.object.isRequired,
    setState: PropTypes.func.isRequired,
    preset: PropTypes.object.isRequired,
}

/**
 * Argument fields for the 'snippet' mode (/api/language#add_pipe): the
 * mutually-exclusive placement argument plus name= and source=. Only one
 * of before/after/first/last can be set, so placement is a single select
 * — matching the runtime validation described in the API docs.
 */
function SnippetControls({ state, setState, updateComponent }) {
    const component = state.pipeline[0]
    const placement = state.placement || { arg: 'last' }
    const setPlacement = (update) => setState({ ...state, placement: { ...placement, ...update } })
    const needsTarget = placement.arg === 'before' || placement.arg === 'after'
    return (
        <div className={classes['controls']}>
            <label>
                Factory:{' '}
                <select
                    value={component.factory}
                    onChange={({ target }) =>
                        updateComponent(0, { factory: target.value, name: target.value })
                    }
                >
                    {COMPONENT_NAMES.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Placement:{' '}
                <select
                    value={placement.arg}
                    onChange={({ target }) => setPlacement({ arg: target.value })}
                >
                    <option value="last">last (default)</option>
                    <option value="first">first</option>
                    <option value="before">before</option>
                    <option value="after">after</option>
                </select>
            </label>
            {needsTarget && (
                <label>
                    Target:{' '}
                    <input
                        type="text"
                        value={placement.target}
                        onChange={({ target }) => setPlacement({ target: target.value })}
                        aria-label="Component to insert before or after"
                    />
                </label>
            )}
            <label>
                <input
                    type="checkbox"
                    checked={!!component.source}
                    onChange={({ target }) =>
                        updateComponent(0, { source: target.checked ? 'en_core_web_sm' : null })
                    }
                />{' '}
                source from trained pipeline
            </label>
        </div>
    )
}

SnippetControls.propTypes = {
    state: PropTypes.object.isRequired,
    setState: PropTypes.func.isRequired,
    updateComponent: PropTypes.func.isRequired,
}

function describeComponent(component) {
    const meta = BUILTIN_COMPONENTS.find(({ name }) => name === component.factory)
    return meta ? meta.description : 'Custom pipeline component'
}
