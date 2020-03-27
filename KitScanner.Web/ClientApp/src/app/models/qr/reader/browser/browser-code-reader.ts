import { DecodeContinuouslyCallback } from './decode-continuously-callback';
import { HTMLCanvasElementLuminanceSource } from './html-canvas-element-luminance-source';
import { HTMLVisualMediaElement } from './html-visual-media-element';
import { VideoInputDevice } from './video-input-device';
import { BinaryBitmap } from '../binary-bitmap';
import { DecodeHintType } from '../decode-hint-type';
import { Reader } from '../reader';
import { ReaderResult } from '../reader-result';
import { HybridBinarizer } from '../common/hybrid-binarizer';
import { ArgumentException } from '../exception/argument-exception';
import { ChecksumException } from '../exception/checksum-exception';
import { FormatException } from '../exception/format-exception';
import { NotFoundException } from '../exception/not-found-exception';

export class BrowserCodeReader {
  private _stopContinuousDecode = false;
  private _stopAsyncDecode = false;

  protected _timeBetweenDecodingAttempts = 0;
  protected captureCanvas: HTMLCanvasElement;
  protected captureCanvasContext: CanvasRenderingContext2D;
  protected imageElement: HTMLImageElement;
  protected imageLoadedListener: EventListener;
  protected stream: MediaStream;
  protected videoElement: HTMLVideoElement;
  protected videoCanPlayListener: EventListener;
  protected videoEndedListener: EventListener;
  protected videoPlayingEventListener: EventListener;

  get timeBetweenDecodingAttempts(): number {
    return this._timeBetweenDecodingAttempts;
  }

  set timeBetweenDecodingAttempts(millis: number) {
    this._timeBetweenDecodingAttempts = millis < 0
      ? 0
      : millis;
  }

  get hasNavigator() {
    return typeof navigator !== 'undefined';
  }

  get isMediaDevicesSupported() {
    return this.hasNavigator && !!navigator.mediaDevices;
  }

  get canEnumerateDevices() {
    return !!(this.isMediaDevicesSupported && navigator.mediaDevices.enumerateDevices);
  }

  set hints(hints: Map<DecodeHintType, any>) {
    this._hints = hints || null;
  }

  get hints(): Map<DecodeHintType, any> {
    return this._hints;
  }

  constructor(
    protected readonly reader: Reader,
    protected timeBetweenScansMillis: number = 500,
    protected _hints?: Map<DecodeHintType, any>
  ) { }

  private _decodeFromVideoElementSetup = (source: string | HTMLVideoElement) => {
    if (!source)
      throw new ArgumentException('A video element must be provided');

    this.reset();

    const element = this.prepareVideoElement(source);

    this.videoElement = element;

    return element;
  }

  private _decodeOnLoadImage = (element: HTMLImageElement): Promise<ReaderResult> => new Promise((resolve, reject) => {
    this.imageLoadedListener = () => this.decodeOnce(element, false, true).then(resolve, reject);
    element.addEventListener('load', this.imageLoadedListener);
  });

  private _decodeOnLoadVideo = async (videoElement: HTMLVideoElement): Promise<ReaderResult> => {
    await this.playVideoOnLoadAsync(videoElement);
    return await this.decodeOnce(videoElement);
  }

  private _decodeOnLoadVideoContinuously = async (videoElement: HTMLVideoElement, callbackFn: DecodeContinuouslyCallback): Promise<void> => {
    await this.playVideoOnLoadAsync(videoElement);
    this.decodeContinuously(videoElement, callbackFn);
  }

  private _destroyVideoElement = () => {
    if (!this.videoElement)
      return;

    if (typeof this.videoEndedListener !== 'undefined')
      this.videoElement.removeEventListener('ended', this.videoEndedListener);

    if (typeof this.videoPlayingEventListener !== 'undefined')
      this.videoElement.removeEventListener('playing', this.videoPlayingEventListener);

    if (typeof this.videoCanPlayListener !== 'undefined')
      this.videoElement.removeEventListener('loadedmetadata', this.videoCanPlayListener);

    this.cleanVideoSource(this.videoElement);
    this.videoElement = undefined;
  }

