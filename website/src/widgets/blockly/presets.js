/**
 * Per-location configuration for the Blockly pipeline builder.
 *
 * Every docs page that embeds <BlocklyPipelineBuilder preset="..." /> has
 * exactly one entry here, so the MDX files stay free of configuration and
 * all integration-specific settings live in one place. See README.md in
 * this directory for the overall integration plan.
 *
 * Shared fields:
 *  - location:  docs page + anchor the preset is embedded at (for reference)
 *  - mode:      'tour' | 'build' | 'config' | 'snippet'
 *               tour    – compact, read-only walkthrough workspace
 *               build   – full editor generating Python (add_pipe) code
 *               config  – editor generating a config.cfg excerpt
 *               snippet – single add_pipe call with argument fields
 *  - output:    'python' | 'ini' – language of the generated code pane
 *  - toolbox:   block categories exposed in the Blockly toolbox
 *  - workspace: blocks pre-loaded into the editor on first render
 *  - height:    editor height in px (keep small enough not to dominate
 *               the surrounding prose)
 */

export const PRESETS = {
    /**
     * /usage/spacy-101#pipelines
     * Sits directly below the <Pipelines101 /> include and its pipeline
     * diagram. First-contact audience: the workspace mirrors the
     * en_core_web_sm pipeline from the diagram and is locked down (no
     * toolbox, no reordering, no add/remove) so readers can poke at the
     * concept — disabling components is still available — without being
     * dropped into a full editor. Links out to /usage/processing-pipelines
     * for the editable version.
     */
    'spacy-101': {
        location: '/usage/spacy-101#pipelines',
        mode: 'tour',
        output: 'python',
        toolbox: [],
        workspace: {
            lang: 'en',
            base: 'en_core_web_sm',
            pipeline: ['tok2vec', 'tagger', 'parser', 'ner', 'attribute_ruler', 'lemmatizer'],
        },
        height: 320,
    },

    /**
     * /usage/processing-pipelines#pipelines
     * The primary home of the widget, inside "Pipelines and built-in
     * components". Full toolbox of built-in component factories plus a
     * generic custom-component block. Generated Python shows
     * spacy.blank()/spacy.load() plus add_pipe() calls with placement
     * arguments, and reflects disable/exclude toggles — matching the
     * surrounding sections (#built-in, #disabling, #sourced-components).
     */
    'pipelines-overview': {
        location: '/usage/processing-pipelines#pipelines',
        mode: 'build',
        output: 'python',
        toolbox: ['pipeline', 'builtin-components', 'custom-components', 'placement', 'sourcing'],
        workspace: {
            lang: 'en',
            base: null,
            pipeline: ['tok2vec', 'parser'],
        },
        height: 480,
    },

    /**
     * /usage/training#config-components
     * Complements the <QuickstartTraining /> widget further up the page:
     * instead of checkboxes it lets readers compose the [components]
     * block visually. Component blocks carry a factory/source choice
     * (train from scratch vs. source from a trained pipeline vs. frozen
     * via [training.frozen_components]). Output is a config.cfg excerpt
     * (INI) with a download button, same UX as the quickstart download.
     */
    'training-config': {
        location: '/usage/training#config-components',
        mode: 'config',
        output: 'ini',
        toolbox: ['pipeline', 'builtin-components', 'sourcing', 'freezing'],
        workspace: {
            lang: 'en',
            base: null,
            // Mirrors the config.cfg example below the widget: tok2vec
            // trained from scratch, parser and ner sourced from a
            // trained pipeline
            pipeline: [
                { name: 'tok2vec' },
                { name: 'parser', source: 'en_core_web_sm' },
                { name: 'ner', source: 'en_core_web_sm' },
            ],
        },
        height: 480,
        download: 'config-excerpt.cfg',
    },

    /**
     * /api/language#add_pipe
     * Minimal single-block playground next to the add_pipe API table:
     * one component block with editable name/factory, the placement
     * select (before/after/first/last) and a source= toggle. Generates
     * the single nlp.add_pipe(...) call so readers can see how the
     * arguments combine. Placement is a single select, so a multi-arg
     * conflict (before + after etc.) can't be produced — no separate
     * error hint is needed. TODO: config= field, once the real editor
     * lands.
     */
    'api-add-pipe': {
        location: '/api/language#add_pipe',
        mode: 'snippet',
        output: 'python',
        toolbox: ['placement', 'sourcing'],
        workspace: {
            lang: 'en',
            base: 'en_core_web_sm',
            pipeline: ['entity_ruler'],
        },
        height: 260,
    },
}

export default PRESETS
