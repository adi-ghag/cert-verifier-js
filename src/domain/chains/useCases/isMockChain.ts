import { BLOCKCHAINS } from '@adityaghag/explorer-lookup';
import type { IBlockchainObject } from '@adityaghag/explorer-lookup';

export default function isMockChain (chain: IBlockchainObject): boolean {
  if (chain) {
    const chainCode = typeof chain === 'string' ? chain : chain.code; // TODO: can it be string?
    const isChainValid = Object.keys(BLOCKCHAINS).some(chainObj => chainObj === chainCode);

    if (!isChainValid) {
      return false;
    }

    return !!BLOCKCHAINS[chainCode].test;
  }

  return false;
}