  private _destroyImageElement = () => {
    if (!this.imageElement)
      return;

    if (undefined !== this.imageLoadedListener)
      this.imageElement.removeEventListener('load', this.imageLoadedListener);

    this.imageElement.src = undefined;
    this.imageElement.removeAttribute('src');
    this.imageElement = undefined;
  }

  private _destroyCaptureCanvas = () => {
    this.captureCanvasContext = undefined;
    this.captureCanvas = undefined;
  }

  private cleanVideoSource = (videoElement: HTMLVideoElement) => {
    try {
      videoElement.srcObject = null;
    } catch {
      videoElement.src = '';
    }

    this.videoElement.removeAttribute('src');
  }

  protected attachStreamToVideo = async (stream: MediaStream, videoSource: string | HTMLVideoElement): Promise<HTMLVideoElement> => {
    const videoElement = this.prepareVideoElement(videoSource);

    this.addVideoSource(videoElement, stream);

    this.videoElement = videoElement;
    this.stream = stream;

    await this.playVideoOnLoadAsync(videoElement);

    return videoElement;
  }

  protected playVideoOnLoadAsync = (videoElement: HTMLVideoElement): Promise<void> =>
    new Promise((resolve, reject) => this.playVideoOnLoad(videoElement, () => resolve()));

  protected playVideoOnLoad = (element: HTMLVideoElement, callbackFn: EventListener) => {
    this.videoEndedListener = () => this.stopStreams();
    this.videoCanPlayListener = () => this.tryPlayVideo(element);

    element.addEventListener('ended', this.videoEndedListener);
    element.addEventListener('canplay', this.videoCanPlayListener);
    element.addEventListener('playing', callbackFn);

    this.tryPlayVideo(element);
  }

  protected getCaptureCanvasContext = (mediaElement?: HTMLVisualMediaElement) => {
    if (!this.captureCanvasContext) {
      const elem = this.getCaptureCanvas(mediaElement);
      const ctx = elem.getContext('2d');
      this.captureCanvasContext = ctx;
    }

    return this.captureCanvasContext;
  }

  protected getCaptureCanvas = (mediaElement?: HTMLVisualMediaElement): HTMLCanvasElement => {
    if (!this.captureCanvas) {
      const elem = this.createCaptureCanvas(mediaElement);
      this.captureCanvas = elem;
    }

    return this.captureCanvas;
  }

  protected stopStreams = () => {
    if (this.stream) {
      this.stream.getVideoTracks().forEach(t => t.stop);
      this.stream = undefined;
    }

    if (this._stopAsyncDecode === false)
      this.stopAsyncDecode();

    if (this._stopContinuousDecode === false)
      this.stopContinuousDecode();
  }

  listVideoInputDevices = async (): Promise<MediaDeviceInfo[]> => {
    if (!this.hasNavigator)
      throw new Error(`Can't enumerate devices, navigator is not present.`);

    if (!this.canEnumerateDevices)
      throw new Error(`Can't enumerate devices, method not supported`);

    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices: MediaDeviceInfo[] = [];

    for (const device of devices) {
      const kind = <string>device.kind === 'video' ? 'videoinput' : device.kind;

      if (kind !== 'videoinput')
        continue;

      const deviceId = device.deviceId || (<any>device).id;
      const label = device.label || `Video device ${videoDevices.length + 1}`;
      const groupId = device.groupId;

      const videoDevice = <MediaDeviceInfo>{ deviceId, label, kind, groupId };

      videoDevices.push(videoDevice);
    }

    return videoDevices;
  }

  getVideoInputDevices = async (): Promise<VideoInputDevice[]> => {
    const devices = await this.listVideoInputDevices();
    return devices.map(d => new VideoInputDevice(d.deviceId, d.label));
  }

  findDeviceById = async (deviceId: string): Promise<MediaDeviceInfo> => {
    const devices = await this.listVideoInputDevices();

    if (!devices)
      return null;

    return devices.find(d => d.deviceId === deviceId);
  }

  decodeFromInputVideoDevice = async (
    deviceId?: string,
    videoSource?: string | HTMLVideoElement
  ): Promise<ReaderResult> => await this.decodeOnceFromVideoDevice(deviceId, videoSource);

