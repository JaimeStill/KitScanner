import { IndexOutOfBoundsException } from './index-out-of-bounds-exception';

export class ArrayIndexOutOfBoundsException extends IndexOutOfBoundsException {
  constructor(
    public index: number = undefined,
    public message: string = undefined
  ) {
    super(message);
  }
}
