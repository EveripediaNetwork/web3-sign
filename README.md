# Web3 Signer

![](https://flat.badgen.net/github/release/EveripediaNetwork/web3-signer) ![](http://flat.badgen.net/github/tag/EveripediaNetwork/web3-signer) ![](http://flat.badgen.net/github/open-issues/EveripediaNetwork/web3-signer) ![](http://flat.badgen.net/npm/dt/@everipedia/web3-signer) ![](http://flat.badgen.net/packagephobia/publish/@everipedia/web3-signer) ![](http://flat.badgen.net/github/stars/EveripediaNetwork/web3-signer)

Web3 Signer is a library that allows you to authenticate a users using a signature. This library is a fork of [web3-token](https://www.npmjs.com/package/web3-token) which focus on making the library more lightweight. (6.8 MB -> 22.6 kB unpacked)

For more information check out the blog post written by [Miroslaw Shpak](https://medium.com/@bytesbay/you-dont-need-jwt-anymore-974aa6196976) on why you should use this library instead of JWT.

## 📖 Table of Contents

- [📖 Table of Contents](#-table-of-contents)
- [📦 Installation](#%EF%B8%8F-installation)
- [🔎 Package TL;DR](#-package-tldr)
- [⭐ Basic Usage](#-basic-usage)
- [💻 Example usage (Client side)](#-example-usage-client-side)
- [☁️ Example usage (Server side)](#%EF%B8%8F-example-usage-server-side)
- [⚙️ API](#-api)
  - [sign(signer, options)](#signsigner-options)
  - [verify(token)](#verifytoken)

## ⬇️ Installation

```bash
npm install @everipedia/web3-signer
```

## 🔎 Package TL;DR

The package gives you 2 functions:

- `sign` - signs the token using the provided signer
- `verify` - verifies the token using the provided signer

You can use these to create and verify tokens for authentication

## ⭐ Basic Usage

To sign the token you need to pass the signer and options to the sign function.

```javascript
import { sign } from "@everipedia/web3-signer";

const token = await sign(signer, {
  domain: "example.com",
  expires_in: "1d",
});
```

## 💻 Example usage (Client side)

Using [Web3](https://www.npmjs.com/package/web3) package:

```js
import Web3 from "web3";
import { sign } from "@everipedia/web3-signer";

// Connection to MetaMask wallet
const web3 = new Web3(ethereum);
await ethereum.request({ method: "eth_requestAccounts" });

// getting address from which we will sign message
const address = (await web3.eth.getAccounts())[0];

// generating a token with 1 day of expiration time
const token = await sign((msg) => web3.eth.personal.sign(msg, address), "1d");

// attaching token to authorization header ... for example
```

Using [Ethers](https://www.npmjs.com/package/ethers) package:

```js
import { ethers } from "ethers";
import { sign } from "@everipedia/web3-signer";

// Connection to MetaMask wallet
const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

// generating a token with 1 day of expiration time
const token = await sign(async (msg) => await signer.signMessage(msg), "1d");

// attaching token to authorization header ... for example
```

Using [Viem](https://viem.sh) Package:

```js
import { sign } from "@everipedia/web3-signer";
import { createWalletClient, custom, mainnet } from "viem";

const client = createWalletClient({
  account,
  chain: mainnet,
  transport: custom(window.ethereum),
});

const [address] = await client.getAddresses();

const token = await sign(
  (body) =>
    client.signMessage({
      account: address,
      message: body,
    }),
  "1d"
);
```

## ☁️ Example usage (Server side)

```js
const Web3Token = require("@everipedia/web3-signer");

// getting token from authorization header ... for example
const token = req.headers["Authorization"];

const { address, body } = await Web3Token.verify(token);

// now you can find that user by his address
// (better to do it case insensitive)
req.user = await User.findOne({ address });
```

To verify the token you need to pass the signer and token to the verify function.

```javascript
import { verify } from "@everipedia/web3-signer";

try {
  const { address, body } = await verify(token);
  // if you get address and body, the token is valid
} catch (error) {
  // if you get an error, the token is invalid
}
```

## ⚙️ API

### sign(signer, options)

| Name                      | Description                                                                                                      | Required                                     | Example                                                               |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------- |
| `signer`                  | A function that returns a promise with signature string eg: web3.personal.sign(`data`, `address`)                | `required`                                   | `(body) => web3.personal.sign(body, '0x23..1234')`                    |
| `options`                 | An options object or, if passed a string, will be used as an `expires_in` option                                 | `optional` (default: `'1d'`)                 | `{}` or `'1 day'`                                                     |
| `options.expires_in`      | A string that represents a time span ([see ms module](https://github.com/vercel/ms)) or a number of milliseconds | `optional` (default: `1d`)                   | `'1 day'`                                                             |
| `options.not_before`      | A date after which the token becomes usable                                                                      | `optional`                                   | `new Date('12-12-2012')`                                              |
| `options.expiration_time` | A date till when token is valid. Overwrites `expires_in` parameter                                               | `optional`                                   | `new Date('12-12-2012')`                                              |
| `options.statement`       | A human-readable ASCII assertion that the user will sign, and it must not contain `'\n'`                         | `optional`                                   | `'I accept the ServiceOrg Terms of Service: https://service.org/tos'` |
| `options.domain`          | Authority that is requesting the signing.                                                                        | `optional`(Unless verifier won't ask for it) | `'example.com'`                                                       |
| `options.nonce`           | A token used to prevent replay attacks, at least 8 alphanumeric characters.                                      | `optional`                                   | `12345678`                                                            |
| `options.request_id`      | A system-specific identifier that may be used to uniquely refer to the sign-in request.                          | `optional`                                   | `231`                                                                 |

### verify(token, options)

| Name             | Description                                    | Required   | Example                     |
| ---------------- | ---------------------------------------------- | ---------- | --------------------------- |
| `token`          | A token string that is generated from `sign()` | `required` | `...`                       |
| `options`        | An options object                              | `optional` | `{ domain: 'example.com' }` |
| `options.domain` | The domain you want to accept                  | `optional` | `'example.com'`             |
