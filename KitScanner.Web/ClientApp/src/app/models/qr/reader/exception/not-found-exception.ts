import { Exception } from './exception';

export class NotFoundException extends Exception {
  static getNotFoundInstance = (): NotFoundException => new NotFoundException();
}
