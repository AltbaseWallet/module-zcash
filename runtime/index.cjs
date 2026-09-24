'use strict'
const u = require('@bitgo/utxo-lib')
const { mnemonicToSeedSync, validateMnemonic } = require('@scure/bip39')
const { wordlist } = require('@scure/bip39/wordlists/english')
const { select, publicPlan } = require('../../../src/wallet-engines/sdk/planner.cjs')
const { signatureDigest } = require('./zip244.cjs')
const network = u.networks.zcash
const script = address => {
  if (typeof address !== 'string' || address.length>200) throw new Error('Invalid Zcash address')
  // Transparent t1/t3 recipients. Unified/shielded recipients require a shielded engine.
  return u.address.toOutputScript(address,network)
}
const keyFor = mnemonic => {
  if (!validateMnemonic(mnemonic,wordlist)) throw new Error('Invalid recovery phrase')
  const seed=Buffer.from(mnemonicToSeedSync(mnemonic))
  try { return u.bip32.fromSeed(seed,network).derivePath("m/44'/133'/0'/0/0") }
  finally { seed.fill(0) }
}
const addressFor = key => u.address.fromOutputScript(u.payments.p2pkh({pubkey:key.publicKey}).output,network)
const plan = p => {
  const own=script(p.fromAddress).toString('hex');script(p.toAddress||p.fromAddress)
  return select(p,{decimals:8,dust:546n,
    // ZIP-317 conventional fee for transparent P2PKH inputs and t1/t3 outputs.
    feeFor:(inputs,outputs)=>5000n*BigInt(Math.max(2,inputs,outputs)),
    validateUtxo:r=>{
      if (!/^[0-9a-f]{64}$/i.test(r.txid)||!Number.isSafeInteger(r.outputIndex)||r.outputIndex<0||r.outputIndex>0xffffffff) throw new Error('Invalid Zcash outpoint')
      if (String(r.script).toLowerCase()!==own) throw new Error('UTXO does not belong to the selected address')
      return `${r.txid}:${r.outputIndex}`
    }})
}
const sign = p => {
  const key=keyFor(p.mnemonic)
  try {
    if (addressFor(key)!==p.fromAddress) throw new Error('Signing key does not match the source address')
    if (!Number.isSafeInteger(p.height)||p.height<3428143||p.height>0xffffffff-20) throw new Error('A current Zcash NU6.3 network height is required')
    const selected=plan(p)
    if (p.sendMax && p.amountCoin!==selected.amountCoin) throw new Error('MAX amount changed; review it again before confirming')
    const builder=u.bitgo.createTransactionBuilderForNetwork(network)
    // ZIP-229 retains v5 and ZIP-244 under NU6.3. The SDK's newest named
    // branch is NU6.2, so set the current mainnet branch explicitly (ZIP-258).
    builder.setVersion(5)
    builder.setVersionGroupId(0x26a7270a)
    builder.setConsensusBranchId(0x37a5165b)
    builder.setExpiryHeight(p.height+20)
    const prevScript=script(p.fromAddress)
    for(const row of selected.selected) builder.addInput(row.txid,row.outputIndex,0xffffffff,prevScript)
    builder.addOutput(script(p.toAddress),selected.amount)
    if(selected.change) builder.addOutput(prevScript,selected.change)
    const tx=builder.buildIncomplete()
    const prevouts=selected.selected.map(row=>({value:row.value,script:prevScript}))
    for(let i=0;i<selected.selected.length;i++) {
      const digest=signatureDigest(tx,i,prevouts)
      const signature=key.sign(digest)
      if(!key.verify(digest,signature))throw new Error('Zcash signature verification failed')
      tx.ins[i].script=u.script.compile([u.script.signature.encode(signature,u.Transaction.SIGHASH_ALL),key.publicKey])
    }
    return {...publicPlan(selected),hex:tx.toHex(),txid:tx.getId()}
  } finally { if(key.privateKey) key.privateKey.fill(0) }
}
module.exports={
  derive:p=>{const key=keyFor(p.mnemonic);try{return{address:addressFor(key)}}finally{if(key.privateKey)key.privateKey.fill(0)}},
  validate:p=>{try{script(p.address);return{valid:true}}catch{return{valid:false}}},
  plan:p=>publicPlan(plan(p)),sign,
  export:p=>{const key=keyFor(p.mnemonic);try{return{secret:key.toWIF()}}finally{if(key.privateKey)key.privateKey.fill(0)}},
}
