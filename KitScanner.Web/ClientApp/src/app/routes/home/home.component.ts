import {
  Component,
  ViewChild,
  ElementRef
} from '@angular/core';

import { QrService } from '../../services';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  @ViewChild('qrCanvas', { static: true }) qrCanvas: ElementRef<HTMLCanvasElement>;

  constructor(
    public qr: QrService
  ) { }

  render = async (event: KeyboardEvent) => {
    console.log((event.target as HTMLInputElement).value);
    const code = this.qr.generateCode((event.target as HTMLInputElement).value);
    this.qr.drawCanvas(code, 8, 4, this.qrCanvas.nativeElement);
    const result = await this.qr.readFromImage(this.qrCanvas.nativeElement.toDataURL());
    console.log(result);
  }
}