  decodeOnceFromVideoDevice = async (
    deviceId?: string,
    videoSource?: string | HTMLVideoElement
  ): Promise<ReaderResult> => {
    this.reset();

    let videoConstraints: MediaTrackConstraints;

    if (!deviceId)
      videoConstraints = { facingMode: 'environment' };
    else
      videoConstraints = { deviceId: { exact: deviceId } };

    const constraints: MediaStreamConstraints = { video: videoConstraints };

    return await this.decodeOnceFromConstraints(constraints, videoSource);
  }

  decodeOnceFromConstraints = async (
    constraints: MediaStreamConstraints,
    videoSource?: string | HTMLVideoElement
  ): Promise<ReaderResult> => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return await this.decodeOnceFromStream(stream, videoSource);
  }

  decodeOnceFromStream = async (
    stream: MediaStream,
    videoSource?: string | HTMLVideoElement
  ): Promise<ReaderResult> => {
    this.reset();

    const video = await this.attachStreamToVideo(stream, videoSource);
    const result = await this.decodeOnce(video);

    return result;
  }

  decodeFromInputVideoDeviceContinuously = async (
    deviceId: string | null,
    videoSource: string | HTMLVideoElement | null,
    callbackFn: DecodeContinuouslyCallback
  ): Promise<void> => await this.decodeFromVideoDevice(deviceId, videoSource, callbackFn);

  decodeFromVideoDevice = async (
    deviceId: string | null,
    videoSource: string | HTMLVideoElement | null,
    callbackFn: DecodeContinuouslyCallback
  ): Promise<void> => {
    let videoConstraints: MediaTrackConstraints;

    if (!deviceId)
      videoConstraints = { facingMode: 'environment' };
    else
      videoConstraints = { deviceId: { exact: deviceId } };

    const constraints: MediaStreamConstraints = { video: videoConstraints };
    return await this.decodeFromConstraints(constraints, videoSource, callbackFn);
  }

  decodeFromConstraints = async (
    constraints: MediaStreamConstraints,
    videoSource: string | HTMLVideoElement,
    callbackFn: DecodeContinuouslyCallback
  ): Promise<void> => {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return await this.decodeFromStream(stream, videoSource, callbackFn);
  }

  decodeFromStream = async (
    stream: MediaStream,
    videoSource: string | HTMLVideoElement,
    callbackFn: DecodeContinuouslyCallback
  ) => {
    this.reset();

    const video = await this.attachStreamToVideo(stream, videoSource);

    return await this.decodeContinuously(video, callbackFn);
  }

  stopAsyncDecode = () => this._stopAsyncDecode = true;
  stopContinuousDecode = () => this._stopContinuousDecode = true;

  isVideoPlaying = (video: HTMLVideoElement): boolean =>
    video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2;

  tryPlayVideo = async (videoElement: HTMLVideoElement): Promise<void> => {
    if (this.isVideoPlaying(videoElement)) {
      console.warn('Trying to play video that is already playing.');
      return;
    }

    try {
      await videoElement.play();
    } catch { }
  }

  getMediaElement = (mediaElementId: string, type: string): HTMLVisualMediaElement => {
    const mediaElement = document.getElementById(mediaElementId);

    if (!mediaElement)
      throw new ArgumentException(`Element with id ${mediaElementId} not found`);

    if (mediaElement.nodeName.toLowerCase() !== type.toLowerCase())
      throw new ArgumentException(`Element with id ${mediaElementId} must be of type ${type}`);

    return <HTMLVisualMediaElement>mediaElement;
  }

  decodeFromImage = (source?: string | HTMLImageElement, url?: string): Promise<ReaderResult> => {
    if (!source && !url)
      throw new ArgumentException(`Either imageElement with a src set or a URL must be provided`);

    if (url && !source)
      return this.decodeFromImageUrl(url);

    return this.decodeFromImageElement(source);
  }

  decodeFromVideo = (source?: string | HTMLVideoElement, url?: string): Promise<ReaderResult> => {
    if (!source && !url)
      throw new ArgumentException(`Either an element with a src set or a URL must be provided`);

    if (url && !source)
      return this.decodeFromVideoUrl(url);

    return this.decodeFromVideoElement(source);
  }

  decodeFromVideoContinuously = (
    source: string | HTMLVideoElement | null,
    url: string | null,
    callbackFn: DecodeContinuouslyCallback
  ): Promise<void> => {
    if (!source && !url)
      throw new ArgumentException(`Either an element with a src set or a URL must be provided`);

    if (url && !source)
      return this.decodeFromVideoUrlContinuously(url, callbackFn);

    return this.decodeFromVideoElementContinuously(source, callbackFn);
  }

  decodeFromImageElement = (source: string | HTMLImageElement): Promise<ReaderResult> => {
    if (!source)
      throw new ArgumentException(`An image element must be provided`);

    this.reset();

    const element = this.prepareImageElement(source);

    this.imageElement = element;

    let task: Promise<ReaderResult>;

    if (this.isImageLoaded(element))
      task = this.decodeOnce(element, false, true);
    else
      task = this._decodeOnLoadImage(element);

    return task;
  }

  decodeFromVideoElement = (source: string | HTMLVideoElement): Promise<ReaderResult> => {
    const element = this._decodeFromVideoElementSetup(source);
    return this._decodeOnLoadVideo(element);
  }

  decodeFromVideoElementContinuously = (source: string | HTMLVideoElement, callbackFn: DecodeContinuouslyCallback): Promise<void> => {
    const element = this._decodeFromVideoElementSetup(source);
    return this._decodeOnLoadVideoContinuously(element, callbackFn);
  }

  decodeFromImageUrl = (url: string): Promise<ReaderResult> => {
    if (!url)
      throw new ArgumentException(`A URL must be provided`);

    this.reset();

    const element = this.prepareImageElement();
    this.imageElement = element;
    const decodeTask = this._decodeOnLoadImage(element);
    element.src = url;

    return decodeTask;
  }

  decodeFromVideoUrl = (url: string): Promise<ReaderResult> => {
    if (!url)
      throw new ArgumentException(`A URL must be provided`);

    this.reset();

    const element = this.prepareVideoElement();
    const decodeTask = this.decodeFromVideoElement(element);
    element.src = url;

    return decodeTask;
  }

  decodeFromVideoUrlContinuously = (url: string, callbackFn: DecodeContinuouslyCallback): Promise<void> => {
    if (!url)
      throw new ArgumentException(`A URL must be provided`);

    this.reset();

    const element = this.prepareVideoElement();
    const decodeTask = this.decodeFromVideoElementContinuously(element, callbackFn);
    element.src = url;

    return decodeTask;
  }

  isImageLoaded = (img: HTMLImageElement) => !img.complete
    ? false
    : img.naturalWidth === 0
      ? false
      : true;

  prepareImageElement = (imageSource?: HTMLImageElement | string): HTMLImageElement => {
    let imageElement: HTMLImageElement;

    if (typeof imageSource === 'undefined') {
      imageElement = document.createElement('img');
      imageElement.width = 200;
      imageElement.height = 200;
    }

    if (typeof imageSource === 'string')
      imageElement = <HTMLImageElement>this.getMediaElement(imageSource, 'img');

    if (imageSource instanceof HTMLImageElement)
      imageElement = imageSource;

    return imageElement;
  }

  prepareVideoElement = (videoSource?: HTMLVideoElement | string): HTMLVideoElement => {
    let videoElement: HTMLVideoElement;

    if (!videoSource && typeof document !== 'undefined') {
      videoElement = document.createElement('video');
      videoElement.width = 200;
      videoElement.height = 200;
    }

    if (typeof videoSource === 'string')
      videoElement = <HTMLVideoElement>this.getMediaElement(videoSource, 'video');

    if (videoSource instanceof HTMLVideoElement)
      videoElement = videoSource;

    videoElement.setAttribute('autoplay', 'true');
    videoElement.setAttribute('muted', 'true');
    videoElement.setAttribute('playsinline', 'true');

    return videoElement;
  }

  decodeOnce = (
    element: HTMLVisualMediaElement,
    retryIfNotFound = true,
    retryIfChecksumOrFormatError = true
  ): Promise<ReaderResult> => {
    this._stopAsyncDecode = false;

    const loop = (resolve: (value?: ReaderResult | PromiseLike<ReaderResult>) => void, reject: (reason?: any) => void) => {
      if (this._stopAsyncDecode) {
        reject(new NotFoundException('Video stream has ended before any code could be detected.'));
        this._stopAsyncDecode = undefined;
        return;
      }

      try {
        const result = this.decode(element);
        resolve(result);
      } catch (e) {
        const ifNotFound = retryIfNotFound && e instanceof NotFoundException;
        const isChecksumOrFormatError = e instanceof ChecksumException || e instanceof FormatException;
        const ifChecksumOrFormat = isChecksumOrFormatError && retryIfChecksumOrFormatError;

        if (ifNotFound || ifChecksumOrFormat)
          return setTimeout(() => loop(resolve, reject), this._timeBetweenDecodingAttempts);

        reject(e);
      }
    };

    return new Promise((resolve, reject) => loop(resolve, reject));
  }

  decodeContinuously = (element: HTMLVideoElement, callbackFn: DecodeContinuouslyCallback) => {
    this._stopContinuousDecode = false;

    const loop = () => {
      if (this._stopContinuousDecode) {
        this._stopContinuousDecode = undefined;
        return;
      }

      try {
        const result = this.decode(element);
        callbackFn(result, null);
        setTimeout(() => loop(), this.timeBetweenScansMillis);
      } catch (e) {
        callbackFn(null, e);

        const isChecksumOrFormatError = e instanceof ChecksumException || e instanceof FormatException;
        const isNotFound = e instanceof NotFoundException;

        if (isChecksumOrFormatError || isNotFound)
          setTimeout(() => loop(), this._timeBetweenDecodingAttempts);
      }
    };

    loop();
  }

  decode = (element: HTMLVisualMediaElement): ReaderResult => {
    const binaryBitmap = this.createBinaryBitmap(element);
    return this.decodeBitmap(binaryBitmap);
  }

  createBinaryBitmap = (mediaElement: HTMLVisualMediaElement): BinaryBitmap => {
    const ctx = this.getCaptureCanvasContext(mediaElement);

    this.drawImageOnCanvas(ctx, mediaElement);

    const canvas = this.getCaptureCanvas(mediaElement);

    const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
    const hybridBinarizer = new HybridBinarizer(luminanceSource);

    return new BinaryBitmap(hybridBinarizer);
  }

  drawImageOnCanvas = (canvasElementContext: CanvasRenderingContext2D, srcElement: HTMLVisualMediaElement) =>
    canvasElementContext.drawImage(srcElement, 0, 0);

  decodeBitmap = (binaryBitmap: BinaryBitmap): ReaderResult => this.reader.decode(binaryBitmap, this._hints);

  createCaptureCanvas = (mediaElement?: HTMLVisualMediaElement): HTMLCanvasElement => {
    if (typeof document === 'undefined') {
      this._destroyCaptureCanvas();
      return null;
    }

    const canvasElement = document.createElement('canvas');

    let width: number;
    let height: number;

    if (typeof mediaElement !== 'undefined')
      if (mediaElement instanceof HTMLVideoElement) {
        width = mediaElement.videoWidth;
        height = mediaElement.videoHeight
      } else if (mediaElement instanceof HTMLImageElement) {
        width = mediaElement.naturalWidth || mediaElement.width;
        height = mediaElement.naturalHeight || mediaElement.height;
      }

    canvasElement.style.width = `${width}px`;
    canvasElement.style.height = `${height}px`;
    canvasElement.width = width;
    canvasElement.height = height;

    return canvasElement;
  }

  reset = () => {
    this.stopStreams();

    this._destroyVideoElement();
    this._destroyImageElement();
    this._destroyCaptureCanvas();
  }

  addVideoSource = (videoElement: HTMLVideoElement, stream: MediaStream) => {
    try {
      videoElement.srcObject = stream;
    } catch {
      videoElement.src = URL.createObjectURL(stream);
    }
  }
}
