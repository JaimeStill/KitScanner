import { BitMatrix } from '../../common/bit-matrix';

export enum DataMaskValues {
  DATA_MASK_000,
  DATA_MASK_001,
  DATA_MASK_010,
  DATA_MASK_011,
  DATA_MASK_100,
  DATA_MASK_101,
  DATA_MASK_110,
  DATA_MASK_111
}

export class DataMask {
  constructor(
    private value: DataMaskValues,
    private isMasked: (i: number, j: number) => boolean
  ) { }

  static values = new Map<DataMaskValues, DataMask>([
    [DataMaskValues.DATA_MASK_000, new DataMask(DataMaskValues.DATA_MASK_000, (i: number, j: number) => ((i + j) & 0x01) === 0)],
    [DataMaskValues.DATA_MASK_001, new DataMask(DataMaskValues.DATA_MASK_001, (i: number, j: number) => (i & 0x01) === 0)],
    [DataMaskValues.DATA_MASK_010, new DataMask(DataMaskValues.DATA_MASK_010, (i: number, j: number) => j % 3 === 0)],
    [DataMaskValues.DATA_MASK_011, new DataMask(DataMaskValues.DATA_MASK_011, (i: number, j: number) => (i + j) % 3 === 0)],
    [DataMaskValues.DATA_MASK_100, new DataMask(DataMaskValues.DATA_MASK_100, (i: number, j: number) => ((Math.floor(i / 2) + Math.floor(j / 3)) & 0x01) === 0)],
    [DataMaskValues.DATA_MASK_101, new DataMask(DataMaskValues.DATA_MASK_101, (i: number, j: number) => (i * j) % 6 === 0)],
    [DataMaskValues.DATA_MASK_110, new DataMask(DataMaskValues.DATA_MASK_110, (i: number, j: number) => ((i * j) % 6) < 3)],
    [DataMaskValues.DATA_MASK_111, new DataMask(DataMaskValues.DATA_MASK_111, (i: number, j: number) => ((i + j + ((i * j) % 3)) & 0x01) === 0)],
  ]);

  unmaskBitMatrix = (bits: BitMatrix, dimension: number) => {
    for (let i = 0; i < dimension; i++)
      for (let j = 0; j < dimension; j++)
        if (this.isMasked(i, j))
          bits.flip(j, i);
  }
}
