import Engine from "./engine";
import CanvasKitInit from "canvaskit-wasm/bin/canvaskit.js";

document.addEventListener("DOMContentLoaded", () => {
  CanvasKitInit({
    locateFile: (file) => "/canvaskit-wasm/" + file,
  })
    .ready()
    .then((CanvasKit) => {
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
    const pictureRecorder = new this.CanvasKit.SkPictureRecorder();
    for (let i = 0; i < this.count.value; i++) {
      const size = 10 + Math.random() * 40;
      const x = Math.random() * this.width - size / 2;
      const y = Math.random() * this.height - size / 2;
      const rect = new this.CanvasKit.XYWHRect(0, 0, size, size);
      const pictureCanvas = pictureRecorder.beginRecording(rect);
      pictureCanvas.drawRect(rect, fillPaint);
      pictureCanvas.drawRect(rect, strokePaint);
      const picture = pictureRecorder.finishRecordingAsPicture();
      const speed = 1 + Math.random();
      rects[i] = { x, y, size, speed, picture };
    }
    const drawFrame = () => {
      const rectsToRemove = [];
      skcanvas.clear(white);
      for (let i = 0; i < this.count.value; i++) {
        const r = rects[i];
        r.x -= r.speed;
        const { x, y, size, picture } = r;
        // const rect = new this.CanvasKit.XYWHRect(x, y, size, size);
        // skcanvas.drawRect(rect, fillPaint);
        // skcanvas.drawRect(rect, strokePaint);
        skcanvas.save();
        skcanvas.translate(x, y);
        skcanvas.drawPicture(picture);
        skcanvas.restore();
        if (r.x + r.size < 0) rectsToRemove.push(i);
        rectsToRemove.forEach((i) => {
          rects[i].x = this.width + rects[i].size;
        });
      }
      skcanvas.flush();
      this.meter.tick();
      this.request = requestAnimationFrame(drawFrame);
    };
    this.request = requestAnimationFrame(drawFrame);
  }
}
