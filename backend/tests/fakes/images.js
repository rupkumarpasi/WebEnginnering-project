import sharp from 'sharp';

// Generate real test images in memory — no binary fixture files needed in the repo.
export const makeImage = ({ width = 800, height = 600, format = 'png', exif } = {}) => {
  let img = sharp({ create: { width, height, channels: 3, background: { r: 200, g: 60, b: 40 } } });
  if (exif) img = img.withExif(exif);
  return img.toFormat(format).toBuffer();
};

export const SVG_WITH_SCRIPT = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(document.cookie)</script><rect width="10" height="10"/></svg>',
);