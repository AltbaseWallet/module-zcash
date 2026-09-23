'use strict'
const blake2b = require('@bitgo/blake2b')
const hash=(tag,...parts)=>Buffer.from(blake2b(32,null,null,Buffer.from(tag)).update(Buffer.concat(parts)).digest())
const u32=n=>{const b=Buffer.alloc(4);b.writeUInt32LE(n>>>0);return b}
const u64=n=>{const b=Buffer.alloc(8);b.writeBigUInt64LE(BigInt(n));return b}
const compact=n=>{if(n<253)return Buffer.from([n]);if(n<=65535){const b=Buffer.alloc(3);b[0]=253;b.writeUInt16LE(n,1);return b}return Buffer.concat([Buffer.from([254]),u32(n)])}
const vector=b=>Buffer.concat([compact(b.length),b])
// Final ZIP-244, SIGHASH_ALL, transparent transactions only. In particular this
// commits to ALL prevout amounts/scripts, as required by the final NU5 spec.
const signatureDigest=(tx,index,prevouts)=>{
  if(tx.version!==5 || !tx.overwintered || tx.ins.length!==prevouts.length || !tx.ins[index])throw new Error('Invalid transparent Zcash signing context')
  if(tx.joinsplits?.length || tx.vShieldedSpend?.length || tx.vShieldedOutput?.length || tx.orchardBundle)throw new Error('Shielded transactions require a shielded signer')
  const outpoint=input=>Buffer.concat([input.hash,u32(input.index)])
  const header=hash('ZTxIdHeadersHash',u32(tx.version|0x80000000),u32(tx.versionGroupId),u32(tx.consensusBranchId),u32(tx.locktime),u32(tx.expiryHeight))
  const transparent=hash('ZTxIdTranspaHash',Buffer.from([1]),
    hash('ZTxIdPrevoutHash',...tx.ins.map(outpoint)),
    hash('ZTxTrAmountsHash',...prevouts.map(p=>u64(p.value))),
    hash('ZTxTrScriptsHash',...prevouts.map(p=>vector(p.script))),
    hash('ZTxIdSequencHash',...tx.ins.map(input=>u32(input.sequence))),
    hash('ZTxIdOutputsHash',...tx.outs.map(out=>Buffer.concat([u64(out.value),vector(out.script)]))),
    hash('Zcash___TxInHash',outpoint(tx.ins[index]),u64(prevouts[index].value),vector(prevouts[index].script),u32(tx.ins[index].sequence)))
  return hash(Buffer.concat([Buffer.from('ZcashTxHash_'),u32(tx.consensusBranchId)]),header,transparent,hash('ZTxIdSaplingHash'),hash('ZTxIdOrchardHash'))
}
module.exports={signatureDigest}
