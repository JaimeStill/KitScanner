export class Ecb {
  private count: number;
  private dataCodewords: number;

  constructor(count: number, dataCodewords: number) {
    this.count = count;
    this.dataCodewords = dataCodewords;
  }

  public getCount = () => this.count;
  public getDataCodewords = () => this.dataCodewords;
}
