import Engine from "./engine";
import CanvasKitInit from "../assets/canvaskit_gles3.js";

document.addEventListener("DOMContentLoaded", () => {
  CanvasKitInit({
    locateFile: file => file
  })
    .ready()
    .then(CanvasKit => {
      const engine = new CanvasKitEngine(CanvasKit);
      engine.init();
      engine.render();
    });
});

window.cancelRequestAnimFrame = (() => {
  return (
    window.cancelAnimationFrame ||
    window.webkitCancelRequestAnimationFrame ||
    window.mozCancelRequestAnimationFrame ||
    window.oCancelRequestAnimationFrame ||
    window.msCancelRequestAnimationFrame ||
    clearTimeout
  );
})();

class CanvasKitEngine extends Engine {
  constructor(CanvasKit) {
    super();
    this.CanvasKit = CanvasKit;
    this.canvas = document.getElementsByTagName("canvas")[0];
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.wrapLogging(this.canvas);
    this.frameNr = 0;
  }

  init() {
    this.surface = this.CanvasKit.MakeWebGLCanvasSurface(this.canvas);
  }

  render() {
    window.cancelRequestAnimFrame(this.request);
    const skcanvas = this.surface.getCanvas();
    const fillPaint = new this.CanvasKit.SkPaint();
    const white = this.CanvasKit.Color(255, 255, 255, 1);
    fillPaint.setStyle(this.CanvasKit.PaintStyle.Fill);
    fillPaint.setColor(white);
    const strokePaint = new this.CanvasKit.SkPaint();
    strokePaint.setStyle(this.CanvasKit.PaintStyle.Stroke);
    strokePaint.setAntiAlias(true);
    strokePaint.setColor(this.CanvasKit.Color(0, 0, 0, 1));
    const rects = {};

    const prog = `
    uniform float rad_scale;
    uniform float2 in_center;
    uniform float4 in_colors0;
    uniform float4 in_colors1;
    
    void main(float2 p, inout half4 color) {
        float2 pp = p - in_center - inPosition;
        float radius = sqrt(dot(pp, pp));
        radius = sqrt(radius);
        float angle = atan(pp.y / pp.x);
        float t = (angle + 3.1415926/2) / (3.1415926);
        t += radius * rad_scale;
        t = fract(t);
        color = half4(mix(in_colors0, in_colors1, t));
    }
    `;

    const fact = this.CanvasKit.SkRuntimeEffect.Make(prog);

    const rect = new this.CanvasKit.XYWHRect(0, 0, this.width, this.height);
    skcanvas.drawRect(rect, fillPaint);
    skcanvas.drawRect(rect, strokePaint);
    skcanvas.flush();
    const image = this.surface.makeImageSnapshot();
    const ipaint = new this.CanvasKit.SkPaint();
    ipaint.setStyle(this.CanvasKit.PaintStyle.Fill);
    ipaint.setFilterQuality(this.CanvasKit.FilterQuality.None);

    for (let i = 0; i < this.count.value; i++) {
      const size = 10 + Math.random() * 40;
      const x = Math.random() * this.width - size / 2;
      const y = Math.random() * this.height - size / 2;
      const speed = 1 + Math.random();
      rects[i] = { x, y, size, speed };
    }

    const srcRect = new this.CanvasKit.XYWHRect(0, 0, this.width, this.height);
    const drawFrame = () => {
      const rectsToRemove = [];
      skcanvas.clear(white);
      for (let i = 0; i < this.count.value; i++) {
        const r = rects[i];
        r.x -= r.speed;
        const { x, y, size } = r;
        //const rect = new this.CanvasKit.XYWHRect(x, y, size, size);
        skcanvas.drawRect(this.CanvasKit.XYWHRect(x, y, size, size), fillPaint);
        skcanvas.drawRect(
          this.CanvasKit.XYWHRect(x, y, size, size),
          strokePaint
        );

        /*skcanvas.drawImageRect(
          image,
          srcRect,
          this.CanvasKit.XYWHRect(x, y, size, size),
          ipaint,
          false
        );*/
        if (r.x + r.size < 0) rectsToRemove.push(i);
      }
      /*
      for (let i = 0; i < this.count.value; i++) {
        const r = rects[i];
        const { x, y, size, picture } = r;
        // const rect = new this.CanvasKit.XYWHRect(x, y, size, size);
        //skcanvas.drawRect(this.CanvasKit.XYWHRect(x, y, size, size), fillPaint);
        skcanvas.drawRect(
          this.CanvasKit.XYWHRect(x, y, size, size),
          strokePaint
        );
        if (r.x + r.size < 0) rectsToRemove.push(i);
      }
      */

      rectsToRemove.forEach(i => {
        rects[i].x = this.width + rects[i].size;
      });
      skcanvas.flush();
      this.meter.tick();
      this.request = requestAnimationFrame(drawFrame);
      if (++this.frameNr % 60 === 0) this.log(this.frameNr);
    };
    this.request = requestAnimationFrame(drawFrame);
  }
}
