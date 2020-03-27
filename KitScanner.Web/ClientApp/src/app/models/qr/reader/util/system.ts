export class System {
  public static arraycopy(src: any, srcPos: number, dest: any, destPos: number, length: number): void {
    while (length--) {
      dest[destPos++] = src[srcPos++];
    }
  }

  public static currentTimeMillis = (): number => Date.now();
}
