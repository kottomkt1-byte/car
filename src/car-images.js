// Attach listeners before starting requests, including images already in cache.
// Requests are bounded: each verified source gets one retry, then a retry button.
export function loadCarImage(img, sources, onState, { timeout = 12000 } = {}) {
 const urls = [...new Set(sources.filter(Boolean))];
 const attempts = [...urls, ...urls];
 let index = 0, timer, stopped = false;
 function loaded() {
  if (stopped || img.naturalWidth === 0) return;
  stopped = true;
  clearTimeout(timer);
  onState('loaded');
 }
 function next() {
  if (stopped) return;
  clearTimeout(timer);
  if (index >= attempts.length) {
   stopped = true;
   onState('error');
   return;
  }
  onState('loading');
  timer = setTimeout(next, timeout);
  img.src = attempts[index++];
  if (img.complete && img.naturalWidth > 0) loaded();
 }
 img.addEventListener('load', loaded);
 img.addEventListener('error', next);
 next();
 return () => {
  stopped = true;
  clearTimeout(timer);
  img.removeEventListener('load', loaded);
  img.removeEventListener('error', next);
 };
}

export function setupCarImages(root) {
 const disposers = [...root.querySelectorAll('.car-stage')].map(stage => {
  const img = stage.querySelector('img');
  const status = stage.querySelector('.image-loading');
  const fallback = stage.querySelector('.image-fallback');
  const retry = stage.querySelector('.image-retry');
  const sources = JSON.parse(img.dataset.sources);
  let cancel = () => {};
  function start() {
   cancel();
   cancel = loadCarImage(img, sources, state => {
    stage.dataset.imageState = state;
    stage.setAttribute('aria-busy', String(state === 'loading'));
    status.hidden = state !== 'loading';
    fallback.hidden = state !== 'error';
    // Keep the image box laid out while loading, without showing a broken icon.
    img.style.visibility = state === 'loaded' ? 'visible' : 'hidden';
   });
  }
  retry.addEventListener('click', start);
  start();
  return () => { cancel(); retry.removeEventListener('click', start); };
 });
 return () => disposers.forEach(dispose => dispose());
}
