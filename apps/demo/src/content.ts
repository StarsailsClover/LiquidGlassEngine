// Git   Hub@   St  ar   sa   i  l   s   C lo  v   er
export function buildContent(): HTMLElement {
  const content = document.createElement('div');
  content.className = 'page-content';
  content.id = 'page-content';
  content.innerHTML = `
    <h1>Liquid Glass Engine</h1>
    <h2>实时 DOM 文字穿过玻璃</h2>
    <p>
      这是一段普通的 DOM 文字。它没有进入 WebGPU 场景，而是由浏览器正常布局；
      LGE 通过内容通道把它捕获成纹理，交给 liquid-glass-studio 的折射着色器。
      移动鼠标，玻璃面板会跟随；在下面的输入框里打字，折射内容会实时更新。
    </p>
    <div class="chip-row">
      <span class="chip">Refraction</span>
      <span class="chip">Dispersion</span>
      <span class="chip">Fresnel</span>
      <span class="chip">Glare</span>
    </div>
    <input id="live-input" class="live-input" value="在这里输入，观察玻璃里的文字实时变化" />
    <div class="marquee">REFRACTION · DISPERSION · FRESNEL · GLARE · LIVE DOM</div>
  `;
  return content;
}
