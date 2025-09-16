import { ethers } from 'hardhat';
import fs from 'node:fs';
async function main(){
  const cfg = JSON.parse(fs.readFileSync('packages/contracts/deploy-params.json','utf8'));
  const C = await ethers.getContractFactory('Hyper721A');
  const c = await C.deploy(
    cfg.name, cfg.symbol, cfg.maxSupply, cfg.priceWei,
    cfg.maxPerWallet, cfg.maxPerTx,
    cfg.royaltyReceiver, cfg.royaltyBps,
    cfg.feeRecipient, cfg.feeBps, cfg.placeholderURI
  );
  await c.deployed();
  console.log('Hyper721A deployed:', c.address);
}
main().catch((e)=>{ console.error(e); process.exit(1); });
