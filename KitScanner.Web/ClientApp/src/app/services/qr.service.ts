import { Injectable } from '@angular/core';

import {
  Ecc,
  QrCode
} from '../models';

@Injectable()
export class QrService {
  generateACode = (value: string, ecc: Ecc = Ecc.HIGH, border: number = 4) => {
    console.log('generateCode.value', value);
    console.log('generateCode.ecc', ecc);
    console.log('generateCode.border', border);

    const code = QrCode.encodeText(value, ecc);
    const svg = code.toSvgString(border);

    console.log('generateCode.code', code);
    console.log('generateCode.svg', svg);

    return svg;
  }

  generateCode = (value: string, ecc: Ecc = Ecc.HIGH, border: number = 4): QrCode => QrCode.encodeText(value, ecc);
  generateSvg = (code: QrCode) => code.toSvgString(4);
  drawCanvas = (code: QrCode, scale: number, border: number, canvas: HTMLCanvasElement) => code.drawCanvas(scale, border, canvas);
}
