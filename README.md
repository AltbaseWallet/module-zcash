# Zcash wallet module

Altbase 0.1.9 supports transparent mainnet ZEC accounts at `m/44'/133'/0'/0/0`. Keys and ZIP-244 transaction signatures remain local. Public UTXO, history, network and fee requests pass through the Altbase backend to TLS Electrum nodes.

The module builds NU6.2 version-5 transactions with branch ID `0x5437f330`, a 20-block expiry window, and ZIP-317 conventional fees. The final ZIP-244 digest implementation is checked against official Zcash test vectors, including multiple transparent inputs. MAX is bounded to 200 inputs per transaction and reports the remainder.

Supported destinations are transparent t1/t3 addresses. Unified and shielded addresses, shielded balances, memos, and shielded transfers are not supported. This limitation does not mean a shielded balance is zero; it is outside this module's account model.
