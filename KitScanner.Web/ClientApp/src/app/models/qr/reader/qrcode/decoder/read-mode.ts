import { Version } from './version';
import { IllegalArgumentException } from '../../exception/illegal-argument-exception';

export enum ModeValues {
  TERMINATOR,
  NUMERIC,
  ALPHANUMERIC,
  STRUCTURED_APPEND,
  BYTE,
  ECI,
  KANJI,
  FNC1_FIRST_POSITION,
  FNC1_SECOND_POSITION,
  HANZI
}

export class ReadMode {

}
