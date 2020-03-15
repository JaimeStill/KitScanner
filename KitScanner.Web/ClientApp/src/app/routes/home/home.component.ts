import { Component } from '@angular/core';
import { QrService } from '../../services';

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
})
export class HomeComponent {
  code: string;

  constructor(
    public qr: QrService
  ) { }

  render = (event: KeyboardEvent) => {
    console.log((event.target as HTMLInputElement).value);
    this.code = this.qr.generateCode((event.target as HTMLInputElement).value);
  }
}
