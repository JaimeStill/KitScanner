export class DecoderResult {
  private numBits: number;
  private errorsCorrected: number;
  private erasures: number;
  private other: any;

  constructor(
    private rawBytes: Uint8Array,
    private text: string,
    private byteSegments: Uint8Array[],
    private ecLevel: string,
    private structuredAppendSequenceNumber: number = -1,
    private structuredAppendParity = -1
  ) {
    this.numBits = (rawBytes === undefined || rawBytes === null)
      ? 0
      : 8 * rawBytes.length;
  }

  getRawBytes = () => this.rawBytes;
  getText = () => this.text;
  getByteSegments = () => this.byteSegments;
  getEcLevel = () => this.ecLevel;

  getNumBits = () => this.numBits;
  setNumBits = (numBits: number) => this.numBits = numBits;

  getErrorsCorrected = () => this.errorsCorrected;
  setErrorsCorrected = (errorsCorrected: number) => this.errorsCorrected = errorsCorrected;

  getErasures = () => this.erasures;
  setErasures = (erasures: number) => this.erasures = erasures;

  getOther = () => this.other;
  setOther = (other: any) => this.other = other;

  hasStructuredAppend = () => this.structuredAppendParity >= 0 && this.structuredAppendSequenceNumber >= 0;
  getStructuredAppendParity = () => this.structuredAppendParity;
  getStructuredAppendSequenceNumber = () => this.structuredAppendSequenceNumber;
}
