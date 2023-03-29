import parseAsHeaders from 'parse-headers';

import { decrypt } from './decrypter';
import { DecryptedBody, MessageSections, VerifyOpts } from './interfaces';

const getDomain = (sections: MessageSections): string | null => {
  if (
    / wants you to sign in with your Ethereum account\.$/.test(sections[0][0])
  ) {
    return sections[0][0]
      .replace(' wants you to sign in with your Ethereum account.', '')
      .trim();
  }
  return null;
};

const splitSections = (lines: string[]): MessageSections => {
  const sections: MessageSections = [[]];
  let section_number = 0;
  for (const line of lines) {
    sections[section_number].push(line);
    if (line === '') {
      section_number++;
      sections.push([]);
    }
  }

  return sections;
};

const getStatement = (sections: MessageSections): string | null => {
  if (sections.length === 2) {
    const has_domain = !!getDomain(sections);

    if (!has_domain) {
      return sections[0][0];
    }
  } else if (sections.length === 3) {
    return sections[1][0];
  }
  return null;
};

const parseBody = (lines: string[]): DecryptedBody => {
  const sections = splitSections(lines);
  const main_section = sections[sections.length - 1].join('\n');
  const parsed_body = parseAsHeaders(main_section) as any;

  for (const key in parsed_body) {
    const new_key = key.replace(/ /g, '-');
    parsed_body[new_key] = parsed_body[key];
    if (new_key !== key) {
      delete parsed_body[key];
    }
  }

  const domain = getDomain(sections);
  const statement = getStatement(sections);

  if (typeof domain !== 'undefined') {
    parsed_body.domain = domain;
  }

  if (typeof statement !== 'undefined') {
    parsed_body.statement = statement;
  }

  if (
    typeof parsed_body['issued-at'] === 'undefined' ||
    typeof parsed_body['expiration-time'] === 'undefined' ||
    typeof parsed_body['web3-token-version'] === 'undefined'
  ) {
    throw new Error('Decrypted body is damaged');
  }

  return parsed_body;
};

export const verify = (token: string, opts: VerifyOpts = {}) => {
  const { version, address, body } = decrypt(token);

  if (version === 1) {
    throw new Error(
      'Tokens version 1 are not supported by the current version of module'
    );
  }

  const lines = body.split('\n');

  const parsed_body = parseBody(lines);

  if (new Date(parsed_body['expiration-time']) < new Date()) {
    throw new Error('Token expired');
  }

  if (
    parsed_body['not-before'] &&
    new Date(parsed_body['not-before']) > new Date()
  ) {
    throw new Error("It's not yet time to use the token");
  }

  if (opts.domain && opts.domain !== parsed_body.domain) {
    throw new Error('Inappropriate token domain');
  }

  return { address, body: parsed_body };
};
