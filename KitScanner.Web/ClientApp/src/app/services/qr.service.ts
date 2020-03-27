import { Injectable } from '@angular/core';

import {
  GenEcc,
  QrCode,
  BrowserMultiFormatReader
 } from '../models';

@Injectable()
export class QrService {
  generateACode = (value: string, ecc: GenEcc = GenEcc.HIGH, border: number = 4) => {
    console.log('generateCode.value', value);
    console.log('generateCode.ecc', ecc);
    console.log('generateCode.border', border);

    const code = QrCode.encodeText(value, ecc);
    const svg = code.toSvgString(border);

    console.log('generateCode.code', code);
    console.log('generateCode.svg', svg);

    return svg;
  }

  generateCode = (value: string, ecc: GenEcc = GenEcc.HIGH, border: number = 4): QrCode => QrCode.encodeText(value, ecc);
  generateSvg = (code: QrCode) => code.toSvgString(4);
  drawCanvas = (code: QrCode, scale: number, border: number, canvas: HTMLCanvasElement) => code.drawCanvas(scale, border, canvas);

  readFromImage = async (url: string) => {
    const reader = new BrowserMultiFormatReader();
    return await reader.decodeFromImageUrl(url);
  }
}
