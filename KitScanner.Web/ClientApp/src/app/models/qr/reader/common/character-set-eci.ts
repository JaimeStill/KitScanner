import { FormatException } from '../exception/format-exception';

export enum CharacterSetValueIdentifiers {
  Cp437,
  ISO8859_1,
  ISO8859_2,
  ISO8859_3,
  ISO8859_4,
  ISO8859_5,
  ISO8859_6,
  ISO8859_7,
  ISO8859_8,
  ISO8859_9,
  ISO8859_10,
  ISO8859_11,
  ISO8859_13,
  ISO8859_14,
  ISO8859_15,
  ISO8859_16,
  SJIS,
  Cp1250,
  Cp1251,
  Cp1252,
  Cp1256,
  UnicodeBigUnmarked,
  UTF8,
  ASCII,
  Big5,
  GB18030,
  EUC_KR
}

export class CharacterSetEci {
  private static VALUE_IDENTIFIER_TO_ECI = new Map<number, CharacterSetEci>();
  private static VALUES_TO_ECI = new Map<number, CharacterSetEci>();
  private static NAME_TO_ECI = new Map<string, CharacterSetEci>();

  static readonly Cp437 = new CharacterSetEci(
    CharacterSetValueIdentifiers.Cp437, Int32Array.from([0, 2]), 'Cp437'
  );

  static readonly ISO8859_1 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_1, Int32Array.from([1, 3]), 'ISO-8859-1', 'ISO88591', 'ISO8859_1'
  );

  static readonly ISO8859_2 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_2, 4, 'ISO-8859-2', 'ISO88592', 'ISO8859_2'
  );

  static readonly ISO8859_3 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_3, 5, 'ISO-8859-3', 'ISO88593', 'ISO8859_3'
  );

  static readonly ISO8859_4 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_4, 6, 'ISO-8859-4', 'ISO88594', 'ISO8859_4'
  );

  static readonly ISO8859_5 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_5, 7, 'ISO-8859-5', 'ISO88595', 'ISO8859_5'
  );

  static readonly ISO8859_6 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_6, 8, 'ISO-8859-6', 'ISO88596', 'ISO8859_6'
  );

  static readonly ISO8859_7 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_7, 9, 'ISO-8859-7', 'ISO88597', 'ISO8859_7'
  );

  static readonly ISO8859_8 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_8, 10, 'ISO-8859-8', 'ISO88598', 'ISO8859_8'
  );

  static readonly ISO8859_9 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_9, 11, 'ISO-8859-9', 'ISO88599', 'ISO8859_9'
  );

  static readonly ISO8859_10 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_10, 12, 'ISO-8859-10', 'ISO885910', 'ISO8859_10'
  );

  static readonly ISO8859_11 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_11, 13, 'ISO-8859-11', 'ISO885911', 'ISO8859_11'
  );

  static readonly ISO8859_13 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_13, 15, 'ISO-8859-13', 'ISO885913', 'ISO8859_13'
  );

  static readonly ISO8859_14 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_14, 16, 'ISO-8859-14', 'ISO885914', 'ISO8859_14'
  );

  static readonly ISO8859_15 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_15, 17, 'ISO-8859-15', 'ISO885915', 'ISO8859_15'
  );

  static readonly ISO8859_16 = new CharacterSetEci(
    CharacterSetValueIdentifiers.ISO8859_16, 18, 'ISO-8859-16', 'ISO885916', 'ISO8859_16'
  );

  static readonly SJIS = new CharacterSetEci(
    CharacterSetValueIdentifiers.SJIS, 20, 'SJIS', 'Shift_JIS'
  );

  static readonly Cp1250 = new CharacterSetEci(
    CharacterSetValueIdentifiers.Cp1250, 21, 'Cp1250', 'windows-1250'
  );

  static readonly Cp1251 = new CharacterSetEci(
    CharacterSetValueIdentifiers.Cp1251, 22, 'Cp1251', 'windows-1251'
  );

  static readonly Cp1252 = new CharacterSetEci(
    CharacterSetValueIdentifiers.Cp1252, 23, 'Cp1252', 'windows-1252'
  );

  static readonly Cp1256 = new CharacterSetEci(
    CharacterSetValueIdentifiers.Cp1256, 24, 'Cp1256', 'windows-1256'
  );

  static readonly UnicodeBigUnmarked = new CharacterSetEci(
    CharacterSetValueIdentifiers.UnicodeBigUnmarked, 25, 'UnicodeBigUnmarked', 'UTF-16BE', 'UnicodeBig'
  );

  static readonly UTF8 = new CharacterSetEci(
    CharacterSetValueIdentifiers.UTF8, 26, 'UTF8', 'UTF-8'
  );

  static readonly ASCII = new CharacterSetEci(
    CharacterSetValueIdentifiers.ASCII, Int32Array.from([27, 170]), 'ASCII', 'US-ASCII'
  );

  static readonly Big5 = new CharacterSetEci(
    CharacterSetValueIdentifiers.Big5, 28, 'Big5'
  );

  static readonly GB18030 = new CharacterSetEci(
    CharacterSetValueIdentifiers.GB18030, 29, 'GB18030', 'GB2312', 'EUC_CN', 'GBK'
  );

  static readonly EUC_KR = new CharacterSetEci(
    CharacterSetValueIdentifiers.EUC_KR, 30, 'EUC_KR', 'EUC-KR'
  );

  values: Int32Array;
  otherEncodingNames: string[];

  constructor(
    public valueIdentifier: CharacterSetValueIdentifiers,
    valuesParam: Int32Array | number,
    public name: string,
    ...otherEncodingNames: string[]
  ) {
    if (typeof valuesParam === 'number')
      this.values = Int32Array.from([valuesParam]);
    else
      this.values = valuesParam;

    this.otherEncodingNames = otherEncodingNames;

    CharacterSetEci.VALUE_IDENTIFIER_TO_ECI.set(valueIdentifier, this);
    CharacterSetEci.NAME_TO_ECI.set(name, this);

    const values = this.values;

    for (let i = 0, length = values.length; i !== length; i++) {
      const v = values[i];
      CharacterSetEci.VALUES_TO_ECI.set(v, this);
    }

    for (const otherName of otherEncodingNames)
      CharacterSetEci.NAME_TO_ECI.set(otherName, this);
  }

  static getCharacterSetEciByValue = (value: number) => {
    if (value < 0 || value >= 900)
      throw new FormatException('Incorrect value');

    const characterSet = CharacterSetEci.VALUES_TO_ECI.get(value);

    if (undefined === characterSet)
      throw new FormatException('Incorrect value');

    return characterSet;
  }

  static getCharacterSetEciByName = (name: string) => {
    const characterSet = CharacterSetEci.NAME_TO_ECI.get(name);

    if (undefined === characterSet)
      throw new FormatException('Incorrect value');

    return characterSet;
  }

  getValueIdentifier = () => this.valueIdentifier;
  getName = () => this.name;
  getValue = () => this.values[0];

  equals = (o: CharacterSetEci) => {
    if (!(o instanceof CharacterSetEci))
      return false;

    const other = <CharacterSetEci>o;

    return this.getName() === other.getName();
  }
}
