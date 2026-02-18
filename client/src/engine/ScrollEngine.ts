import { CatmullRomCurve3, Vector3 } from 'three';

interface ScrollConfig {
  maxSpeed: number;
  smoothingFactor: number;
  duration: number;
  deadzone: number;
}

interface ScrollState {
  progress: number;
  velocity: number;
  rawProgress: number;
  isScrolling: boolean;
  direction: 'forward' | 'backward' | 'idle';
}

const DEFAULT_CONFIG: ScrollConfig = {
  maxSpeed: 1 / 20,
  smoothingFactor: 0.08,
  duration: 20000,
  deadzone: 0.001,
};

export class ScrollEngine {
  private config: ScrollConfig;
  private state: ScrollState;
  private cameraPath: CatmullRomCurve3;
  private controlPoints: Vector3[];
  private listeners: Map<string, Set<Function>>;
  private rafId: number | null = null;
  private lastTimestamp: number = 0;
  private accumulatedDelta: number = 0;

  constructor(controlPoints: Vector3[], config: Partial<ScrollConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.controlPoints = controlPoints;
    this.listeners = new Map();

    this.state = {
      progress: 0,
      velocity: 0,
      rawProgress: 0,
      isScrolling: false,
      direction: 'idle',
    };

    this.cameraPath = new CatmullRomCurve3(
      this.controlPoints,
      false,
      'catmullrom',
      0.5
    );

    this.bindEvents();
  }

  private bindEvents(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('wheel', this.onWheel, { passive: false });
    window.addEventListener('touchstart', this.onTouchStart, { passive: true });
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const delta = event.deltaY / this.config.duration;
    this.accumulatedDelta += Math.max(
      -this.config.maxSpeed,
      Math.min(this.config.maxSpeed, delta)
    );
  };

  private touchStartY: number = 0;
  private touchStartProgress: number = 0;

  private onTouchStart = (event: TouchEvent): void => {
    this.touchStartY = event.touches[0].clientY;
    this.touchStartProgress = this.state.rawProgress;
  };

  private onTouchMove = (event: TouchEvent): void => {
    event.preventDefault();
    const deltaY = this.touchStartY - event.touches[0].clientY;
    const normalizedDelta = deltaY / window.innerHeight;
    this.state.rawProgress = Math.max(
      0,
      Math.min(1, this.touchStartProgress + normalizedDelta * 0.5)
    );
  };

  private onTouchEnd = (): void => {
    this.state.isScrolling = false;
  };

  public start(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    this.tick(this.lastTimestamp);
  }

  public stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private tick = (timestamp: number): void => {
    const dt = Math.min(timestamp - this.lastTimestamp, 50);
    this.lastTimestamp = timestamp;

    this.state.rawProgress += this.accumulatedDelta;
    this.state.rawProgress = Math.max(0, Math.min(1, this.state.rawProgress));
    this.accumulatedDelta *= 0.85;

    if (Math.abs(this.accumulatedDelta) < 0.00001) {
      this.accumulatedDelta = 0;
    }

    const prevProgress = this.state.progress;
    this.state.progress +=
      (this.state.rawProgress - this.state.progress) *
      this.config.smoothingFactor;

    this.state.velocity = (this.state.progress - prevProgress) / (dt / 1000);
    this.state.isScrolling =
      Math.abs(this.state.velocity) > this.config.deadzone;
    this.state.direction =
      this.state.velocity > this.config.deadzone
        ? 'forward'
        : this.state.velocity < -this.config.deadzone
          ? 'backward'
          : 'idle';

    this.emit('update', this.state);

    if (this.state.progress >= 0.99) {
      this.emit('complete', this.state);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };

  public getPositionAt(t: number): Vector3 {
    return this.cameraPath.getPointAt(Math.max(0, Math.min(1, t)));
  }

  public getTangentAt(t: number): Vector3 {
    return this.cameraPath.getTangentAt(Math.max(0, Math.min(1, t)));
  }

  public getLookAheadPosition(t: number, offset: number = 0.02): Vector3 {
    return this.getPositionAt(Math.min(1, t + offset));
  }

  public getProgress(): number {
    return this.state.progress;
  }

  public getState(): Readonly<ScrollState> {
    return { ...this.state };
  }

  public on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  public off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((cb) => cb(data));
  }

  public dispose(): void {
    this.stop();
    this.listeners.clear();
    if (typeof window === 'undefined') return;
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchmove', this.onTouchMove);
    window.removeEventListener('touchend', this.onTouchEnd);
  }
}
