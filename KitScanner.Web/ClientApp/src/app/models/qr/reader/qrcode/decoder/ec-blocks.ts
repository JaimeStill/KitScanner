import { Ecb } from './ecb';

export class EcBlocks {
  private ecBlocks: Ecb[];

  constructor(private ecCodewordsPerBlock: number, ...ecBlocks: Ecb[]) {
    this.ecBlocks = ecBlocks;
  }

  getEcCodewordsPerBlock = () => this.ecCodewordsPerBlock;

  getNumBlocks = () => {
    let total = 0;

    for (const ecBlock of this.ecBlocks) {
      total += ecBlock.getCount();
    }

    return total;
  }

  getTotalEcCodeWords = () => this.ecCodewordsPerBlock * this.getNumBlocks();

  getEcBlocks = () => this.ecBlocks;
}
