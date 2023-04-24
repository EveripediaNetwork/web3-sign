import { describe, expect, it } from '@jest/globals'
import { createWalletClient, http } from 'viem'
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { sign } from '../index'

import { verify } from '../index'

const mnemonic = generateMnemonic(english)
const account = mnemonicToAccount(mnemonic)

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
})

const defaultOptions = {
  domain: 'iq.wiki',
  statement: 'Test',
  expiration_time: new Date(Date.now() + 3600 * 1000),
  not_before: new Date(Date.now() - 1),
}

describe('Verify method', () => {
  const real_address = client.account.address.toLowerCase()

  it.skip('must verify a signature', async () => {
    const token = await sign(
      (body) => client.signMessage({ account, message: body }),
      defaultOptions,
    )

    const { address, body } = await verify(token)
    expect(address).toEqual(real_address)
    expect(body['statement']).toEqual(defaultOptions.statement)
    expect(body['domain']).toEqual(defaultOptions.domain)
  })

  it('must throw an error coz of past expiration_time', async () => {
    const token = await sign(
      (body) => client.signMessage({ account, message: body }),
      {
        ...defaultOptions,
        expiration_time: new Date(Date.now() - 1),
      },
    )

    try {
      await verify(token)
    } catch (error: any) {
      expect(error.message).toEqual('Token expired')
    }
  })

  it('must throw an error coz of future not_before date', async () => {
    const token = await sign(
      (body) => client.signMessage({ account, message: body }),
      {
        ...defaultOptions,
        not_before: new Date(Date.now() + 3600 * 1000),
      },
    )

    try {
      await verify(token)
    } catch (error: any) {
      expect(error.message).toEqual("It's not yet time to use the token")
    }
  })

  it('must throw an error coz of diff domains', async () => {
    const token = await sign(
      (body) => client.signMessage({ account, message: body }),
      defaultOptions,
    )

    try {
      await verify(token, { domain: 'some-other.domain' })
    } catch (error: any) {
      expect(error.message).toEqual('Inappropriate token domain')
    }
  })

  it('must throw error of malformed token', async () => {
    try {
      await verify('MALFORMED_TOKEN')
    } catch (error: any) {
      expect(error.message).toEqual(
        'Invalid character: the string to be decoded is not correctly encoded.',
      )
    }
  })
})
