import Base64 from 'base-64';

import type { SignBody, Signer, SignOpts } from './interfaces';
import { timeSpan } from './timespan';
import { isDate, isNumber, isURL, isValidDomain, isValidString } from './utils';

/**
 * Sign a token
 * @param signer - A function that returns a signature string (Promise<string>)
 * @param opts - Options to sign the token
 * @returns A signed token
 * @example
 * ```ts
 * import { sign } from 'web3-signer';
 *
 * const token = await sign(signer, {
 *  domain: 'example.com',
 *  expires_in: '1d',
 * });
 * ```
 *
 * More examples refer to [README.md](https://github.com/EveripediaNetwork/web3-signer/blob/master/README.md)
 **/
export const sign = async (
  signer: Signer,
  opts: string | SignOpts = '1d'
): Promise<string> => {
  const params = typeof opts === 'string' ? { expires_in: opts } : opts;

  validateParams(params);

  const body = processParams(params);
  const msg = buildMessage(body);
  const signature = await signer(msg);

  if (typeof signature !== 'string') {
    throw new Error(
      '"signer" argument should be a function that returns a signature string (Promise<string>)'
    );
  }

  const token = Base64.encode(JSON.stringify({ signature, body: msg }));

  return token;
};

/**
 * Validate params
 * @param params - Params to validate
 * @returns void
 * @throws Error if params are invalid
 **/
const validateParams = (params: SignOpts): void => {
  for (const key in params) {
    const value = params[key as keyof SignOpts];
    if (typeof value === 'string' && /\n/.test(value)) {
      throw new Error(`"${key}" option cannot have LF (\\n)`);
    }
  }

  if (params.domain !== undefined) {
    const domain = params.domain as unknown;
    if (!isValidString(domain) || !isValidDomain(domain)) {
      throw new Error('Invalid domain format (must be example.com)');
    }
  }

  if (params.uri !== undefined) {
    const uri = params.uri as unknown;
    if (!isValidString(uri) || !isURL(uri)) {
      throw new Error('Invalid uri format (must be https://example.com/login)');
    }
  }

  if (params.chain_id !== undefined) {
    const chainId = params.chain_id as unknown;
    if (!isNumber(chainId)) {
      throw new Error('chain_id must be an int');
    }
  }

  if (params.expiration_time !== undefined) {
    const expirationTime = params.expiration_time as unknown;
    if (!isDate(expirationTime)) {
      throw new Error('expiration_time must be an instance of Date');
    }
  }

  if (params.not_before !== undefined) {
    const notBefore = params.not_before as unknown;
    if (!isDate(notBefore)) {
      throw new Error('not_before must be an instance of Date');
    }
  }
};

/**
 * Process params
 * @param params - Params to process
 * @returns Processed params
 **/
const processParams = (params: SignOpts): SignBody => {
  const body: SignBody = {
    web3_token_version: '2',
    issued_at: new Date(),
    expiration_time: params.expiration_time
      ? new Date(params.expiration_time)
      : params.expires_in
      ? timeSpan(params.expires_in)
      : timeSpan('1d'),
    not_before: params.not_before ? new Date(params.not_before) : undefined,
    chain_id: params.chain_id ? parseInt(String(params.chain_id)) : undefined,
    uri:
      params.uri ||
      (typeof window !== 'undefined' && window.location?.href) ||
      undefined,
    nonce: params.nonce
      ? parseInt(String(Math.random() * 99999999))
      : undefined,
    request_id: params.request_id,
    domain: params.domain,
    statement: params.statement,
  };
  return body;
};

/**
 * Build message
 * @param params - Params to build message
 * @returns Message
 **/
const buildMessage = (params: SignBody): string => {
  const message: string[] = [];

  if (params.domain) {
    message.push(
      `${params.domain} wants you to sign in with your Ethereum account.`
    );
    message.push('');
  }

  if (params.statement) {
    message.push(params.statement);
    message.push('');
  }

  const paramLabels = {
    URI: params.uri,
    'Web3 Token Version': params.web3_token_version,
    'Chain ID': params.chain_id,
    Nonce: params.nonce,
    'Issued At': params.issued_at.toISOString(),
    'Expiration Time': params.expiration_time.toISOString(),
    'Not Before': params.not_before
      ? params.not_before.toISOString()
      : undefined,
    'Request ID': params.request_id,
  };

  for (const label in paramLabels) {
    const value = paramLabels[label as keyof typeof paramLabels];
    if (value !== undefined) {
      message.push(`${label}: ${value}`);
    }
  }

  return message.join('\n');
};
