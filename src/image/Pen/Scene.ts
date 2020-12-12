import ResizeObserver from "resize-observer-polyfill";
import { CatenaryCurve } from "./CatenaryCurve";
import { midpoint, Point } from "./Point";
import { Pen } from "./Pen";

const LAZY_RADIUS = 60;

export class Scene {
  private sidebar: HTMLElement | null;
  private canvasContainer: HTMLElement | null;
  private catenary: CatenaryCurve;
  private points: any[];
  private mouseHasMoved: boolean;
  private valuesChanged: boolean;
  private isDrawing: boolean;
  private isPressing: boolean;
  private devicePixelRatio: number;
  private brushRadius: any;
  private chainLength: any;

  button: {
    clear: HTMLElement;
    lazy: HTMLElement;
    menu: HTMLElement;
  };

  canvases: {
    drawing?: HTMLCanvasElement;
    grid?: HTMLCanvasElement;
    interface?: HTMLCanvasElement;
    temp?: HTMLCanvasElement;
  };

  contexts: {
    drawing?: CanvasRenderingContext2D;
    grid?: CanvasRenderingContext2D;
    interface?: CanvasRenderingContext2D;
    temp?: CanvasRenderingContext2D;
  };

  sliders: {
    brush?: HTMLInputElement;
    lazy?: HTMLInputElement;
  };

  private pen: Pen;

