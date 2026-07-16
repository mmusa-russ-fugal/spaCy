import React, { type ComponentType } from 'react'

import Models from './models'

import ReadNextUntyped from '../components/readnext'
import Button from '../components/button'
import Grid from '../components/grid'
import TitleUntyped from '../components/title'
import FooterUntyped from '../components/footer'
import SidebarUntyped from '../components/sidebar'
import MainUntyped from '../components/main'
import { getCurrentSource, github } from '../components/util'
import type {
    DocsProps,
    FooterProps,
    MainProps,
    ModelsPageContext,
    ReadNextProps,
    SidebarProps,
    SidebarsData,
    TitleProps,
} from '../types'

import siteMetadata from '../../meta/site.json'
import sidebars from '../../meta/sidebars.json'
import { nightly, legacy } from '../../meta/dynamicMeta.mjs'
import { languagesSorted } from '../../meta/languageSorted'

// These components are not converted yet; their inferred props mark every
// prop required, so type them via the curated props at this boundary.
const ReadNext = ReadNextUntyped as ComponentType<ReadNextProps>
const Title = TitleUntyped as ComponentType<TitleProps>
const Footer = FooterUntyped as ComponentType<FooterProps>
const Sidebar = SidebarUntyped as ComponentType<SidebarProps>
const Main = MainUntyped as ComponentType<MainProps>

const Docs = ({ pageContext, children }: DocsProps) => {
    const {
        id,
        slug,
        title,
        section,
        teaser,
        source,
        tag,
        isIndex,
        next,
        menu,
        theme,
        version,
        apiDetails,
    } = pageContext
    const { modelsRepo } = siteMetadata
    const isModels = section === 'models'
    const sidebar = pageContext.sidebar
        ? { items: pageContext.sidebar }
        : (sidebars as SidebarsData).find((bar) => bar.section === section)
    let pageMenu = menu ? menu.map(([text, id]) => ({ text, id })) : []

    if (isModels) {
        // The models sidebar entry always exists in meta/sidebars.json, and
        // every language listed by languagesSorted has trained pipelines.
        sidebar!.items[1].items = languagesSorted.map((lang) => ({
            text: lang.name,
            url: `/models/${lang.code}`,
            isActive: id === lang.code,
            menu: lang.models!.map((model) => ({
                text: model,
                id: model,
            })),
        }))
    }
    const sourcePath = source ? github(source) : null
    const currentSource = getCurrentSource(slug, isIndex)

    const subFooter = (
        <Grid cols={2}>
            <div style={{ marginTop: 'var(--spacing-lg)' }}>
                {(!isModels || (isModels && isIndex)) && (
                    <Button to={currentSource} icon="code">
                        Suggest edits
                    </Button>
                )}
            </div>
            {next && <ReadNext title={next.title} to={next.slug} />}
        </Grid>
    )

    return (
        <>
            {sidebar && <Sidebar items={sidebar.items} pageMenu={pageMenu} slug={slug} />}
            <Main
                section={section}
                theme={nightly ? 'nightly' : legacy ? 'legacy' : (theme ?? 'blue')}
                sidebar
                asides
                wrapContent
                footer={<Footer />}
            >
                {isModels && !isIndex ? (
                    <Models pageContext={pageContext as ModelsPageContext} repo={modelsRepo}>
                        {subFooter}
                    </Models>
                ) : (
                    <>
                        <Title
                            title={title}
                            teaser={teaser}
                            source={sourcePath}
                            tag={tag}
                            version={version}
                            id="_title"
                            apiDetails={apiDetails}
                        />
                        {children}
                        {subFooter}
                    </>
                )}
            </Main>
        </>
    )
}

export default Docs
