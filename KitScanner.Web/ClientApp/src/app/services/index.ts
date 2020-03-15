import { CoreService } from './core.service';
import { QrService } from './qr.service';
import { SnackerService } from './snacker.service';
import { ThemeService } from './theme.service';

export const Services = [
  CoreService,
  QrService,
  SnackerService,
  ThemeService
];

export * from './core.service';
export * from './qr.service';
export * from './snacker.service';
export * from './theme.service';
