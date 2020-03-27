import { CharacterSetEci } from '../common/character-set-eci';
import { UnsupportedOperationException } from '../exception/unsupported-operation-exception';

export class StringEncoding {
  private static decodeFallback = (bytes: Uint8Array, encoding: string | CharacterSetEci): string => {
    const characterSet = StringEncoding.encodingCharacterSet(encoding);

    if (
      characterSet.equals(CharacterSetEci.UTF8) ||
      characterSet.equals(CharacterSetEci.ISO8859_1) ||
      characterSet.equals(CharacterSetEci.ASCII)
    ) {
      let s = '';

      for (let i = 0, length = bytes.length; i < length; i++) {
        let h = bytes[i].toString(16);

        if (h.length < 2) {
          h = '0' + h;
        }

        s += `%${h}`;
      }

      return decodeURIComponent(s);
    }

    if (characterSet.equals(CharacterSetEci.UnicodeBigUnmarked))
      return String.fromCharCode.apply(null, new Uint16Array(bytes.buffer));

    throw new UnsupportedOperationException(`Encoding ${StringEncoding.encodingName(encoding)} not supported by fallback`);
  }

  private static encodeFallback = (s: string): Uint8Array => {
    const encodedUriString = btoa(unescape(encodeURIComponent(s)));
    const charList = encodedUriString.split('');
    const uintArray = [];

    for (let i = 0; i < charList.length; i++)
      uintArray.push(charList[i].charCodeAt(0));

    return new Uint8Array(uintArray);
  }

  static decode = (bytes: Uint8Array, encoding: string | CharacterSetEci): string => {
    const encodingName = StringEncoding.encodingName(encoding);

    if (typeof TextDecoder === 'undefined')
      return StringEncoding.decodeFallback(bytes, encodingName);

    return new TextDecoder(encodingName).decode(bytes);
  }

  static encode = (s: string, encoding: string | CharacterSetEci): Uint8Array => {
    if (!StringEncoding.isBrowser()) {
      const EncoderConstructor = TextEncoder as any;
      return new EncoderConstructor(StringEncoding.encodingName(encoding), { NONSTANDARD_allowLegacyEncoding: true }).encode(s);
    }

    if (typeof TextEncoder === 'undefined')
      return StringEncoding.encodeFallback(s);

    return new TextEncoder().encode(s);
  }

  static isBrowser = () => (typeof window !== 'undefined' && {}.toString.call(window) === '[object Window]');

  static encodingName = (encoding: string | CharacterSetEci): string =>
    typeof encoding === 'string'
      ? encoding
      : encoding.getName();

  static encodingCharacterSet = (encoding: string | CharacterSetEci): CharacterSetEci =>
    CharacterSetEci.getCharacterSetEciByName(StringEncoding.encodingName(encoding));
}
