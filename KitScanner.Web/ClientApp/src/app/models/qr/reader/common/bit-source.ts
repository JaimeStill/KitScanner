import { IllegalArgumentException } from '../exception/illegal-argument-exception';

export class BitSource {
  private byteOffset: number;
  private bitOffset: number;

  constructor(
    private bytes: Uint8Array
  ) {
    this.byteOffset = 0;
    this.bitOffset = 0;
  }

  getBitOffset = () => this.bitOffset;
  getByteOffset = () => this.byteOffset;

  readBits = (numBits: number): number => {
    if (numBits < 1 || numBits > 32 || numBits > this.available())
      throw new IllegalArgumentException(`${numBits}`);

    let result = 0;

    if (this.bitOffset > 0) {
      const bitsLeft = 8 - this.bitOffset;
      const toRead = numBits < bitsLeft ? numBits : bitsLeft;
      const bitsToNotRead = bitsLeft - toRead;
      const mask = (0xff >> (8 - toRead)) << bitsToNotRead;

      result = (this.bytes[this.byteOffset] & mask) >> bitsToNotRead;
      numBits -= toRead;
      this.bitOffset += toRead;

      if (this.bitOffset === 8) {
        this.bitOffset = 0;
        this.byteOffset++;
      }
    }

    if (numBits > 0) {
      while (numBits >= 8) {
        result = (result << 8) | (this.bytes[this.byteOffset] & 0xff);
        this.byteOffset++;
        numBits -= 8;
      }

      if (numBits > 0) {
        const bitsToNotRead = 8 - numBits;
        const mask = (0xff >> bitsToNotRead) << bitsToNotRead;

        result = (result << numBits) | ((this.bytes[this.byteOffset] & mask) >> bitsToNotRead);
        this.bitOffset += numBits;
      }
    }

    return result;
  }

  available = (): number => 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
}
