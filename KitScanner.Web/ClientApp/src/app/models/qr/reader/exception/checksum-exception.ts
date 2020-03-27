import { Exception } from './exception';

export class ChecksumException extends Exception {
  static getChecksumInstance = (): ChecksumException => new ChecksumException();
}
