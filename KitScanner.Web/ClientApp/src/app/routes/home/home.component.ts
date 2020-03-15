import {
  DomSanitizer,
  SafeHtml
} from '@angular/platform-browser';

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
  svg: SafeHtml;

  @ViewChild('qrCanvas', { static: true }) qrCanvas: ElementRef<HTMLCanvasElement>;

  constructor(
    private sanitizer: DomSanitizer,
    public qr: QrService
  ) { }

  render = (event: KeyboardEvent) => {
    console.log((event.target as HTMLInputElement).value);
    const code = this.qr.generateCode((event.target as HTMLInputElement).value);
    this.svg = this.sanitizer.bypassSecurityTrustHtml(this.qr.generateSvg(code));
    this.qr.drawCanvas(code, 8, 4, this.qrCanvas.nativeElement);
  }
}
