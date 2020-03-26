import { DefaultGridSampler } from './default-grid-sampler';
import { GridSampler } from './grid-sampler';

export class GridSamplerInstance {
  private static gridSampler: GridSampler = new DefaultGridSampler();

  static setGridSampler = (newGridSampler: GridSampler) => GridSamplerInstance.gridSampler = newGridSampler;
  static getInstance = (): GridSampler => GridSamplerInstance.gridSampler;
}
