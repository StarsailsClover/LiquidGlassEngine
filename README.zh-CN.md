# LiquidGlassEngine (LGE) 中文说明

<!-- Gi  tHub  @Sta  rsail  s  C  lov er -->

LiquidGlassEngine 是本组织面向 Oxygen/Prima 网页产品的 WebGPU 液态玻璃
（Liquid Glass）渲染引擎，负责玻璃光学、DOM 到 GPU 的内容管线，以及产品
设计管线规定的浏览器回退链路。

## 要解决的问题

WebGPU 与 DOM 不共享像素通道：玻璃着色器可以采样引擎自己渲染的场景，却
无法读取浏览器绘制的文字、控件与滚动内容。若缺少 DOM→GPU 内容管线，玻璃
面板要么失去折射，要么整个页面被迫放弃原生文字与控件。LGE 就是为了解决
这个问题。

## 计划采用的方案

- WebGPU 优先的玻璃渲染器，参数以版本化契约固化（折射、色散、菲涅耳、
  高光、模糊档位、阴影）。
- 三条 DOM 内容通道：
  - 浏览器支持时使用 `html-in-canvas` 做实时 DOM→纹理复制；
  - 不支持时回退到快照栅格化；
  - 引擎自有 UI 使用原生场景图元（SDF 形状/文字）。
- DOM 始终可交互、可访问；浏览器支持时由引擎镜像几何用于命中测试与无障碍。
- WebGL2 兼容路径与显式的降级模式；禁止把普通 `backdrop-filter` 当作
  液态玻璃交付。

## 状态

`v26.0-Alpha1`：研究与引导阶段，引擎、包与演示尚未实现。现有证据保存在
`.devdocs/research/`。

## 参考

- WICG HTML-in-Canvas：https://github.com/WICG/html-in-canvas
- Chrome 实验开关：`chrome://flags/#canvas-draw-element`
- Apple 设计资源（Figma 社区）：见 `.devdocs/research/`。

## 许可

内部项目，禁止对外分发。
