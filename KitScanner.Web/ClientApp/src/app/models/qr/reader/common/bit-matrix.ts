import { BitArray } from './bit-array';
import { IllegalArgumentException } from '../exception/illegal-argument-exception';
import { Arrays } from '../util/arrays';
import { System } from '../util/system';

export class BitMatrix {
  constructor(
    private width: number,
    private height?: number,
    private rowSize?: number,
    private bits?: Int32Array
  ) {
    if (undefined === height || null === height)
      height = width;

    this.height = height;

    if (width < 1 || height < 1)
      throw new IllegalArgumentException('Both dimensions must be greater than 0');

    if (undefined === rowSize || null === rowSize)
      rowSize = Math.floor((width + 31) / 32);

    this.rowSize = rowSize;

    if (undefined === bits || null === bits)
      this.bits = new Int32Array(this.rowSize * this.height);
  }

  static parseFromBooleanArray = (image: boolean[][]): BitMatrix => {
    const height = image.length;
    const width = image[0].length;
    const bits = new BitMatrix(width, height);

    for (let i = 0; i < height; i++) {
      const imageI = image[i];
      for (let j = 0; j < width; j++) {
        if (imageI[j]) {
          bits.set(j, i);
        }
      }
    }

    return bits;
  }

  static parseFromString = (stringRepresentation: string, setString: string, unsetString: string): BitMatrix => {
    if (stringRepresentation === null)
      throw new IllegalArgumentException('stringRepresentation cannot be null');

    const bits = new Array<boolean>(stringRepresentation.length);
    let bitsPos = 0;
    let rowStartPos = 0;
    let rowLength = -1;
    let nRows = 0;
    let pos = 0;

    while (pos < stringRepresentation.length) {
      if (stringRepresentation.charAt(pos) === '\n' || stringRepresentation.charAt(pos) === '\r') {
        if (bitsPos > rowStartPos) {
          if (rowLength === -1) {
            rowLength = bitsPos - rowStartPos;
          } else if (bitsPos - rowStartPos !== rowLength) {
            throw new IllegalArgumentException('Row lengths do not match');
          }
          rowStartPos = bitsPos;
          nRows++;
        }
        pos++;
      } else if (stringRepresentation.substring(pos, pos + setString.length) === setString) {
        pos += setString.length
        bits[bitsPos] = true;
        bitsPos++;
      } else if (stringRepresentation.substring(pos, pos + unsetString.length) === unsetString) {
        pos += unsetString.length;
        bits[bitsPos] = false;
        bitsPos++;
      } else {
        throw new IllegalArgumentException(`Illegal character encountered: ${stringRepresentation.substring(pos)}`);
      }
    }

    if (bitsPos > rowStartPos) {
      if (rowLength === -1) {
        rowLength = bitsPos - rowStartPos;
      } else if (bitsPos - rowStartPos !== rowLength)
        throw new IllegalArgumentException('Row lengths do not match');
      nRows++;
    }

    const matrix = new BitMatrix(rowLength, nRows);

    for (let i = 0; i < bitsPos; i++)
      if (bits[i])
        matrix.set(Math.floor(i % rowLength), Math.floor(i / rowLength));

    return matrix;
  }

  get = (x: number, y: number): boolean => {
    const offset = y * this.rowSize + Math.floor(x / 32);
    return ((this.bits[offset] >>> (x & 0x1f)) & 1) !== 0;
  }

  set = (x: number, y: number) => {
    const offset = y * this.rowSize + Math.floor(x / 32);
    this.bits[offset] |= (1 << (x & 0x1f)) & 0xFFFFFFFF;
  }

  unset = (x: number, y: number) => {
    const offset = y * this.rowSize + Math.floor(x / 32);
    this.bits[offset] &= ~((1 << (x & 0x1f)) & 0xFFFFFFFF);
  }

  public flip = (x: number, y: number) => {
    const offset = y * this.rowSize + Math.floor(x / 32);
    this.bits[offset] ^= ((1 << (x & 0x1f)) & 0xFFFFFFFF);
  }

  xor = (mask: BitMatrix) => {
    if (this.width !== mask.getWidth() || this.height !== mask.getHeight() || this.rowSize !== mask.getRowSize())
      throw new IllegalArgumentException('Input matrix dimensions do not match');

    const rowArray = new BitArray(Math.floor(this.width / 32) + 1);

    for (let y = 0; y < this.height; y++) {
      const offset = y * this.rowSize;
      const row = mask.getRow(y, rowArray).getBitArray();

      for (let x = 0; x < this.rowSize; x++)
        this.bits[offset + x] ^= row[x];
    }
  }

  clear = () => {
    for (let i = 0; i < this.bits.length; i++)
      this.bits[i] = 0;
  }

