/**
 * Hand-written types for the GENERATED sibling module
 * `quickstart-training-generator.js`, which is rebuilt on every build (see
 * `setup/setup.sh`) by `setup/jinja_to_js.py` from
 * `spacy/cli/templates/quickstart_training.jinja` and is gitignored. Do NOT
 * edit the generated `.js`; keep this declaration in sync with the template's
 * context variables and the recommendations YAML instead.
 */

/** A recommended transformer for one `optimize` setting. */
export interface QuickstartTrainingTransformer {
    name: string
    size_factor: number
}

/**
 * One language's entry in `quickstart_training_recommendations.yml`, exported
 * as the `DATA` map (keyed by language code, plus `__default__`).
 */
export interface QuickstartTrainingRecommendation {
    word_vectors: string | null
    /** Keyed by the `optimize` setting (`efficiency` / `accuracy`). */
    transformer: Record<string, QuickstartTrainingTransformer> | null
    /** Not currently present in the recommendations YAML. */
    has_letters?: boolean
}

export const DATA: Record<string, QuickstartTrainingRecommendation>

/** The jinja template context consumed by the generated renderer. */
export interface QuickstartTrainingContext {
    lang: string
    components: string[]
    optimize: string
    hardware: string
    transformer_data: Record<string, QuickstartTrainingTransformer> | null
    word_vectors: string | null
    has_letters?: boolean
}

/** Render the quickstart training config (INI text) for the given context. */
export default function templateQuickstartTraining(ctx: QuickstartTrainingContext): string
