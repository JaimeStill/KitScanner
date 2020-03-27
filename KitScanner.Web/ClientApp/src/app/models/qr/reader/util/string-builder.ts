import { StringEncoding } from './string-encoding';
import { CharacterSetEci } from '../common/character-set-eci';

export class StringBuilder {
  private encoding: CharacterSetEci;

  constructor(
    private value: string = ''
  ) { }

  enableDecoding = (encoding: CharacterSetEci): StringBuilder => {
    this.encoding = encoding;
    return this;
  }

  append = (s: string | number): StringBuilder => {
    if (typeof s === 'string')
      this.value += s.toString();
    else if (this.encoding)
      this.value += StringEncoding.decode(new Uint8Array([s]), this.encoding);
    else
      this.value += String.fromCharCode(s);

    return this;
  }

  length = () => this.value.length;

  charAt = (n: number) => this.value.charAt(n);

  deleteCharAt = (n: number) => {
    this.value = this.value.substr(0, n) + this.value.substring(n + 1);
  }

  setCharAt = (n: number, c: string) => {
    this.value = this.value.substr(0, n) + c + this.value.substr(n + 1);
  }

  substring = (start: int, end: int): string => this.value.substring(start, end);

  setLengthToZero = () => {
    this.value = '';
  }

  toString = () => this.value;

  insert = (n: number, c: string) => {
    this.value = this.value.substr(0, n) + c + this.value.substr(n + c.length);
  }
}