  constructor({
    canvasContainer,
    sidebar,
    canvas,
    slider,
    button,
  }: {
    canvasContainer: string;
    sidebar: string;
    canvas: string;
    slider: string;
    button: string;
  }) {
    this.sidebar = document.getElementById(sidebar);
    this.canvasContainer = document.getElementById(canvasContainer);

    this.button = {};
    Object.keys(button).forEach((b) => {
      this.button[b] = document.getElementById(button[b]);
    });

    this.sliders = {};
    Object.keys(slider).forEach((s) => {
      this.sliders[s] = document.getElementById(slider[s]);
    });

    this.canvases = {};
    this.contexts = {};

    Object.keys(canvas).forEach((c) => {
      const el = document.getElementById(canvas[c]);
      this.canvases[c] = el;
      this.contexts[c] = el.getContext("2d");
    });

    this.catenary = new CatenaryCurve();

    const point = new Point({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    this.pen = new Pen(true, point, LAZY_RADIUS);

    this.points = [];

    this.mouseHasMoved = true;
    this.valuesChanged = true;
    this.isDrawing = false;
    this.isPressing = false;

    this.points = [];

    this.brushRadius = BRUSH_RADIUS;
    this.chainLength = LAZY_RADIUS;

    this.devicePixelRatio = 1;
  }

  clear() {
    this.valuesChanged = true;

    if (this.contexts.drawing) {
      this.contexts.drawing.clearRect(
        0,
        0,
        this.canvases.drawing?.width as number,
        this.canvases.drawing?.height as number
      );
    }

    if (this.contexts.temp) {
      this.contexts.temp.clearRect(
        0,
        0,
        this.canvases.temp?.width as number,
        this.canvases.temp?.height as number
      );
    }
  }

  drawBackground(context: CanvasRenderingContext2D) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    context.beginPath();
    context.setLineDash([5, 1]);
    context.setLineDash([]);
    // ctx.strokeStyle = styleVariables.colorInterfaceGrid
    context.strokeStyle = "rgba(150,150,150,0.17)";
    context.lineWidth = 0.5;

    const gridSize = 25;

    let countX = 0;
    while (countX < context.canvas.width) {
      countX += gridSize;
      context.moveTo(countX, 0);
      context.lineTo(countX, context.canvas.height);
    }
    context.stroke();

    let countY = 0;
    while (countY < context.canvas.height) {
      countY += gridSize;
      context.moveTo(0, countY);
      context.lineTo(context.canvas.width, countY);
    }
    context.stroke();
  }

  init() {
    if (this.canvases.interface) {
      this.canvases.interface.addEventListener("contextmenu", (event) => {
        this.onContextMenu(event);
      });

      this.canvases.interface.addEventListener("mousedown", () => {
        this.onMouseDown.bind(this);
      });

      this.canvases.interface.addEventListener("mousemove", (event) => {
        this.onMouseMove(event.clientX, event.clientY);
      });

      this.canvases.interface.addEventListener("mouseup", () => {
        this.onMouseUp.bind(this);
      });

      this.canvases.interface.addEventListener("touchend", (event) => {
        this.onTouchEnd(event);
      });

      this.canvases.interface.addEventListener("touchmove", (event) => {
        this.onTouchMove(event);
      });

      this.canvases.interface.addEventListener("touchstart", (event) => {
        this.onTouchStart(event);
      });
    }

    if (this.button.clear) {
      this.button.clear.addEventListener("click", (event) => {
        this.onClearButtonClick(event);
      });
    }

    if (this.button.lazy) {
      this.button.lazy.addEventListener("click", (event) => {
        this.onLazyButtonClick(event);
      });
    }

    if (this.button.menu) {
      this.button.menu.addEventListener("click", (event) => {
        this.onMenuButtonClick(event);
      });
    }

    if (this.sliders.brush) {
      this.sliders.brush.addEventListener("input", (event: any) => {
        this.handleSliderBrush(event);
      });
    }

    if (this.sliders.lazy) {
      this.sliders.lazy.addEventListener("input", (e: any) => {
        this.handleSliderLazy(e);
      });
    }

    if (this.sliders.brush) {
      this.sliders.brush.value = "12.5";
    }

    if (this.sliders.lazy) {
      this.sliders.lazy.value = "60";
    }

    const observeCanvas = new ResizeObserver((entries, observer) =>
      this.onCanvasResize(entries, observer)
    );
    observeCanvas.observe(this.canvasContainer!);

    const observeSidebar = new ResizeObserver((entries, observer) =>
      this.onSidebarResize(entries, observer)
    );
    observeSidebar.observe(this.sidebar!);

    this.render();

    window.setTimeout(() => {
      const initX = window.innerWidth / 2;
      const initY = window.innerHeight / 2;

      this.pen.update(
        new Point({ x: initX - this.chainLength / 4, y: initY }),
        true
      );

      this.pen.update(
        new Point({ x: initX + this.chainLength / 4, y: initY }),
        false
      );

      this.mouseHasMoved = true;
      this.valuesChanged = true;

      this.clear();
    }, 100);
  }

  onCanvasResize(entries: Array<ResizeObserverEntry>, observer: any) {
    this.devicePixelRatio = window.devicePixelRatio;

    for (const entry of entries) {
      const { width, height } = entry.contentRect;

      this.setCanvasSize(this.canvases.interface!, width, height, 1.25);
      this.setCanvasSize(this.canvases.drawing!, width, height, 1);
      this.setCanvasSize(this.canvases.temp!, width, height, 1);
      this.setCanvasSize(this.canvases.grid!, width, height, 2);

      if (this.contexts.grid) {
        this.drawBackground(this.contexts.grid);
      }

      this.render({ once: true });
    }
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();

    if (event.button === 2) this.clear();
  }

  onMouseDown(event: TouchEvent) {
    event.preventDefault();

    this.isPressing = true;
  }

  onMouseMove(x: number, y: number) {
    const hasChanged = this.pen.update(new Point({ x: x, y: y }));
    const isDisabled = !this.pen.isEnabled();

    this.contexts.temp!.lineJoin = "round";
    this.contexts.temp!.lineCap = "round";
    this.contexts.temp!.strokeStyle = "#f2530b";

    if (
      (this.isPressing && hasChanged && !this.isDrawing) ||
      (isDisabled && this.isPressing)
    ) {
      this.isDrawing = true;
      this.points.push(this.pen.tip.toObject());
    }

    if (this.isDrawing && (this.pen.moved || isDisabled)) {
      this.contexts.temp?.clearRect(
        0,
        0,
        this.contexts.temp!.canvas.width,
        this.contexts.temp!.canvas.height
      );
      this.contexts.temp!.lineWidth = this.brushRadius * 2;
      this.points.push(this.pen.tip.toObject());

      let p1 = this.points[0];
      let p2 = this.points[1];

      this.contexts.temp?.moveTo(p2.x, p2.y);
      this.contexts.temp?.beginPath();

      for (let i = 1, len = this.points.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        const midPoint = midpoint(p1, p2);

        this.contexts.temp?.quadraticCurveTo(
          p1.x,
          p1.y,
          midPoint.x,
          midPoint.y
        );

        p1 = this.points[i];
        p2 = this.points[i + 1];
      }

      // Draw last line as a straight line while
      // we wait for the next point to be able to calculate
      // the bezier control point
      this.contexts.temp?.lineTo(p1.x, p1.y);
      this.contexts.temp?.stroke();
    }

    this.mouseHasMoved = true;
  }

  onMouseUp(event: TouchEvent) {
    event.preventDefault();
    this.isDrawing = false;
    this.isPressing = false;
    this.points.length = 0;

    const dpi = window.innerWidth > 1024 ? 1 : window.devicePixelRatio;
    const width = this.canvases.temp!.width / dpi;
    const height = this.canvases.temp!.height / dpi;

    this.contexts.drawing?.drawImage(this.canvases.temp!, 0, 0, width, height);
    this.contexts.temp?.clearRect(0, 0, width, height);
  }

  onSidebarResize(entries: Array<ResizeObserverEntry>, observer: any) {
    for (const entry of entries) {
      const { left, top, width, height } = entry.contentRect;
      this.render({ once: true });
    }
  }

  onTouchEnd(event: TouchEvent) {
    this.onMouseUp(event);
    const brush = this.pen.getTipCoordinates();
    this.pen.update(new Point({ x: brush.x, y: brush.y }), true);
    this.mouseHasMoved = true;
  }

  onTouchMove(event: TouchEvent) {
    event.preventDefault();

    this.onMouseMove(
      event.changedTouches[0].clientX,
      event.changedTouches[0].clientY
    );
  }

  onTouchStart(event: TouchEvent) {
    const x = event.changedTouches[0].clientX;
    const y = event.changedTouches[0].clientY;

    this.pen.update(new Point({ x: x, y: y }), true);

    this.onMouseDown(event);

    this.mouseHasMoved = true;
  }

  onMenuButtonClick(event: MouseEvent) {
    event.preventDefault();

    document.body.classList.toggle("menu-visible");
  }

  onClearButtonClick(event: MouseEvent) {
    event.preventDefault();

    this.clear();
  }

  onLazyButtonClick(event: MouseEvent) {
    event.preventDefault();

    this.valuesChanged = true;

    this.button.lazy.classList.toggle("disabled");

    if (this.pen.enabled) {
      this.button.lazy.innerHTML = "Off";

      this.pen.disable();
    } else {
      this.button.lazy.innerHTML = "On";

      this.pen.enable();
    }
  }

  handleSliderBrush(event: any) {
    const val = parseInt(event.target.value);
    this.valuesChanged = true;
    this.brushRadius = val;
  }

  handleSliderLazy(event: any) {
    this.valuesChanged = true;
    const val = parseInt(event.target.value);
    this.chainLength = val;
    this.pen.setRadius(val);
  }

  render({ once = false } = {}) {
    if (this.mouseHasMoved || this.valuesChanged) {
      const pointer = this.pen.getPointerCoordinates();

      const brush = this.pen.getTipCoordinates();

      if (this.contexts.interface) {
        this.contexts.interface.clearRect(
          0,
          0,
          this.contexts.interface.canvas.width,
          this.contexts.interface.canvas.height
        );

        // Pen tip
        this.contexts.interface.beginPath();
        this.contexts.interface.fillStyle = "#f2530b";
        this.contexts.interface.arc(
          new Point(brush).x,
          new Point(brush).y,
          this.brushRadius,
          0,
          Math.PI * 2,
          true
        );
        this.contexts.interface.fill();

        // Pointer
        this.contexts.interface.beginPath();
        this.contexts.interface.fillStyle = "#0a0302";
        this.contexts.interface.arc(
          new Point(pointer).x,
          new Point(pointer).y,
          4,
          0,
          Math.PI * 2,
          true
        );
        this.contexts.interface.fill();

        // Catenary curve
        if (this.pen.enabled) {
          this.contexts.interface.beginPath();
          this.contexts.interface.lineWidth = 2;
          this.contexts.interface.lineCap = "round";
          this.contexts.interface.setLineDash([2, 4]);
          this.contexts.interface.strokeStyle = "#0a0302";
          this.catenary.drawToCanvas(
            this.contexts.interface,
            new Point(brush),
            new Point(pointer),
            this.chainLength
          );
          this.contexts.interface.stroke();
        }

        // Pointer
        this.contexts.interface.beginPath();
        this.contexts.interface.fillStyle = "#222222";
        this.contexts.interface.arc(
          new Point(brush).x,
          new Point(brush).y,
          2,
          0,
          Math.PI * 2,
          true
        );
        this.contexts.interface.fill();
      }

      this.mouseHasMoved = false;
      this.valuesChanged = false;
    }

    if (!once) {
      window.requestAnimationFrame(() => {
        this.render();
      });
    }
  }

  setCanvasSize(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    maximum: number = 4
  ) {
    let devicePixelRatio;

    if (window.innerWidth > 1024) {
      devicePixelRatio = Math.min(this.devicePixelRatio, maximum);
    } else {
      devicePixelRatio = this.devicePixelRatio;
    }

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = String(width);
    canvas.style.height = String(height);

    const context = canvas.getContext("2d");

    if (context) {
      context.scale(devicePixelRatio, devicePixelRatio);
    }
  }
}
