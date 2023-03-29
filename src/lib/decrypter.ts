import Base64 from 'base-64';
import { recoverMessageAddress } from 'viem/utils';

import { DecrypterResult } from './interfaces';

const getVersion = (body: string): number => {
  const match = body.match(/Web3[\s-]+Token[\s-]+Version: \d/);
  if (!match || !match.length) {
    throw new Error('Token malformed (missing version)');
  }

  return Number(match[0].replace(' ', '').split(':')[1]);
};

export const decrypt = (token: string): DecrypterResult => {
  if (!token || !token.length) {
    throw new Error('Token required.');
  }

  const base64_decoded = Base64.decode(token);

  if (!base64_decoded || !base64_decoded.length) {
    throw new Error('Token malformed (must be base64 encoded)');
  }

  let body: string, signature: string;

  try {
    ({ body, signature } = JSON.parse(base64_decoded));
  } catch (error) {
    throw new Error('Token malformed (unparsable JSON)');
  }

  if (!body || !body.length) {
    throw new Error('Token malformed (empty message)');
  }

  if (!signature || !signature.length) {
    throw new Error('Token malformed (empty signature)');
  }

  const signatureBuffer = Buffer.from(signature.slice(2), 'hex');

  const address = recoverMessageAddress({
    message: body,
    signature: signatureBuffer,
  });

  const version = getVersion(body);

  return {
    version,
    address: address.toLowerCase(),
    body,
    signature,
  };
};
