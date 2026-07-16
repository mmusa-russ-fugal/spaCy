import React, { type ComponentType } from 'react'

import Link from '../components/link'
import { InlineCode } from '../components/inlineCode'
import { Table as TableUntyped, Tr, Th, Td as TdUntyped } from '../components/table'
import { Ul, Li } from '../components/list'
import InfoboxUntyped from '../components/infobox'
import { github, join } from '../components/util'
import type {
    InfoboxProps,
    LanguageDependency,
    LanguageInfo,
    LanguageRowProps,
    TableProps,
    TdProps,
} from '../types'

// `table.js` / `infobox.js` are not converted yet; their inferred props mark
// every prop required, so type them via the curated props at this boundary.
const Table = TableUntyped as ComponentType<TableProps>
const Td = TdUntyped as ComponentType<TdProps>
const Infobox = InfoboxUntyped as ComponentType<InfoboxProps>

import models from '../../meta/languages.json'

const Language = ({ name, code, models }: LanguageRowProps) => (
    <Tr>
        <Td>{name}</Td>
        <Td>
            <InlineCode>{code}</InlineCode>
        </Td>
        <Td>
            <Link to={github(`spacy/lang/${code}`)}>
                <InlineCode>lang/{code}</InlineCode>
            </Link>
        </Td>
        <Td>
            {models && models.length ? (
                <Link to={`/models/${code}`}>
                    {models.length} {models.length === 1 ? 'package' : 'packages'}
                </Link>
            ) : (
                <em>none yet</em>
            )}
        </Td>
    </Tr>
)

const Languages = () => {
    const langs: LanguageInfo[] = models.languages
    const withModels = langs
        .filter(({ models }) => models && !!models.length)
        .sort((a, b) => a.name.localeCompare(b.name))
    const withoutModels = langs
        .filter(({ models }) => !models || !models.length)
        .sort((a, b) => a.name.localeCompare(b.name))
    const withDeps = langs.filter(
        (lang): lang is LanguageInfo & { dependencies: LanguageDependency[] } =>
            !!(lang.dependencies && lang.dependencies.length)
    )
    return (
        <>
            <Table>
                <thead>
                    <Tr>
                        <Th>Language</Th>
                        <Th>Code</Th>
                        <Th>Language Data</Th>
                        <Th>Pipelines</Th>
                    </Tr>
                </thead>
                <tbody>
                    {withModels.map((model) => (
                        <Language {...model} key={model.code} />
                    ))}
                    {withoutModels.map((model) => (
                        <Language {...model} key={model.code} />
                    ))}
                </tbody>
            </Table>
            <Infobox title="Dependencies">
                <p>Some language tokenizers require external dependencies.</p>
                <Ul>
                    {withDeps.map(({ code, name, dependencies }) => (
                        <Li key={code}>
                            <strong>{name}:</strong>{' '}
                            {join(
                                dependencies.map((dep, i) => (
                                    <Link key={i} to={dep.url}>
                                        {dep.name}
                                    </Link>
                                ))
                            )}
                        </Li>
                    ))}
                </Ul>
            </Infobox>
        </>
    )
}

export default Languages
