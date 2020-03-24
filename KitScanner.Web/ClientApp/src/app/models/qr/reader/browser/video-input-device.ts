export class VideoInputDevice implements MediaDeviceInfo {
  readonly kind = 'videoinput';
  readonly groupId: string;

  public constructor(
    public deviceId: string,
    public label: string,
    groupId?: string
  ) {
    this.groupId = groupId || undefined;
  }

  toJSON() {
    return {
      kind: this.kind,
      groupId: this.groupId,
      deviceId: this.deviceId,
      label: this.label
    }
  }
}
