import { describe, expect, it } from '@jest/globals'
import { createWalletClient, http } from 'viem'
import { generateMnemonic, mnemonicToAccount, english } from 'viem/accounts'
import { mainnet } from 'viem/chains'
import { sign } from '../index'
import type { Signer } from '../lib/interfaces'

const mnemonic = generateMnemonic(english)
const account = mnemonicToAccount(mnemonic)

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http(),
})

describe('Sign method', () => {
  let token = ''

  it('generate token', async () => {
    token = await sign(
      (body) => client.signMessage({ account, message: body }),
      {
        domain: 'iq.wiki',
      },
    )

    expect(token).toBeTruthy()
  })

  it('generate token with defined expires_in (in params list)', async () => {
    token = await sign(
      (body) => client.signMessage({ account, message: body }),
      {
        expires_in: '1d',
      },
    )

    expect(token).toBeTruthy()
  })

  it('throw error because of invalid expires_in', async () => {
    await expect(
      sign(
        (body) =>
          client.signMessage({
            account,
            message: body,
          }),
        {
          domain: 'iq.wiki',
          expires_in: 'asd',
        },
      ),
    ).rejects.toThrowError()
  })

  it('throw error because of invalid chain_id', async () => {
    await expect(
      sign(
        (body) =>
          client.signMessage({
            account,
            message: body,
          }),
        {
          domain: 'iq.wiki',
          chain_id: 'ssssa23dsa' as unknown as number,
        },
      ),
    ).rejects.toThrowError()
  })

  it('throw error because of invalid uri', async () => {
    await expect(
      sign(
        (body) =>
          client.signMessage({
            account,
            message: body,
          }),
        {
          domain: 'iq.wiki',
          uri: 'local.com',
        },
      ),
    ).rejects.toThrowError()
  })

  it('generate token with defined expiration_time and should overwrite expires_in param', async () => {
    token = await sign(
      (body) => client.signMessage({ account, message: body }),
      {
        domain: 'iq.wiki',
        expiration_time: new Date(),
        expires_in: '1d',
      },
    )

    expect(token).toBeTruthy()
  })

  it('generate token with defined statement and domain', async () => {
    token = await sign(
      (body) => client.signMessage({ account, message: body }),
      {
        domain: 'iq.wiki',
        statement: 'Test',
        expiration_time: new Date(),
        expires_in: '1d',
        not_before: new Date(),
      },
    )

    expect(token).toBeTruthy()
  })

  it('generate token with defined statement without domain', async () => {
    token = await sign(
      (body) => client.signMessage({ account, message: body }),
      {
        expiration_time: new Date(),
        expires_in: '1d',
        statement: 'Test',
        not_before: new Date(),
      },
    )

    expect(token).toBeTruthy()
  })

  it('throw error signer must be a function', async () => {
    await expect(sign('qwe' as unknown as Signer)).rejects.toThrowError()
  })
})
