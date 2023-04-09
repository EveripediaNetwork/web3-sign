import parseAsHeaders from 'parse-headers'

import { decrypt } from './decrypter'
import type { DecryptedBody, MessageSections, VerifyOpts } from './interfaces'

/**
 * Parses the lines of a message into an array of message sections.
 * @param lines - The lines of the message.
 * @returns An array of message sections.
 */
function splitSections(lines: string[]): MessageSections {
  const sections: MessageSections = [[]]
  for (const line of lines) {
    if (line === '') {
      sections.push([])
    } else {
      sections[sections.length - 1].push(line)
    }
  }
  return sections
}

/**
 * Extracts the domain from an array of message sections.
 * @param sections - An array of message sections.
 * @returns The domain, or `null` if it cannot be extracted.
 */
function extractTokenDomain(sections: MessageSections): string | null {
  const lastLine = sections[0][sections[0].length - 1]
  if (lastLine.endsWith(' wants you to sign in with your Ethereum account.')) {
    return lastLine
      .replace(' wants you to sign in with your Ethereum account.', '')
      .trim()
  }
  return null
}

/**
 * Extracts the statement from an array of message sections.
 * @param sections - An array of message sections.
 * @returns The statement, or `null` if it cannot be extracted.
 */
function extractTokenStatement(sections: MessageSections): string | null {
  if (sections.length === 2 && !extractTokenDomain(sections)) {
    return sections[0][0]
  }
  if (sections.length === 3) {
    return sections[1][0]
  }
  return null
}

/**
 * Parses the decrypted body of a token.
 * @param lines - The lines of the decrypted body.
 * @returns The parsed decrypted body.
 * @throws An error if the decrypted body is damaged.
 */
const parseBody = (lines: string[]): DecryptedBody => {
  const bodySections = splitSections(lines)
  const mainBodySection = bodySections[bodySections.length - 1].join('\n')
  const parsedHeaders = parseAsHeaders(mainBodySection) as any

  for (const key in parsedHeaders) {
    const hyphenatedKey = key.replace(/ /g, '-')
    parsedHeaders[hyphenatedKey] =
      parsedHeaders[key as keyof typeof parsedHeaders]
    if (hyphenatedKey !== key) {
      delete parsedHeaders[key]
    }
  }

  const tokenDomain = extractTokenDomain(bodySections)
  const tokenStatement = extractTokenStatement(bodySections)

  if (
    typeof parsedHeaders['issued-at'] === 'undefined' ||
    typeof parsedHeaders['expiration-time'] === 'undefined' ||
    typeof parsedHeaders['web3-token-version'] === 'undefined'
  ) {
    throw new Error('Decrypted body is damaged')
  }

  return {
    ...parsedHeaders,
    domain: tokenDomain || undefined,
    statement: tokenStatement || undefined,
  }
}

/**
 * Verifies a token.
 * @param token - The token to verify.
 * @param opts - The options for verifying the token.
 * @returns The verified token.
 * @throws An error if the token is expired, not yet valid, has an inappropriate domain, or is version 1.
 *
 * @example
 * ```ts
 * import { verify } from '@everipedia/web3-signer'
 *
 * try {
 * const {address, body} = await verify(token)
 * // if you get address and body, the token is valid
 * } catch (error) {
 *  // if you get an error, the token is invalid
 * }
 */
export const verify = async (token: string, opts: VerifyOpts = {}) => {
  const { version, address, body } = await decrypt(token)

  if (version === 1) {
    throw new Error(
      'Tokens version 1 are not supported by the current version of module',
    )
  }

  const lines = body.split('\n')
  const parsed_body = parseBody(lines)

  if (new Date(parsed_body['expiration-time']) < new Date()) {
    throw new Error('Token expired')
  }

  if (
    parsed_body['not-before'] &&
    new Date(parsed_body['not-before']) > new Date()
  ) {
    throw new Error("It's not yet time to use the token")
  }

  if (opts.domain && opts.domain !== parsed_body.domain) {
    throw new Error('Inappropriate token domain')
  }

  return { address, body: parsed_body }
}