  public setRegion = (left: number, top: number, width: number, height: number) => {
    if (top < 0 || left < 0)
      throw new IllegalArgumentException('Left and top must be non-negative');

    if (height < 1 || width < 1)
      throw new IllegalArgumentException('Height and width must be greater than zero');

    const right = left + width;
    const bottom = top + height;

    if (bottom > this.height || right > this.width)
      throw new IllegalArgumentException('The region must fit inside the matrix');

    for (let y = top; y < bottom; y++) {
      const offset = y * this.rowSize;
      for (let x = left; x < right; x++)
        this.bits[offset + Math.floor(x / 32)] |= ((1 << (x & 0x1f)) & 0xFFFFFFFF);
    }
  }

  getRow = (y: number, row?: BitArray): BitArray => {
    if (row === null || row === undefined || row.getSize() < this.width)
      row = new BitArray(this.width);
    else
      row.clear();

    const offset = y * this.rowSize;

    for (let x = 0; x < this.rowSize; x++)
      row.setBulk(x * 32, this.bits[offset + x]);

    return row;
  }

  setRow = (y: number, row: BitArray) => System.arraycopy(row.getBitArray(), 0, this.bits, y * this.rowSize, this.rowSize);

  rotate180 = () => {
    const width = this.getWidth();
    const height = this.getHeight();

    let topRow = new BitArray(width);
    let bottomRow = new BitArray(width);

    for (let i = 0, length = Math.floor((height + 1) / 2); i < length; i++) {
      topRow = this.getRow(i, topRow);
      bottomRow = this.getRow(height - 1 - i, bottomRow);
      topRow.reverse();
      bottomRow.reverse();
      this.setRow(i, bottomRow);
      this.setRow(height - 1 - i, topRow);
    }
  }

  getEnclosingRectangle = () => {
    let left = this.width;
    let top = this.height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < this.height; y++)
      for (let x32 = 0; x32 < this.rowSize; x32++) {
        const theBits = this.bits[y * this.rowSize + x32];

        if (theBits !== 0) {
          if (y < top)
            top = y;

          if (y > bottom)
            bottom = y;

          if (x32 * 32 < left) {
            let bit = 0;
            while (((theBits << (31 - bit)) & 0xFFFFFFFF) === 0)
              bit++;

            if ((x32 * 32 + bit) < left)
              left = x32 * 32 + bit;
          }

          if (x32 * 32 + 31 > right) {
            let bit = 31;
            while ((theBits >>> bit) === 0)
              bit--;

            if ((x32 * 32 + bit) > right)
              right = x32 * 32 + bit;
          }
        }
      }

      if (right < left || bottom < top)
        return null;

      return Int32Array.from([left, top, right - left + 1, bottom - top + 1]);
  }

  getTopLeftOnBit = (): Int32Array => {
    let bitsOffset = 0;

    while (bitsOffset < this.bits.length && this.bits[bitsOffset] === 0)
      bitsOffset++;

    if (bitsOffset === this.bits.length)
      return null;

    const y = bitsOffset / this.rowSize;
    let x = (bitsOffset % this.rowSize) * 32;

    const theBits = this.bits[bitsOffset];
    let bit = 0;

    while (((theBits << (31 - bit)) & 0xFFFFFFFF) === 0)
      bit++;

    x += bit;
    return Int32Array.from([x, y]);
  }

  getBottomRightOnBit = (): Int32Array => {
    let bitsOffset = this.bits.length - 1;

    while (bitsOffset >= 0 && this.bits[bitsOffset] === 0)
      bitsOffset--;

    if (bitsOffset < 0)
      return null;

    const y = Math.floor(bitsOffset / this.rowSize);
    let x = Math.floor(bitsOffset % this.rowSize) * 32;

    const theBits = this.bits[bitsOffset];
    let bit = 31;

    while ((theBits >>> bit) === 0)
      bit--;

    x += bit;
    return Int32Array.from([x, y]);
  }

  getWidth = () => this.width;
  getHeight = () => this.height;
  getRowSize = () => this.rowSize;

  equals = (o: Object): boolean => {
    if (!(o instanceof BitMatrix))
      return false;

    const other = <BitMatrix>o;

    return this.width === other.width &&
      this.height === other.height &&
      this.rowSize === other.rowSize &&
      Arrays.equals(this.bits, other.bits);
  }

  hashCode = () => {
    let hash = this.width;
    hash = 31 * hash + this.width;
    hash = 31 * hash + this.height;
    hash = 31 * hash + this.rowSize;
    hash = 31 * hash + Arrays.hashCode(this.bits);
    return hash;
  }

  clone = (): BitMatrix => new BitMatrix(this.width, this.height, this.rowSize, this.bits.slice());
}
