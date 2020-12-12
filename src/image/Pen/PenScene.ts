import ResizeObserver from "resize-observer-polyfill";
import { CatenaryCurve } from "./CatenaryCurve";
import { Point } from "./Point";
import { Pen } from "./Pen";

const LAZY_RADIUS = 60;
const BRUSH_RADIUS = 12.5;

export class Scene {
  private sidebar: HTMLElement | null;
  private canvasContainer: HTMLElement | null;
  private catenary: CatenaryCurve;
  private points: any[];
  private mouseHasMoved: boolean;
  private valuesChanged: boolean;
  private isDrawing: boolean;
  private isPressing: boolean;
  private dpi: number;
  private brushRadius: any;
  private chainLength: any;

  button: {
    clear: HTMLCanvasElement;
    lazy: HTMLCanvasElement;
    menu: HTMLCanvasElement;
  };

  canvas: {
    drawing?: HTMLCanvasElement;
    grid?: HTMLCanvasElement;
    interface?: HTMLCanvasElement;
    temp?: HTMLCanvasElement;
  };

  context: {
    drawing?: CanvasRenderingContext2D;
    grid?: CanvasRenderingContext2D;
    interface?: CanvasRenderingContext2D;
    temp?: CanvasRenderingContext2D;
  };

  slider: {
    brush?: {};
    lazy?: {};
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

    this.slider = {};
    Object.keys(slider).forEach((s) => {
      this.slider[s] = document.getElementById(slider[s]);
    });

    this.canvas = {};
    this.context = {};
    Object.keys(canvas).forEach((c) => {
      const el = document.getElementById(canvas[c]);
      this.canvas[c] = el;
      this.context[c] = el.getContext("2d");
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

    this.dpi = 1;
  }

  init() {
    // Listeners for mouse events
    this.canvas.interface?.addEventListener(
      "mousedown",
      this.handlePointerDown.bind(this)
    );
    this.canvas.interface?.addEventListener(
      "mouseup",
      this.handlePointerUp.bind(this)
    );
    this.canvas.interface?.addEventListener("mousemove", (e) =>
      this.handlePointerMove(e.clientX, e.clientY)
    );
    this.canvas.interface?.addEventListener("contextmenu", (e) =>
      this.handleContextMenu(e)
    );

    // Listeners for touch events
    this.canvas.interface?.addEventListener("touchstart", (e) =>
      this.handleTouchStart(e)
    );
    this.canvas.interface?.addEventListener("touchend", (e) =>
      this.handleTouchEnd(e)
    );
    this.canvas.interface?.addEventListener("touchmove", (e) =>
      this.handleTouchMove(e)
    );

    // Listeners for click events on butons
    this.button.menu.addEventListener("click", (e) => this.handleButtonMenu(e));
    this.button.clear.addEventListener("click", (e) =>
      this.handleButtonClear(e)
    );
    this.button.lazy.addEventListener("click", (e) => this.handleButtonLazy(e));

    // Listeners for input events on range sliders
    this.slider.brush.addEventListener("input", (e) =>
      this.handleSliderBrush(e)
    );

    this.slider.lazy?.addEventListener("input", (e) =>
      this.handleSliderLazy(e)
    );

    // Set initial value for range sliders
    this.slider.brush!.value = BRUSH_RADIUS;
    this.slider.lazy!.value = LAZY_RADIUS;

    const observeCanvas = new ResizeObserver((entries, observer) =>
      this.handleCanvasResize(entries, observer)
    );
    observeCanvas.observe(this.canvasContainer!);

    const observeSidebar = new ResizeObserver((entries, observer) =>
      this.handleSidebarResize(entries, observer)
    );

    observeSidebar.observe(this.sidebar!);

    this.loop();

    window.setTimeout(() => {
      const initX = window.innerWidth / 2;
      const initY = window.innerHeight / 2;
      this.pen.update(
        { x: initX - this.chainLength / 4, y: initY },
        { both: true }
      );
      this.pen.update(
        { x: initX + this.chainLength / 4, y: initY },
        { both: false }
      );
      this.mouseHasMoved = true;
      this.valuesChanged = true;
      this.clearCanvas();
    }, 100);
  }

  handleTouchStart(e) {
    const x = e.changedTouches[0].clientX;
    const y = e.changedTouches[0].clientY;
    this.pen.update({ x: x, y: y }, { both: true });
    this.handlePointerDown(e);

    this.mouseHasMoved = true;
  }

  handleTouchMove(e) {
    e.preventDefault();
    this.handlePointerMove(
      e.changedTouches[0].clientX,
      e.changedTouches[0].clientY
    );
  }

  handleTouchEnd(e) {
    this.handlePointerUp(e);
    const brush = this.pen.getTipCoordinates();
    this.pen.update({ x: brush.x, y: brush.y }, { both: true });
    this.mouseHasMoved = true;
  }

  handleContextMenu(e) {
    e.preventDefault();
    if (e.button === 2) {
      this.clearCanvas();
    }
  }

  handleButtonMenu(e) {
    e.preventDefault();
    document.body.classList.toggle("menu-visible");
  }

  handleButtonClear(e) {
    e.preventDefault();
    this.clearCanvas();
  }

  handleButtonLazy(e) {
    e.preventDefault();
    this.valuesChanged = true;
    this.button.lazy.classList.toggle("disabled");

    if (this.pen.isEnabled()) {
      this.button.lazy.innerHTML = "Off";
      this.pen.disable();
    } else {
      this.button.lazy.innerHTML = "On";
      this.pen.enable();
    }
  }

  handleSidebarResize(entries: Array<ResizeObserverEntry>, observer: any) {
    for (const entry of entries) {
      const { left, top, width, height } = entry.contentRect;
      this.loop({ once: true });
    }
  }

  handleCanvasResize(entries: Array<ResizeObserverEntry>, observer: any) {
    this.dpi = window.devicePixelRatio;

    for (const entry of entries) {
      const { width, height } = entry.contentRect;
      this.setCanvasSize(this.canvas.interface!, width, height, 1.25);
      this.setCanvasSize(this.canvas.drawing!, width, height, 1);
      this.setCanvasSize(this.canvas.temp!, width, height, 1);
      this.setCanvasSize(this.canvas.grid!, width, height, 2);

      this.drawGrid(this.context.grid!);
      this.loop({ once: true });
    }
  }

  handleSliderBrush(e) {
    const val = parseInt(e.target.value);
    this.valuesChanged = true;
    this.brushRadius = val;
  }

  handleSliderLazy(e) {
    this.valuesChanged = true;
    const val = parseInt(e.target.value);
    this.chainLength = val;
    this.pen.setRadius(val);
  }

  setCanvasSize(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    maxDpi: number = 4
  ) {
    let dpi = this.dpi;

    // reduce canvas size for hidpi desktop screens
    if (window.innerWidth > 1024) {
      dpi = Math.min(this.dpi, maxDpi);
    }

    canvas.width = width * dpi;
    canvas.height = height * dpi;
    canvas.style.width = String(width);
    canvas.style.height = String(height);

    const context = canvas.getContext("2d");

    context?.scale(dpi, dpi);
  }

  handlePointerDown(e) {
    e.preventDefault();
    this.isPressing = true;
  }

  handlePointerUp(e) {
    e.preventDefault();
    this.isDrawing = false;
    this.isPressing = false;
    this.points.length = 0;

    const dpi = window.innerWidth > 1024 ? 1 : window.devicePixelRatio;
    const width = this.canvas.temp!.width / dpi;
    const height = this.canvas.temp!.height / dpi;

    this.context.drawing?.drawImage(this.canvas.temp!, 0, 0, width, height);
    this.context.temp?.clearRect(0, 0, width, height);
  }

  handlePointerMove(x: number, y: number) {
    const hasChanged = this.pen.update(new Point({ x: x, y: y }));
    const isDisabled = !this.pen.isEnabled();

    this.context.temp!.lineJoin = "round";
    this.context.temp!.lineCap = "round";
    this.context.temp!.strokeStyle = "#f2530b";

    if (
      (this.isPressing && hasChanged && !this.isDrawing) ||
      (isDisabled && this.isPressing)
    ) {
      this.isDrawing = true;
      this.points.push(this.pen.tip.toObject());
    }

    if (this.isDrawing && (this.pen.moved || isDisabled)) {
      this.context.temp?.clearRect(
        0,
        0,
        this.context.temp!.canvas.width,
        this.context.temp!.canvas.height
      );
      this.context.temp!.lineWidth = this.brushRadius * 2;
      this.points.push(this.pen.tip.toObject());

      let p1 = this.points[0];
      let p2 = this.points[1];

      this.context.temp?.moveTo(p2.x, p2.y);
      this.context.temp?.beginPath();

      for (let i = 1, len = this.points.length; i < len; i++) {
        // we pick the point between pi+1 & pi+2 as the
        // end point and p1 as our control point
        const midPoint = midPointBtw(p1, p2);
        this.context.temp?.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
        p1 = this.points[i];
        p2 = this.points[i + 1];
      }

      // Draw last line as a straight line while
      // we wait for the next point to be able to calculate
      // the bezier control point
      this.context.temp?.lineTo(p1.x, p1.y);
      this.context.temp?.stroke();
    }

    this.mouseHasMoved = true;
  }

  clearCanvas() {
    this.valuesChanged = true;

    this.context.drawing?.clearRect(
      0,
      0,
      this.canvas.drawing?.width as number,
      this.canvas.drawing?.height as number
    );

    this.context.temp?.clearRect(
      0,
      0,
      this.canvas.temp?.width as number,
      this.canvas.temp?.height as number
    );
  }

  loop({ once = false } = {}) {
    if (this.mouseHasMoved || this.valuesChanged) {
      const pointer = this.pen.getPointerCoordinates();

      const brush = this.pen.getTipCoordinates();

      this.drawInterface(
        this.context.interface!,
        new Point(pointer),
        new Point(brush)
      );

      this.mouseHasMoved = false;

      this.valuesChanged = false;
    }

    if (!once) {
      window.requestAnimationFrame(() => {
        this.loop();
      });
    }
  }

  drawGrid(context: CanvasRenderingContext2D) {
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

  drawInterface(
    context: CanvasRenderingContext2D,
    pointer: Point,
    brush: Point
  ) {
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    // Draw brush point
    context.beginPath();
    context.fillStyle = "#f2530b";
    context.arc(brush.x, brush.y, this.brushRadius, 0, Math.PI * 2, true);
    context.fill();

    // Draw mouse point
    context.beginPath();
    context.fillStyle = "#0a0302";
    context.arc(pointer.x, pointer.y, 4, 0, Math.PI * 2, true);
    context.fill();

    //Draw catharina
    if (this.pen.isEnabled()) {
      context.beginPath();
      context.lineWidth = 2;
      context.lineCap = "round";
      context.setLineDash([2, 4]);
      context.strokeStyle = "#0a0302";
      this.catenary.drawToCanvas(
        this.context.interface!,
        brush,
        pointer,
        this.chainLength
      );
      context.stroke();
    }

    // Draw mouse point
    context.beginPath();
    context.fillStyle = "#222222";
    context.arc(brush.x, brush.y, 2, 0, Math.PI * 2, true);
    context.fill();
  }
}
