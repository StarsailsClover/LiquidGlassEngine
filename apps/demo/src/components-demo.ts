import '@lge/components';

const ready = async () => {
  await Promise.all([
    customElements.whenDefined('lge-button'),
    customElements.whenDefined('lge-input'),
    customElements.whenDefined('lge-toolbar'),
    customElements.whenDefined('lge-tabbar'),
  ]);
  const started = Date.now();
  while (Date.now() - started < 10000) {
    if (document.querySelectorAll('[data-lge-internal]').length > 0) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  await new Promise((resolve) => setTimeout(resolve, 1200));
  (window as unknown as { __LGE_COMPONENTS_READY__: boolean }).__LGE_COMPONENTS_READY__ = true;
};
void ready();
