/** Load an image file, return an HTMLImageElement (validates type and size). */
export async function loadImage(file) {
  if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type)) throw new Error('Choose a PNG, JPG or WebP image.');
  if (file.size > 12 * 1024 * 1024) throw new Error('Image is larger than 12 MB.');
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('Could not read that image.')); i.src = url; });
  } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
}
/** Square crop -> JPEG data URL. zoom ≥ 1; x,y ∈ [-1,1] shift the crop window. */
export function cropToDataURL(img, { zoom = 1, x = 0, y = 0, size = 480 } = {}) {
  const side = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
  const maxX = (img.naturalWidth - side) / 2, maxY = (img.naturalHeight - side) / 2;
  const sx = (img.naturalWidth - side) / 2 + x * maxX, sy = (img.naturalHeight - side) / 2 + y * maxY;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, size, size);
  g.imageSmoothingQuality = 'high'; g.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return c.toDataURL('image/jpeg', 0.86);
}
