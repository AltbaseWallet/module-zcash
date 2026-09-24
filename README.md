# Zcash wallet module

Altbase 0.1.9 supports transparent mainnet ZEC accounts at `m/44'/133'/0'/0/0`. Keys and ZIP-244 transaction signatures remain local. Public UTXO, history, network and fee requests pass through the Altbase backend to TLS Electrum nodes.

The module builds NU6.3 version-5 transactions with branch ID `0x37a5165b`, a 20-block expiry window, and ZIP-317 conventional fees. The final ZIP-244 digest implementation is checked against official Zcash test vectors, including multiple transparent inputs. MAX is bounded to 200 inputs per transaction and reports the remainder.

Supported destinations are transparent t1/t3 addresses. Unified and shielded addresses, shielded balances, memos, and shielded transfers are not supported. This limitation does not mean a shielded balance is zero; it is outside this module's account model.

[ZIP-258](https://zips.z.cash/zip-0258) activates NU6.3 at mainnet height 3,428,143. [ZIP-229](https://zips.z.cash/zip-0229) retains the v5 format and its ZIP-244 digest algorithm. The signer rejects older or invalid heights and explicitly sets the current branch because the pinned SDK does not yet name NU6.3. Fixtures cover both historical NU6.2 and current NU6.3 against the official Python reference.
