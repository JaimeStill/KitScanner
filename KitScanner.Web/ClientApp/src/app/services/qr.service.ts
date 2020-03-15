import { Injectable } from '@angular/core';

import {
  Ecc,
  QrCode
} from '../models';

@Injectable()
export class QrService {
  generateCode = (value: string, ecc: Ecc = Ecc.HIGH, border: number = 4) => {
    console.log('generateCode.value', value);
    console.log('generateCode.ecc', ecc);
    console.log('generateCode.border', border);

    const code = QrCode.encodeText(value, ecc);
    const svg = code.toSvgString(border);

    console.log('generateCode.code', code);
    console.log('generateCode.svg', svg);

    return svg;
  }
}
