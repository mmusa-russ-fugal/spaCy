import { Parser as HtmlToReactParser } from 'html-to-react'

const htmlToReactParser = new HtmlToReactParser()

/**
 * Convert raw HTML to React elements
 * @param props.children - The HTML markup to convert.
 * @returns The converted React elements.
 */
export default function HtmlToReact(props: { children: string }) {
    return htmlToReactParser.parse(props.children)
}
