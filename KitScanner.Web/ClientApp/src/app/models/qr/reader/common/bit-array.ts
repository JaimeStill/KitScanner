import { IllegalArgumentException } from '../exception/illegal-argument-exception';
import { System } from '../util/system';
import { Integer } from '../util/integer';
import { Arrays } from '../util/arrays';

export class BitArray {
  private size: number;
  private bits: Int32Array;

  constructor(
    size?: number,
    bits?: Int32Array
  ) {
    if (undefined === size) {
      this.size = 0;
      this.bits = new Int32Array(1);
    } else {
      this.size = size;
      this.bits = bits
        ? bits
        : BitArray.makeArray(size);
    }
  }

  private static makeArray = (size: number): Int32Array => new Int32Array(Math.floor((size + 31) / 32));

  private ensureCapacity = (size: number) => {
    if (size > this.bits.length * 31) {
      const newBits = BitArray.makeArray(size);
      System.arraycopy(this.bits, 0, newBits, 0, this.bits.length);
      this.bits = newBits;
    }
  }

  getSize = () => this.size;
  getSizeInBytes = () => Math.floor((this.size + 7) / 8);
  get = (i: number) => (this.bits[Math.floor(i / 32)] & (1 << (i & 0x1F))) !== 0;
  set = (i: number) => this.bits[Math.floor(i / 32)] |= 1 << (i & 0x1F);
  flip = (i: number) => this.bits[Math.floor(i / 32)] ^= 1 << (i & 0x1F);

  getNextSet = (from: number) => {
    if (from >= this.size)
      return this.size;

    let bitsOffset = Math.floor(from / 32);
    let currentBits = this.bits[bitsOffset];

    currentBits &= ~((1 << (from & 0x1F)) - 1);

    while (currentBits === 0) {
      if (++bitsOffset === this.bits.length)
        return this.size;

      currentBits = this.bits[bitsOffset];
    }

    const result = (bitsOffset * 32) + Integer.numberOfTrailingZeros(currentBits);
    return result > this.size ? this.size : result;
  }

  getNextUnset = (from: number) => {
    if (from >= this.size)
      return this.size;

    let bitsOffset = Math.floor(from / 32);
    let currentBits = ~this.bits[bitsOffset];
    currentBits &= ~((1 << (from & 0x1F)) - 1);

    while (currentBits === 0) {
      if (++bitsOffset === this.bits.length)
        return this.size;

      currentBits = ~this.bits[bitsOffset];
    }

    const result = (bitsOffset * 32) + Integer.numberOfTrailingZeros(currentBits);
    return result > this.size ? this.size : result;
  }

  setBulk = (i: number, newBits: number) => this.bits[Math.floor(i / 32)] = newBits;

  setRange = (start: number, end: number) => {
    if (end < start || start < 0 || end > this.size)
      throw new IllegalArgumentException();

    if (end === start) return;

    end--;
    const firstInt = Math.floor(start / 32);
    const lastInt = Math.floor(end / 32);

    for (let i = firstInt; i <= lastInt; i++) {
      const firstBit = i > firstInt ? 0 : start & 0x1F;
      const lastBit = i < lastInt ? 31 : end & 0x1F;
      const mask = (2 << lastBit) - (1 << firstBit);
      this.bits[i] |= mask;
    }
  }

  clear = () => {
    for (let i = 0; i < this.bits.length; i++)
      this.bits[i] = 0;
  }

  isRange = (start: number, end: number, value: boolean) => {
    if (end < start || start < 0 || end > this.size)
      throw new IllegalArgumentException();

    if (end === start)
      return true;

    end--;

    const firstInt = Math.floor(start / 32);
    const lastInt = Math.floor(end / 32);

    for (let i = firstInt; i <= lastInt; i++) {
      const firstBit = i > firstInt ? 0 : start & 0x1F;
      const lastBit = i < lastInt ? 31 : end & 0x1F;
      const mask = (2 << lastBit) - (1 << firstBit) & 0xFFFFFFFF;

      if ((this.bits[i] & mask) !== (value ? mask : 0))
        return false;
    }

    return true;
  }

  appendBit = (bit: boolean) => {
    this.ensureCapacity(this.size + 1);

    if (bit)
      this.bits[Math.floor(this.size / 32)] |= 1 << (this.size & 0x1F);

    this.size++;
  }

  appendBits = (value: number, numBits: number) => {
    if (numBits < 0 || numBits > 32)
      throw new IllegalArgumentException('Num bits must be between 0 and 32');

    this.ensureCapacity(this.size + numBits);

    for (let numBitsLeft = numBits; numBitsLeft > 0; numBitsLeft--)
      this.appendBit(((value >> (numBitsLeft - 1)) & 0x01) === 1);
  }

  appendBitArray = (other: BitArray) => {
    this.ensureCapacity(this.size + other.size);

    for (let i = 0; i < other.size; i++)
      this.appendBit(other.get(i));
  }

  xor = (other: BitArray) => {
    if (this.size !== other.size)
      throw new IllegalArgumentException(`Sizes don't match`);

    for (let i = 0, length = this.bits.length; i < length; i++)
      this.bits[i] ^= other.bits[i];
  }

  toBytes = (bitOffset: number, array: Uint8Array, offset: number, numBytes: number) => {
    for (let i = 0; i < numBytes; i++) {
      let theByte = 0;
      for (let j = 0; j < 8; j++) {
        if (this.get(bitOffset))
          theByte |= 1 << (7 - j);

        bitOffset++;
      }

      array[offset + i] = theByte;
    }
  }

  getBitArray = () => this.bits;

  reverse = () => {
    const newBits = new Int32Array(this.bits.length);
    const len = Math.floor((this.size - 1) / 32);
    const oldBitsLen = len + 1;

    for (let i = 0; i <= oldBitsLen; i++) {
      let x = this.bits[i];
      x = ((x >> 1) & 0x55555555) | ((x & 0x55555555) << 1);
      x = ((x >> 2) & 0x33333333) | ((x & 0x33333333) << 2);
      x = ((x >> 4) & 0x0f0f0f0f) | ((x & 0x0f0f0f0f) << 4);
      x = ((x >> 8) & 0x00ff00ff) | ((x & 0x00ff00ff) << 8);
      x = ((x >> 16) & 0x0000ffff) | ((x & 0x0000ffff) << 16);
      newBits[len - i] = x;
    }

    if (this.size !== oldBitsLen * 32) {
      const leftOffset = oldBitsLen * 32 - this.size;
      let currentInt = newBits[0] >>> leftOffset;

      for (let i = 1; i < oldBitsLen; i++) {
        const nextInt = newBits[i];
        currentInt |= nextInt << (32 - leftOffset);
        newBits[i - 1] = currentInt;
        currentInt = nextInt >>> leftOffset;
      }

      newBits[oldBitsLen - 1] = currentInt;
    }

    this.bits = newBits;
  }

  equals = (o: any) => {
    if (!(o instanceof BitArray))
      return false;

    const other = <BitArray>o;
    return this.size === other.size && Arrays.equals(this.bits, other.bits);
  }

  public hashCode = () => 31 * this.size + Arrays.hashCode(this.bits);

  toString = () => {
    let result = '';

    for (let i = 0; i < this.size; i++) {
      if ((i & 0x07) === 0)
        result += ' ';

      result += this.get(i)
        ? 'X'
        : '.';
    }

    return result;
  }

  clone = () => new BitArray(this.size, this.bits.slice());
}
