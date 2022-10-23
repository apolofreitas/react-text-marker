import {
  Children,
  cloneElement,
  createElement,
  ReactNode,
  useMemo,
} from 'react'

const escapeRegexp = (term: string): string =>
  term.replace(/[|\\{}()[\]^$+*?.-]/g, (char: string) => `\\${char}`)

function buildRegex(queries: string[]) {
  const query = queries
    .filter((text) => text.length !== 0)
    .map((text) => escapeRegexp(text.trim()))

  if (!query.length) return null

  return new RegExp(`(${query.join('|')})`, 'ig')
}

export type HighlightOptions = {
  element: ReactNode
  query: string | string[]
  renderMark?: (text: string) => ReactNode
  nestedElements?: boolean
}

function highlight({
  element,
  query,
  renderMark = (text) => createElement('mark', undefined, text),
  nestedElements = false,
}: HighlightOptions): ReactNode {
  const queries = Array.isArray(query) ? query : [query]
  const regex = buildRegex(queries)

  if (!regex) return element

  const children = Children.map(element, (child) => {
    if (!child) return null

    const text = typeof child === 'string' ? child : undefined

    if (text) {
      return text
        .split(regex)
        .filter(Boolean)
        .map((text) => (regex.test(text) ? renderMark(text) : text))
    }

    if (
      nestedElements &&
      typeof child === 'object' &&
      'props' in child &&
      child.props.children
    ) {
      const { children, ...props } = child?.props

      return cloneElement(
        child,
        props,
        highlight({
          element: children,
          query,
          renderMark,
          nestedElements,
        })
      )
    }

    return child
  })!

  return children
}

export function useHighlight({
  element,
  query,
  renderMark,
  nestedElements,
}: HighlightOptions) {
  return useMemo(
    () => highlight({ element, query, renderMark, nestedElements }),
    [element, query, renderMark, nestedElements]
  )
}
