import { InvertedLuminanceSource } from '../inverted-luminance-source';
import { LuminanceSource } from '../luminance-source';

import { IllegalArgumentException } from '../exception/illegal-argument-exception';

export class HTMLCanvasElementLuminanceSource extends LuminanceSource {
  private static DEGREE_TO_RADIANS = Math.PI / 180;

  private buffer: Uint8ClampedArray;
  private tempCanvasElement: HTMLCanvasElement = null;

  constructor(
    private canvas: HTMLCanvasElement
  ) {
    super(canvas.width, canvas.height);
    this.buffer = HTMLCanvasElementLuminanceSource.makeBufferFromCanvasImageData(canvas);
  }

  private static makeBufferFromCanvasImageData = (canvas: HTMLCanvasElement) => {
    const imageData = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    return HTMLCanvasElementLuminanceSource.toGrayscaleBuffer(imageData.data, canvas.width, canvas.height);
  }

  private static toGrayscaleBuffer = (imageBuffer: Uint8ClampedArray, width: number, height: number) => {
    const grayscaleBuffer = new Uint8ClampedArray(width * height);

    for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
      let gray;
      const alpha = imageBuffer[i + 3];

      if (alpha === 0)
        gray = 0xff;
      else {
        const pixelR = imageBuffer[i];
        const pixelG = imageBuffer[i + 1];
        const pixelB = imageBuffer[i + 2];

        gray = (
          306 * pixelR +
          601 * pixelG +
          117 * pixelB +
          0x200
        ) >> 10;
      }

      grayscaleBuffer[j] = gray;
    }

    return grayscaleBuffer;
  }

  private getTempCanvasElement = () => {
    if (null === this.tempCanvasElement) {
      const tempCanvasElement = this.canvas.ownerDocument.createElement('canvas');
      tempCanvasElement.width = this.canvas.width;
      tempCanvasElement.height = this.canvas.height;
      this.tempCanvasElement = tempCanvasElement;
    }

    return this.tempCanvasElement;
  }

  private rotate = (angle: number) => {
    const tempCanvasElement = this.getTempCanvasElement();
    const tempContext = tempCanvasElement.getContext('2d');
    const angleRadians = angle * HTMLCanvasElementLuminanceSource.DEGREE_TO_RADIANS;

    const width = this.canvas.width;
    const height = this.canvas.height;
    const newWidth = Math.ceil(Math.abs(Math.cos(angleRadians)) * width + Math.abs(Math.sin(angleRadians)) * height);
    const newHeight = Math.ceil(Math.abs(Math.sin(angleRadians)) * width + Math.abs(Math.cos(angleRadians)) * height);
    tempCanvasElement.width = newWidth;
    tempCanvasElement.height = newHeight;

    tempContext.translate(newWidth / 2, newHeight / 2);
    tempContext.rotate(angleRadians);
    tempContext.drawImage(this.canvas, width / -2, height / -2);
    this.buffer = HTMLCanvasElementLuminanceSource.makeBufferFromCanvasImageData(tempCanvasElement);
    return this;
  }

  getRow = (y: number, row: Uint8ClampedArray) => {
    if (y < 0 || y >= this.getHeight())
      throw new IllegalArgumentException(`Requested row is outside the image: ${y}`);

    const width = this.getWidth();
    const start = y * width;

    if (row === null)
      row = this.buffer.slice(start, start + width);
    else {
      if (row.length < width)
        row = new Uint8ClampedArray(width);

      row.set(this.buffer.slice(start, start + width));
    }

    return row;
  }

  getMatrix = () => this.buffer;
  isCropSupported = () => true;

  crop = (
    left: number,
    top: number,
    width: number,
    height: number
  ): LuminanceSource => {
    this.crop(left, top, width, height);
    return this;
  }

  isRotateSupported = () => true;

  rotateCounterClockwise = (): LuminanceSource => {
    this.rotate(-90);
    return this;
  }

  rotateCounterClockwise45 = (): LuminanceSource => {
    this.rotate(-45);
    return this;
  }

  invert = (): LuminanceSource => new InvertedLuminanceSource(this);
}
