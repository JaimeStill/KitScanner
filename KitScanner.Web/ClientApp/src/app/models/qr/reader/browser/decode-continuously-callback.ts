import { ReaderResult } from '../reader-result';
import { Exception } from '../exception/exception';

export type DecodeContinuouslyCallback = (result: ReaderResult, error?: Exception) => any;
