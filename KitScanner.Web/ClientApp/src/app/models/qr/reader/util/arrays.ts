import { System } from './system';

import { ArrayIndexOutOfBoundsException } from '../exception/array-index-out-of-bounds-exception';
import { IllegalArgumentException } from '../exception/illegal-argument-exception';

export class Arrays {
  static fill = (a: Int32Array | Uint8Array | any[], val: int) => {
    for (let i = 0, len = a.length; i < len; i++)
      a[i] = val;
  }

  static fillWithin = (a: Int32Array, fromIndex: int, toIndex: int, val: int) => {
    Arrays.rangeCheck(a.length, fromIndex, toIndex);

    for (let i = fromIndex; i < toIndex; i++)
      a[i] = val;
  }

  static rangeCheck = (arrayLength: int, fromIndex: int, toIndex: int) => {
    if (fromIndex > toIndex) {
      throw new IllegalArgumentException(`fromIndex(${fromIndex}) > toIndex(${toIndex})`);
    }

    if (fromIndex < 0) {
      throw new ArrayIndexOutOfBoundsException(fromIndex);
    }

    if (toIndex > arrayLength) {
      throw new ArrayIndexOutOfBoundsException(toIndex);
    }
  }

  static asList = <T = any>(...args: T[]) => args;

  static create = <T = any> (rows: int, cols: int, value?: T) => {
    let arr = Array.from({ length: rows });

    return arr.map(x => Array.from<T>({ length: cols }).fill(value));
  }

  static equals = (first: any, second: any) => {
    if (!first || !second || !first.length || !second.length || first.length !== second.length)
      return false;

    for (let i = 0, length = first.length; i < length; i++) {
      if (first[i] !== second[i])
        return false;
    }

    return true;
  }

  static hashCode = (a: any) => {
    if (a === null) return 0;

    let result = 1;

    for (const element of a)
      result = 31 * result + element;

    return result;
  }

  static fillUint8Array = (a: Uint8Array, value: number) => {
    for (let i = 0; i !== a.length; i++)
      a[i] = value;
  }

  static copyOf = (original: Int32Array, newLength: number) =>
    original.slice(0, newLength);

  static copyOfUint8Array = (original: Uint8Array, newLength: number) => {
    if (original.length <= newLength) {
      const newArray = new Uint8Array(newLength);
      newArray.set(original);
      return newArray;
    }

    return original.slice(0, newLength);
  }

  static copyOfRange = (original: Int32Array, from: number, to: number) => {
    const newLength = to - from;
    const copy = new Int32Array(newLength);
    System.arraycopy(original, from, copy, 0, newLength);
    return copy;
  }

  static numberComparator = (a: number, b: number) => a - b;

  static binarySearch = (ar: Int32Array, el: number, comparator?: (a: number, b: number) => number) => {
    if (undefined === comparator)
      comparator = Arrays.numberComparator;

    let m = 0;
    let n = ar.length - 1;

    while (m <= n) {
      const k = (n + m) >> 1;
      const cmp = comparator(el, ar[k]);

      if (cmp > 0)
        m = k + 1;
      else if (cmp < 0)
        n = k - 1;
      else
        return k;
    }

    return -m - 1;
  }
}
