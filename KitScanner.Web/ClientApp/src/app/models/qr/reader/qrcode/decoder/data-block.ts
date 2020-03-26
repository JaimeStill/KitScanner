import { EcBlocks } from './ec-blocks';
import { Ecb } from './ecb';
import { ErrorCorrectionLevel } from './error-correction-level';
import { Version } from './version';
import { IllegalArgumentException } from '../../exception/illegal-argument-exception';

export class DataBlock {
  private constructor(
    private numDataCodewords: number,
    private codewords: Uint8Array
  ) { }

  static getDataBlocks = (
    rawCodeWords: Uint8Array,
    version: Version,
    ecLevel: ErrorCorrectionLevel
  ): DataBlock[] => {
    if (rawCodeWords.length !== version.getTotalCodewords())
      throw new IllegalArgumentException();

    const ecBlocks: EcBlocks = version.getEcBlocksForLevel(ecLevel);

    let totalBlocks = 0;
    const ecBlockArray: Ecb[] = ecBlocks.getEcBlocks();

    for (const ecBlock of ecBlockArray)
      totalBlocks += ecBlock.getCount();

    const result = new Array<DataBlock>(totalBlocks);
    let numResultBlocks = 0;

    for (const ecBlock of ecBlockArray)
      for (let i = 0; i < ecBlock.getCount(); i++) {
        const numDataCodewords = ecBlock.getDataCodewords();
        const numBlockCodewords = ecBlocks.getEcCodewordsPerBlock() + numDataCodewords;
        result[numResultBlocks++] = new DataBlock(numDataCodewords, new Uint8Array(numBlockCodewords));
      }

    const shorterBlocksTotalCodewords = result[0].codewords.length;
    let longerBlocksStartAt = result.length - 1;
    while (longerBlocksStartAt >= 0) {
      const numCodewords = result[longerBlocksStartAt].codewords.length;

      if (numCodewords === shorterBlocksTotalCodewords)
        break;

      longerBlocksStartAt--;
    }

    longerBlocksStartAt++;

    const shorterBlocksNumDataCodewords = shorterBlocksTotalCodewords - ecBlocks.getEcCodewordsPerBlock();

    let rawCodeWordsOffset = 0;

    for (let i = 0; i < shorterBlocksNumDataCodewords; i++)
      for (let j = 0; j < numResultBlocks; j++)
        result[j].codewords[i] = rawCodeWords[rawCodeWordsOffset++];

    for (let j = longerBlocksStartAt; j < numResultBlocks; j++)
      result[j].codewords[shorterBlocksNumDataCodewords] = rawCodeWords[rawCodeWordsOffset++];

    const max = result[0].codewords.length;

    for (let i = shorterBlocksNumDataCodewords; i < max; i++)
      for (let j = 0; j < numResultBlocks; j++) {
        const iOffset = j < longerBlocksStartAt ? i : i + 1;
        result[j].codewords[iOffset] = rawCodeWords[rawCodeWordsOffset++];
      }

    return result;
  }

  getNumDataCodewords = () => this.numDataCodewords;
  getCodewords = () => this.codewords;
}
