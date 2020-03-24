import { Exception } from './exception';

export class FormatException extends Exception {
  static getFormatInstance = (): FormatException => new FormatException();
}
