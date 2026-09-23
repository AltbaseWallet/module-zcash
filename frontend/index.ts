import { defineCoinModule } from '../../../src/coin-modules/types'
export default defineCoinModule({
  id: 'zcash', name: 'Zcash', ticker: 'ZEC', networkId: 'zcash-mainnet',
  supportsMemo: false, satsPerCoin: 100000000, walletEngine: 'zcash-utxo', utxoReadProfile: 'electrum',
}, 'zcash-sdk')
