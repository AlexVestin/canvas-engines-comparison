import "fpsmeter";
const functionCallTimes = {};
class Engine {
  constructor() {
    this.content = document.querySelector(".content");
    this.countLinks = this.content.querySelectorAll(".selector > a");

    this.width = Math.min(this.content.clientWidth, 1000);
    this.height = this.content.clientHeight * 0.75;
    this.count = 0;

    this.initFpsmeter();
    this.initSettings();
  }

  log(frameNr) {
    const list = Object.entries(functionCallTimes)
      .map(([fn, value]) => ({
        fn,
        avgTime: value.time / frameNr,
        totalCalls: value.calls
      }))
      .sort((a, b) => b.totalCalls - a.totalCalls);
    console.log("Framenr: ", frameNr, list);
  }

  wrapLogging(canvas) {
    let gl = canvas.getContext("webgl2");
    if (!gl) {
      gl = canvas.getContext("webgl");
    }

    if (!gl) {
      throw new Error("Couldn't get context");
    }

    const logFunction = function(obj, fn) {
      return function() {
        //console.log(fn);
        const t0 = performance.now();
        const ret = obj[fn].apply(obj, [...arguments]);

        const diff = performance.now() - t0;
        if (fn === "shaderSource") {
          console.log(arguments);
        }
        //console.log(fn, diff);
        if (functionCallTimes[fn]) {
          functionCallTimes[fn].time += diff;
          functionCallTimes[fn].calls++;
        } else {
          functionCallTimes[fn] = { time: diff, calls: 1 };
        }
        return ret;
      };
    };
    let logGL = { ...gl };
    const getMethods = obj => {
      let properties = new Set();
      let currentObj = obj;
      do {
        Object.getOwnPropertyNames(currentObj).map(item =>
          properties.add(item)
        );
      } while ((currentObj = Object.getPrototypeOf(currentObj)));
      return [...properties.keys()];
    };

    for (const key of getMethods(gl)) {
      if (typeof gl[key] === "function") {
        logGL[key] = logFunction(gl, key);
      } else {
        logGL[key] = gl[key];
      }
    }

    canvas.getContext = type => logGL;
  }

  initFpsmeter() {
    this.meter = new window.FPSMeter(this.content, {
      graph: 1,
      heat: 1,
      theme: "light",
      history: 25,
      top: "-10px",
      left: `${this.width}px`,
      transform: "translateX(-100%)"
    });
  }

  initSettings() {
    const count = JSON.parse(localStorage.getItem("count"));
    this.count = count || { index: 0, value: 1000 };
    localStorage.setItem("count", JSON.stringify(this.count));

    this.countLinks.forEach((link, index) => {
      this.countLinks[this.count.index].classList.toggle("selected", true);

      link.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();

        this.countLinks[this.count.index].classList.toggle("selected", false);
        this.count = { index: index, value: parseInt(link.innerText) };
        this.countLinks[this.count.index].classList.toggle("selected", true);

        localStorage.setItem("count", JSON.stringify(this.count));

        this.render();
      });
    });
  }

  render() {}
}

export default Engine;
