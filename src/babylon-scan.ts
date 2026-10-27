import { babylonAsset } from "./babylon-assets";

export interface ScanView {
  turn: number;
  tip: number;
  light: number;
  zoom: number;
  texture: boolean;
  focus: number;
}
export const SCAN_FRONT: ScanView = {
  turn: 0,
  tip: 0,
  light: -60,
  zoom: 3.1,
  texture: true,
  focus: 0,
};
const radians = (a: number) => (a * Math.PI) / 180;
function multiply(a: number[], b: number[]): number[] {
  const result = Array<number>(9).fill(0);
  for (let c = 0; c < 3; c++)
    for (let r = 0; r < 3; r++)
      for (let k = 0; k < 3; k++)
        result[c * 3 + r] = (result[c * 3 + r] ?? 0) + (a[k * 3 + r] ?? 0) * (b[c * 3 + k] ?? 0);
  return result;
}
function rotation(s: ScanView) {
  const z = radians(-154),
    y = radians(s.turn),
    x = radians(s.tip);
  const rz = [Math.cos(z), Math.sin(z), 0, -Math.sin(z), Math.cos(z), 0, 0, 0, 1];
  const ry = [Math.cos(y), 0, -Math.sin(y), 0, 1, 0, Math.sin(y), 0, Math.cos(y)];
  const rx = [1, 0, 0, 0, Math.cos(x), Math.sin(x), 0, -Math.sin(x), Math.cos(x)];
  return new Float32Array(multiply(rx, multiply(ry, rz)));
}
const vertex = `#version 300 es
precision highp float;
in vec3 position; in vec3 normal; in vec2 uv;
uniform mat3 rotation; uniform float aspect; uniform float zoom; uniform float focus;
out vec3 n; out vec2 tex;
void main(){
  vec3 p=vec3(-position.x+0.01635,position.z+0.05958,position.y-0.05745);
  vec3 q=rotation*p;
  gl_Position=vec4(q.x*zoom/aspect,(q.y-focus)*zoom,-q.z*1.5,1.0);
  n=rotation*vec3(-normal.x,normal.z,normal.y); tex=uv;
}`;
const fragment = `#version 300 es
precision highp float;
in vec3 n; in vec2 tex; uniform sampler2D photo;
uniform vec3 light; uniform bool textured; out vec4 color;
void main(){
  float diffuse=max(dot(normalize(n),normalize(light)),0.0);
  vec3 base=textured?texture(photo,tex).rgb:vec3(0.66,0.65,0.60);
  color=vec4(base*(0.23+0.77*diffuse),1.0);
}`;
export class BabylonScan {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private count = 0;
  private current: ScanView = { ...SCAN_FRONT };
  private observer: ResizeObserver;
  private lost = false;
  constructor(
    private canvas: HTMLCanvasElement,
    private status: HTMLElement,
  ) {
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    if (!gl)
      throw new Error(
        "The scan needs WebGL 2. The photograph, drawings and numerical comparison remain available.",
      );
    this.gl = gl;
    const shader = (type: number, source: string) => {
      const s = gl.createShader(type);
      if (!s) throw new Error("Cannot create the scan shader.");
      gl.shaderSource(s, source);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        gl.deleteShader(s);
        throw new Error(`Scan shader failed: ${log}`);
      }
      return s;
    };
    const p = gl.createProgram();
    if (!p) throw new Error("Cannot create the scan renderer.");
    const v = shader(gl.VERTEX_SHADER, vertex),
      f = shader(gl.FRAGMENT_SHADER, fragment);
    gl.attachShader(p, v);
    gl.attachShader(p, f);
    gl.linkProgram(p);
    gl.deleteShader(v);
    gl.deleteShader(f);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error("The scan renderer could not be linked.");
    this.program = p;
    gl.useProgram(p);
    gl.enable(gl.DEPTH_TEST);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.lost = true;
      status.textContent =
        "The graphics context was lost. Reload the scan to inspect it again; the source photograph remains available.";
    });
    this.observer = new ResizeObserver(() => this.draw(this.current));
    this.observer.observe(canvas);
  }
  async load() {
    const [compressed, image] = await Promise.all([
      babylonAsset("sources/babylon/stele.mesh"),
      babylonAsset("sources/babylon/stele-texture.jpg"),
    ]);
    const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
    const data = await new Response(stream).arrayBuffer(),
      view = new DataView(data);
    if (new TextDecoder().decode(new Uint8Array(data, 0, 8)) !== "GONIAS01")
      throw new Error("Unknown scan data format.");
    const vertices = view.getUint32(8, true),
      count = view.getUint32(12, true);
    if (
      vertices !== 103234 ||
      count !== 189027 * 3 ||
      data.byteLength !== 16 + vertices * 32 + count * 4
    )
      throw new Error("The scan's geometry inventory is incomplete.");
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Uint8Array(data, 16, vertices * 32), gl.STATIC_DRAW);
    for (const [name, size, offset] of [
      ["position", 3, 0],
      ["normal", 3, 12],
      ["uv", 2, 24],
    ] as const) {
      const attribute = gl.getAttribLocation(this.program, name);
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, size, gl.FLOAT, false, 32, offset);
    }
    const index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index);
    gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint32Array(data, 16 + vertices * 32, count),
      gl.STATIC_DRAW,
    );
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const url = URL.createObjectURL(new Blob([image], { type: "image/jpeg" }));
    try {
      const picture = new Image();
      picture.src = url;
      await picture.decode();
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, picture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    } finally {
      URL.revokeObjectURL(url);
    }
    this.count = count;
    this.canvas.dataset.triangles = String(count / 3);
    this.canvas.dataset.sourceVerified = "true";
    this.status.textContent =
      "Verified source scan loaded. Change the light or remove the photographic colour to inspect the captured surface.";
    this.draw(this.current);
  }
  draw(s: ScanView) {
    this.current = { ...s };
    if (!this.count || this.lost) return;
    const gl = this.gl,
      box = this.canvas.getBoundingClientRect(),
      dpr = Math.min(devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(box.width * dpr)),
      height = Math.max(1, Math.round(box.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    gl.clearColor(0.13, 0.16, 0.14, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const uniform = (name: string) => gl.getUniformLocation(this.program, name);
    gl.useProgram(this.program);
    gl.uniformMatrix3fv(uniform("rotation"), false, rotation(s));
    gl.uniform1f(uniform("aspect"), width / height);
    gl.uniform1f(uniform("zoom"), s.zoom);
    gl.uniform1f(uniform("focus"), s.focus);
    gl.uniform3f(uniform("light"), Math.sin(radians(s.light)), 0.2, Math.cos(radians(s.light)));
    gl.uniform1i(uniform("textured"), s.texture ? 1 : 0);
    gl.uniform1i(uniform("photo"), 0);
    gl.drawElements(gl.TRIANGLES, this.count, gl.UNSIGNED_INT, 0);
    this.canvas.dataset.view = JSON.stringify(s);
  }
  snapshot(): { image: string; view: ScanView } | null {
    if (!this.count || this.lost) return null;
    this.draw(this.current);
    return { image: this.canvas.toDataURL("image/png"), view: { ...this.current } };
  }
  dispose() {
    this.observer.disconnect();
    this.gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}
