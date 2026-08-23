import { type DragEvent, type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import JSZip from 'jszip';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Dice6, Download, FileArchive, FileImage, Loader2, Trash2, Upload, X } from 'lucide-react';
import { HellaRichSEO } from '../components/HellaRichSEO';

const MAX_FILES = 25;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_RENDER_DIMENSION = 2200;
const ACCEPTED_INPUT = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/avif',
].join(',');

const OUTPUT_FORMATS = [
  { label: 'PNG', value: 'png', mime: 'image/png', ext: 'png', lossy: false },
  { label: 'JPG', value: 'jpg', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  { label: 'WebP', value: 'webp', mime: 'image/webp', ext: 'webp', lossy: true },
] as const;

type OutputFormat = (typeof OUTPUT_FORMATS)[number]['value'];
type EffectId =
  | 'bad-print'
  | 'flash-trash'
  | 'mall-portrait'
  | 'acid-glitch'
  | 'haunted-glass'
  | 'polaroid-fade'
  | 'vhs-drip'
  | 'blue-duotone'
  | 'linear-halftone'
  | 'xerox-ghost'
  | 'newsprint'
  | '3d-glasses'
  | 'muted-orange'
  | 'muted-green'
  | 'muted-yellow'
  | 'muted-red'
  | 'muted-pink'
  | 'ember-duotone'
  | 'moss-duotone'
  | 'rose-duotone'
  | 'sulfur-duotone'
  | 'poster-tear'
  | 'photocopy-smear'
  | 'soft-bloom'
  | 'ribbed-glass-2'
  | 'bad-scanner'
  | 'noir-grain'
  | 'heat-map'
  | 'flash-bloom'
  | 'glass-slice'
  | 'scanner-bed'
  | 'noir-crush'
  | 'heat-map-ghost'
  | 'poster-peel'
  | 'copier-drag'
  | 'midnight-duotone';
type EffectsStatus = 'ready' | 'processing' | 'done' | 'error';

const EFFECTS: Array<{
  id: EffectId;
  label: string;
  caption: string;
  alt: string;
}> = [
  {
    id: 'bad-print',
    label: 'Bad Print',
    caption: 'Dirty photocopy contrast, halftone grit, scan-line drag, paper fade, and tiny registration damage.',
    alt: 'Live Bad Print preview',
  },
  {
    id: 'flash-trash',
    label: 'Flash Trash',
    caption: 'Disposable-camera blast, hot center flash, crushed shadows, warm skin, and cheap party grain.',
    alt: 'Live Flash Trash preview',
  },
  {
    id: 'mall-portrait',
    label: 'Mall Portrait',
    caption: 'Soft 80s studio bloom, warm haze, lifted blacks, and the faint glow of a department-store backdrop.',
    alt: 'Live Mall Portrait preview',
  },
  {
    id: 'acid-glitch',
    label: 'Acid Glitch',
    caption: 'RGB channel drift, torn horizontal bands, video noise, and oversaturated damaged color.',
    alt: 'Live Acid Glitch preview',
  },
  {
    id: 'haunted-glass',
    label: 'Haunted Glass',
    caption: 'Dark green/yellow grade, ribbed distortion, low-light grain, and dirty lens pressure.',
    alt: 'Live Haunted Glass preview',
  },
  {
    id: 'polaroid-fade',
    label: 'Polaroid Fade',
    caption: 'Lifted blacks, sun-warmed highlights, soft vignette, muted cyan shadows, and dusty instant-film grain.',
    alt: 'Live Polaroid Fade preview',
  },
  {
    id: 'vhs-drip',
    label: 'VHS Drip',
    caption: 'Soft tape blur, warped scanlines, chroma smear, green shadows, and damaged analog frame noise.',
    alt: 'Live VHS Drip preview',
  },
  {
    id: 'blue-duotone',
    label: 'Blue Duotone',
    caption: 'Two-ink poster treatment with deep navy shadows, icy blue mids, warm paper, and rough grain.',
    alt: 'Live Blue Duotone preview',
  },
  {
    id: 'linear-halftone',
    label: 'Linear Halftone',
    caption: 'Horizontal print lines that thicken with shadow density, like a bad fax crossed with a punk flyer.',
    alt: 'Live Linear Halftone preview',
  },
  {
    id: 'xerox-ghost',
    label: 'Xerox Ghost',
    caption: 'Overexposed copier burn, dragged duplicate edges, hard black toner, and washed-out paper grit.',
    alt: 'Live Xerox Ghost preview',
  },
  {
    id: 'newsprint',
    label: 'Newsprint',
    caption: 'CMYK-ish dot screen, soft ink registration errors, warm paper, and disposable tabloid texture.',
    alt: 'Live Newsprint preview',
  },
  {
    id: '3d-glasses',
    label: '3D Glasses',
    caption: 'Red/cyan channel split, slight double exposure, bright studio wash, and cheap paper glasses chaos.',
    alt: 'Live 3D Glasses preview',
  },
  {
    id: 'muted-orange',
    label: 'Muted Orange',
    caption: 'Dusty orange wash, softened contrast, warm highlights, and faded print grain.',
    alt: 'Live Muted Orange preview',
  },
  {
    id: 'muted-green',
    label: 'Muted Green',
    caption: 'Washed olive cast, subdued saturation, darker greens, and soft archival haze.',
    alt: 'Live Muted Green preview',
  },
  {
    id: 'muted-yellow',
    label: 'Muted Yellow',
    caption: 'Faded yellow paper tone, mellow highlights, lifted shadows, and gentle sun damage.',
    alt: 'Live Muted Yellow preview',
  },
  {
    id: 'muted-red',
    label: 'Muted Red',
    caption: 'Dried red ink wash, compressed color, low-contrast warmth, and poster-aged grain.',
    alt: 'Live Muted Red preview',
  },
  {
    id: 'muted-pink',
    label: 'Muted Pink',
    caption: 'Soft rose tint, creamy shadows, softened skin tones, and lightly faded photo paper.',
    alt: 'Live Muted Pink preview',
  },
  {
    id: 'ember-duotone',
    label: 'Ember Duotone',
    caption: 'Deep brown shadows, burnt orange mids, pale paper highs, and subtle gritty ink.',
    alt: 'Live Ember Duotone preview',
  },
  {
    id: 'moss-duotone',
    label: 'Moss Duotone',
    caption: 'Dark forest shadows, muted moss mids, yellowed paper highs, and soft film grit.',
    alt: 'Live Moss Duotone preview',
  },
  {
    id: 'rose-duotone',
    label: 'Rose Duotone',
    caption: 'Wine-dark shadows, dusty pink mids, cream highlights, and low-fi editorial warmth.',
    alt: 'Live Rose Duotone preview',
  },
  {
    id: 'sulfur-duotone',
    label: 'Sulfur Duotone',
    caption: 'Charcoal shadows, muted yellow-green mids, pale highs, and rough poster texture.',
    alt: 'Live Sulfur Duotone preview',
  },
  {
    id: 'poster-tear',
    label: 'Poster Tear',
    caption: 'Ripped street-poster strips, shifted paper bands, dirty edges, and pasted-wall color loss.',
    alt: 'Live Poster Tear preview',
  },
  {
    id: 'photocopy-smear',
    label: 'Photocopy Smear',
    caption: 'Dragged toner shadows, blown copier whites, horizontal pull marks, and rough black ink.',
    alt: 'Live Photocopy Smear preview',
  },
  {
    id: 'soft-bloom',
    label: 'Soft Bloom',
    caption: 'Dreamy blown highlights, hazy glow, soft contrast, warm haze, and light film grain.',
    alt: 'Live Soft Bloom preview',
  },
  {
    id: 'ribbed-glass-2',
    label: 'Ribbed Glass 2',
    caption: 'Chunkier vertical refraction, repeated facial slices, glossy pressure, and moody contrast.',
    alt: 'Live Ribbed Glass 2 preview',
  },
  {
    id: 'bad-scanner',
    label: 'Bad Scanner',
    caption: 'Flatbed scan streaks, row jitter, dust scratches, faded color, and uneven sensor bands.',
    alt: 'Live Bad Scanner preview',
  },
  {
    id: 'noir-grain',
    label: 'Noir Grain',
    caption: 'Crushed black-and-white contrast, hard vignette, silver grain, and late-night shadow.',
    alt: 'Live Noir Grain preview',
  },
  {
    id: 'heat-map',
    label: 'Heat Map',
    caption: 'Thermal false color, glowing mids, deep violet shadows, and hot yellow-white highlights.',
    alt: 'Live Heat Map preview',
  },
  {
    id: 'flash-bloom',
    label: 'Flash Bloom',
    caption: 'Hot flash center, soft glowing highlights, warm haze, crushed edges, and party-camera grain.',
    alt: 'Live Flash Bloom preview',
  },
  {
    id: 'glass-slice',
    label: 'Glass Slice',
    caption: 'Thin vertical refraction cuts, repeated image slivers, glossy scanlines, and cooler contrast.',
    alt: 'Live Glass Slice preview',
  },
  {
    id: 'scanner-bed',
    label: 'Scanner Bed',
    caption: 'Cool flatbed wash, subtle lamp streaks, dust lines, and low-contrast document color.',
    alt: 'Live Scanner Bed preview',
  },
  {
    id: 'noir-crush',
    label: 'Noir Crush',
    caption: 'Heavier black-and-white contrast, smoky grain, deeper vignette, and hard silver highlights.',
    alt: 'Live Noir Crush preview',
  },
  {
    id: 'heat-map-ghost',
    label: 'Heat Map Ghost',
    caption: 'Thermal color with RGB drift, dark halo shadows, and glowing ghost edges.',
    alt: 'Live Heat Map Ghost preview',
  },
  {
    id: 'poster-peel',
    label: 'Poster Peel',
    caption: 'Layered paper strips, peeled light seams, offset image bands, and worn paste texture.',
    alt: 'Live Poster Peel preview',
  },
  {
    id: 'copier-drag',
    label: 'Copier Drag',
    caption: 'Longer toner pull, darker copy shadows, bright paper burn, and dragged scan damage.',
    alt: 'Live Copier Drag preview',
  },
  {
    id: 'midnight-duotone',
    label: 'Midnight Duotone',
    caption: 'Inky blue-black shadows, bruised purple mids, pale icy highs, and matte poster grain.',
    alt: 'Live Midnight Duotone preview',
  },
];

interface QueueItem {
  id: string;
  file: File;
  status: EffectsStatus;
  progress: string;
  error?: string;
  outputName?: string;
  outputBlob?: Blob;
  outputUrl?: string;
}

type BackgroundStats = {
  itemCount: number;
  processedCount: number;
  totalOutputBytes: number;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanBaseName(name: string) {
  const trimmed = name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-');
  return trimmed || 'hella-effect';
}

function getOutputConfig(format: OutputFormat) {
  return OUTPUT_FORMATS.find((item) => item.value === format) ?? OUTPUT_FORMATS[0];
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality = 0.92) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error(`This browser cannot export ${mime.replace('image/', '').toUpperCase()}.`));
      },
      mime,
      quality,
    );
  });
}

async function fileToBitmap(file: File) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file, { imageOrientation: 'from-image' });
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not read this image in the browser.'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas is not available in this browser.');
    context.drawImage(image, 0, 0);
    return createImageBitmap(canvas);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seededNoise(x: number, y: number, seed: number) {
  const value = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return value - Math.floor(value);
}

function clampByte(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getEffect(effectId: EffectId) {
  return EFFECTS.find((effect) => effect.id === effectId) ?? EFFECTS[0];
}

async function createSourceCanvas(file: File, format: OutputFormat, maxDimension = MAX_RENDER_DIMENSION) {
  const bitmap = await fileToBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { alpha: format !== 'jpg' });
  if (!context) throw new Error('Canvas is not available in this browser.');

  context.fillStyle = '#f1ead8';
  context.fillRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  return { canvas, context, width, height };
}

async function finishEffect(canvas: HTMLCanvasElement, file: File, format: OutputFormat, effectId: EffectId) {
  const target = getOutputConfig(format);
  const blob = await canvasToBlob(canvas, target.mime, target.lossy ? 0.92 : 1);
  return {
    blob,
    name: `${cleanBaseName(file.name)}-${effectId}.${target.ext}`,
  };
}

async function renderBadPrint(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 997;
  const paper = [244, 237, 215];
  const ink = [35, 31, 27];
  const rust = [130, 48, 37];

  for (let y = 0; y < height; y += 1) {
    const scan = y % 5 === 0 ? 0.16 : y % 3 === 0 ? 0.08 : 0;
    const rowShift = seededNoise(0, y, seed) > 0.982 ? 0.22 : 0;

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const luma = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const dot = ((x + (y % 2) * 2) % 6 < 3 && y % 6 < 3) ? 0.11 : -0.05;
      const grit = seededNoise(x, y, seed) * 0.3 - 0.15;
      const scratches = seededNoise(Math.floor(x / 2), Math.floor(y / 38), seed) > 0.994 ? -0.42 : 0;
      const adjusted = Math.max(0, Math.min(1, (luma - 0.45) * 1.72 + 0.5 + dot + grit + scan + rowShift + scratches));
      const threshold = adjusted > 0.62 ? 1 : adjusted > 0.49 && seededNoise(x * 2, y * 2, seed) > 0.45 ? 1 : 0;
      const tone = threshold;
      const edge = Math.abs(luma - ((data[index + 4] ?? r) * 0.299 + (data[index + 5] ?? g) * 0.587 + (data[index + 6] ?? b) * 0.114) / 255);
      const inkMix = edge > 0.08 ? 0.28 : 0;
      const colorNoise = seededNoise(x, y, seed + 13);
      const useRust = colorNoise > 0.935;

      data[index] = Math.round(paper[0] * tone + (useRust ? rust[0] : ink[0]) * (1 - tone) + ink[0] * inkMix);
      data[index + 1] = Math.round(paper[1] * tone + (useRust ? rust[1] : ink[1]) * (1 - tone) + ink[1] * inkMix);
      data[index + 2] = Math.round(paper[2] * tone + (useRust ? rust[2] : ink[2]) * (1 - tone) + ink[2] * inkMix);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);

  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(128, 45, 34, 0.08)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'bad-print');
}

async function renderFlashTrash(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 911;
  const centerX = width * 0.46;
  const centerY = height * 0.42;
  const maxDistance = Math.hypot(centerX, centerY);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const distance = Math.hypot(x - centerX, y - centerY) / maxDistance;
      const flash = Math.max(0, 1 - distance * 1.8);
      const vignette = Math.max(0, distance - 0.42) * 95;
      const grain = (seededNoise(x, y, seed) - 0.5) * 44;
      const contrast = 1.34;

      data[index] = clampByte((data[index] - 128) * contrast + 128 + flash * 88 - vignette + grain + 18);
      data[index + 1] = clampByte((data[index + 1] - 128) * contrast + 128 + flash * 62 - vignette * 0.88 + grain + 5);
      data[index + 2] = clampByte((data[index + 2] - 128) * contrast + 128 + flash * 30 - vignette * 0.78 + grain - 18);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'screen';
  context.fillStyle = 'rgba(255, 215, 168, 0.16)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'flash-trash');
}

async function renderMallPortrait(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const glow = document.createElement('canvas');
  glow.width = width;
  glow.height = height;
  const glowContext = glow.getContext('2d');
  if (!glowContext) throw new Error('Canvas is not available in this browser.');
  glowContext.filter = `blur(${Math.max(8, Math.round(width * 0.018))}px) saturate(1.3)`;
  glowContext.drawImage(canvas, 0, 0);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 823;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const grain = (seededNoise(x, y, seed) - 0.5) * 18;
      const luma = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      const fade = luma < 74 ? 28 : 0;
      data[index] = clampByte(data[index] * 1.12 + 22 + fade + grain);
      data[index + 1] = clampByte(data[index + 1] * 1.02 + 12 + fade * 0.74 + grain);
      data[index + 2] = clampByte(data[index + 2] * 0.88 + 8 + fade * 0.45 + grain);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.36;
  context.drawImage(glow, 0, 0);
  context.globalAlpha = 1;
  context.fillStyle = 'rgba(255, 192, 156, 0.1)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'mall-portrait');
}

async function renderAcidGlitch(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const seed = file.size % 719;

  const sample = (x: number, y: number, channel: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    return source[(sy * width + sx) * 4 + channel];
  };

  for (let y = 0; y < height; y += 1) {
    const band = Math.floor(y / 18);
    const tear = seededNoise(band, 0, seed) > 0.72 ? Math.round((seededNoise(band, 8, seed) - 0.5) * width * 0.075) : 0;
    const wave = Math.round(Math.sin(y * 0.06 + seed) * 7);
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const noise = (seededNoise(x, y, seed) - 0.5) * 28;
      data[index] = clampByte(sample(x + tear + wave + 10, y, 0) * 1.18 + noise + 14);
      data[index + 1] = clampByte(sample(x + tear - 3, y, 1) * 1.1 + noise);
      data[index + 2] = clampByte(sample(x + tear - wave - 10, y, 2) * 1.24 + noise + 20);
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(255, 66, 47, 0.11)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'screen';
  context.fillStyle = 'rgba(0, 245, 224, 0.09)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'acid-glitch');
}

async function renderHauntedGlass(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const seed = file.size % 607;

  const sampleIndex = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    return (sy * width + sx) * 4;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const rib = Math.sin(x * 0.085) * 11 + Math.sin(x * 0.022 + seed) * 16;
      const index = (y * width + x) * 4;
      const sourceIndex = sampleIndex(Math.round(x + rib), y);
      const luma = (source[sourceIndex] * 0.299 + source[sourceIndex + 1] * 0.587 + source[sourceIndex + 2] * 0.114) / 255;
      const grain = (seededNoise(x, y, seed) - 0.5) * 34;
      const vignette = clampUnit(Math.hypot(x - width / 2, y - height / 2) / Math.hypot(width / 2, height / 2));
      data[index] = clampByte((luma * 168 + 36 + grain) * (1 - vignette * 0.48));
      data[index + 1] = clampByte((luma * 190 + 52 + grain) * (1 - vignette * 0.34));
      data[index + 2] = clampByte((luma * 82 + 22 + grain) * (1 - vignette * 0.58));
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(10, 20, 13, 0.28)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'screen';
  context.fillStyle = 'rgba(230, 172, 60, 0.08)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'haunted-glass');
}

async function renderPolaroidFade(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 541;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const grain = (seededNoise(x, y, seed) - 0.5) * 20;
      const distance = Math.hypot(x - width / 2, y - height / 2) / Math.hypot(width / 2, height / 2);
      const fade = Math.max(0, 92 - (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114)) * 0.32;
      const vignette = Math.max(0, distance - 0.48) * 54;

      data[index] = clampByte(data[index] * 1.08 + 24 + fade - vignette + grain);
      data[index + 1] = clampByte(data[index + 1] * 1.03 + 16 + fade * 0.82 - vignette * 0.84 + grain * 0.76);
      data[index + 2] = clampByte(data[index + 2] * 0.88 + 18 + fade * 0.6 - vignette * 0.68 + grain * 0.52);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'screen';
  context.fillStyle = 'rgba(255, 232, 194, 0.1)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(102, 137, 130, 0.08)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'polaroid-fade');
}

async function renderVhsDrip(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const seed = file.size % 499;

  const sample = (x: number, y: number, channel: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    return source[(sy * width + sx) * 4 + channel];
  };

  for (let y = 0; y < height; y += 1) {
    const band = Math.floor(y / 9);
    const wobble = Math.round(Math.sin(y * 0.035 + seed) * 9 + (seededNoise(band, 2, seed) - 0.5) * 18);
    const scan = y % 3 === 0 ? -24 : y % 3 === 1 ? 8 : 0;

    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const noise = (seededNoise(x, y, seed) - 0.5) * 22;
      data[index] = clampByte(sample(x + wobble + 5, y, 0) * 0.98 + noise + scan + 12);
      data[index + 1] = clampByte(sample(x + wobble, y, 1) * 1.08 + noise + scan + 8);
      data[index + 2] = clampByte(sample(x + wobble - 9, y, 2) * 0.94 + noise + scan - 6);
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.filter = `blur(${Math.max(0.4, width * 0.00045)}px)`;
  context.globalAlpha = 0.42;
  context.drawImage(canvas, 0, 0);
  context.filter = 'none';
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(24, 63, 47, 0.16)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'vhs-drip');
}

async function renderBlueDuotone(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 461;
  const shadow = [9, 25, 46];
  const mid = [62, 139, 164];
  const paper = [240, 232, 203];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luma = clampUnit((data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255 + (seededNoise(x, y, seed) - 0.5) * 0.08);
      const target = luma < 0.55 ? mid : paper;
      const mix = luma < 0.55 ? luma / 0.55 : (luma - 0.55) / 0.45;
      const start = luma < 0.55 ? shadow : mid;
      data[index] = clampByte(start[0] * (1 - mix) + target[0] * mix);
      data[index + 1] = clampByte(start[1] * (1 - mix) + target[1] * mix);
      data[index + 2] = clampByte(start[2] * (1 - mix) + target[2] * mix);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return finishEffect(canvas, file, format, 'blue-duotone');
}

async function renderLinearHalftone(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format, 1800);
  const imageData = context.getImageData(0, 0, width, height);
  const source = imageData.data;
  const data = context.createImageData(width, height);
  const output = data.data;
  const seed = file.size % 433;
  const paper = [242, 237, 222];
  const ink = [24, 23, 22];

  for (let y = 0; y < height; y += 1) {
    const line = y % 8;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luma = (source[index] * 0.299 + source[index + 1] * 0.587 + source[index + 2] * 0.114) / 255;
      const thickness = Math.round((1 - luma) * 7);
      const broken = seededNoise(Math.floor(x / 3), y, seed) > 0.94;
      const mark = line <= thickness && !broken;
      output[index] = mark ? ink[0] : paper[0];
      output[index + 1] = mark ? ink[1] : paper[1];
      output[index + 2] = mark ? ink[2] : paper[2];
      output[index + 3] = 255;
    }
  }

  context.putImageData(data, 0, 0);
  return finishEffect(canvas, file, format, 'linear-halftone');
}

async function renderXeroxGhost(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const seed = file.size % 397;

  const sourceLuma = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    const index = (sy * width + sx) * 4;
    return (source[index] * 0.299 + source[index + 1] * 0.587 + source[index + 2] * 0.114) / 255;
  };

  for (let y = 0; y < height; y += 1) {
    const drag = seededNoise(Math.floor(y / 16), 0, seed) > 0.74 ? Math.round(width * 0.025) : 0;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luma = sourceLuma(x + drag, y);
      const ghost = sourceLuma(x - Math.round(width * 0.018), y);
      const scratch = seededNoise(Math.floor(x / 2), Math.floor(y / 52), seed) > 0.993 ? -0.42 : 0;
      const value = clampUnit((luma * 0.72 + ghost * 0.24 - 0.38) * 2.25 + 0.46 + scratch + (seededNoise(x, y, seed) - 0.5) * 0.18);
      const toner = value > 0.55 ? 244 : value > 0.45 && seededNoise(x, y, seed + 9) > 0.38 ? 244 : 21;
      data[index] = toner;
      data[index + 1] = toner;
      data[index + 2] = toner;
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(238, 232, 216, 0.18)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'xerox-ghost');
}

async function renderNewsprint(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format, 1800);
  const imageData = context.getImageData(0, 0, width, height);
  const source = imageData.data;
  const cell = Math.max(4, Math.round(Math.max(width, height) / 170));
  const seed = file.size % 359;

  context.fillStyle = '#eee3c9';
  context.fillRect(0, 0, width, height);

  const drawScreen = (channel: 0 | 1 | 2, color: string, offsetX: number, offsetY: number, alpha: number) => {
    context.fillStyle = color;
    context.globalAlpha = alpha;
    for (let y = -cell; y < height + cell; y += cell) {
      for (let x = -cell; x < width + cell; x += cell) {
        const sx = Math.max(0, Math.min(width - 1, x + offsetX + Math.floor(cell / 2)));
        const sy = Math.max(0, Math.min(height - 1, y + offsetY + Math.floor(cell / 2)));
        const index = (sy * width + sx) * 4;
        const value = source[index + channel] / 255;
        const luma = (source[index] * 0.299 + source[index + 1] * 0.587 + source[index + 2] * 0.114) / 255;
        const radius = (1 - value * 0.72 - luma * 0.22) * cell * (0.56 + seededNoise(x, y, seed) * 0.08);
        if (radius <= 0.5) continue;
        context.beginPath();
        context.arc(x + offsetX + cell / 2, y + offsetY + cell / 2, radius, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.globalAlpha = 1;
  };

  drawScreen(2, '#1b5b79', 0, 0, 0.72);
  drawScreen(1, '#c23f55', Math.round(cell * 0.34), Math.round(cell * 0.24), 0.48);
  drawScreen(0, '#d4aa27', Math.round(cell * -0.22), Math.round(cell * 0.42), 0.42);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(29, 24, 18, 0.08)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'newsprint');
}

async function render3dGlasses(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const offset = Math.max(6, Math.round(Math.max(width, height) * 0.018));

  const sample = (x: number, y: number, channel: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    return source[(sy * width + sx) * 4 + channel];
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const red = sample(x + offset, y, 0);
      const green = sample(x - Math.round(offset * 0.42), y, 1);
      const blue = sample(x - offset, y, 2);
      data[index] = clampByte(red * 1.12 + 8);
      data[index + 1] = clampByte(green * 1.02 + 4);
      data[index + 2] = clampByte(blue * 1.12 + 14);
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.globalCompositeOperation = 'screen';
  context.fillStyle = 'rgba(255, 238, 232, 0.12)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, '3d-glasses');
}

type Rgb = [number, number, number];

function mixColor(a: Rgb, b: Rgb, amount: number): Rgb {
  return [
    a[0] * (1 - amount) + b[0] * amount,
    a[1] * (1 - amount) + b[1] * amount,
    a[2] * (1 - amount) + b[2] * amount,
  ];
}

async function renderMutedTone(file: File, format: OutputFormat, effectId: EffectId, tint: Rgb, paper: Rgb, shadow: Rgb) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 317;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const grain = (seededNoise(x, y, seed) - 0.5) * 15;
      const luma = (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255;
      const faded = clampUnit((luma - 0.5) * 0.78 + 0.55);
      const base = mixColor(shadow, paper, faded);
      const wash = mixColor(base, tint, 0.34);
      const original = [data[index], data[index + 1], data[index + 2]] as Rgb;
      const muted = mixColor(wash, original, 0.28);
      const vignette = Math.max(0, Math.hypot(x - width / 2, y - height / 2) / Math.hypot(width / 2, height / 2) - 0.5) * 38;

      data[index] = clampByte(muted[0] + grain - vignette);
      data[index + 1] = clampByte(muted[1] + grain * 0.8 - vignette * 0.88);
      data[index + 2] = clampByte(muted[2] + grain * 0.64 - vignette * 0.74);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(38, 31, 24, 0.05)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, effectId);
}

async function renderDuotone(file: File, format: OutputFormat, effectId: EffectId, shadow: Rgb, mid: Rgb, paper: Rgb) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 293;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const grain = (seededNoise(x, y, seed) - 0.5) * 0.08;
      const luma = clampUnit((data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255 + grain);
      const pivot = 0.58;
      const start = luma < pivot ? shadow : mid;
      const end = luma < pivot ? mid : paper;
      const mix = luma < pivot ? luma / pivot : (luma - pivot) / (1 - pivot);
      const color = mixColor(start, end, mix);
      data[index] = clampByte(color[0]);
      data[index + 1] = clampByte(color[1]);
      data[index + 2] = clampByte(color[2]);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(18, 14, 12, 0.08)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, effectId);
}

async function renderPosterTear(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = document.createElement('canvas');
  original.width = width;
  original.height = height;
  const originalContext = original.getContext('2d');
  if (!originalContext) throw new Error('Canvas is not available in this browser.');
  originalContext.drawImage(canvas, 0, 0);
  const seed = file.size % 271;

  context.fillStyle = '#e7dec9';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  const strips = 9;
  for (let i = 0; i < strips; i += 1) {
    const startY = Math.floor((i / strips) * height);
    const stripHeight = Math.ceil(height / strips) + 3;
    const shift = Math.round((seededNoise(i, 1, seed) - 0.5) * width * 0.12);
    const roughTop = Math.round((seededNoise(i, 3, seed) - 0.5) * 18);
    context.drawImage(original, 0, startY, width, stripHeight, shift, startY + roughTop, width, stripHeight);
    context.fillStyle = i % 2 === 0 ? 'rgba(240,79,73,0.08)' : 'rgba(18,17,15,0.07)';
    context.fillRect(shift, startY + roughTop, width, stripHeight);
    context.fillStyle = 'rgba(10,9,8,0.5)';
    context.fillRect(shift, startY + roughTop, width, 1);
  }

  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(93, 54, 36, 0.16)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'poster-tear');
}

async function renderPosterPeel(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = document.createElement('canvas');
  original.width = width;
  original.height = height;
  const originalContext = original.getContext('2d');
  if (!originalContext) throw new Error('Canvas is not available in this browser.');
  originalContext.drawImage(canvas, 0, 0);
  const seed = file.size % 269;

  context.fillStyle = '#ddd3bd';
  context.fillRect(0, 0, width, height);

  const strips = 7;
  for (let i = 0; i < strips; i += 1) {
    const startX = Math.floor((i / strips) * width);
    const stripWidth = Math.ceil(width / strips) + 3;
    const peel = Math.round(Math.sin(i * 1.3 + seed) * height * 0.035);
    const shift = Math.round((seededNoise(i, 6, seed) - 0.5) * width * 0.08);
    context.drawImage(original, startX, 0, stripWidth, height, startX + shift, peel, stripWidth, height);
    context.fillStyle = 'rgba(245, 241, 232, 0.18)';
    context.fillRect(startX + shift, peel, Math.max(2, stripWidth * 0.08), height);
    context.fillStyle = 'rgba(32, 24, 18, 0.14)';
    context.fillRect(startX + shift + stripWidth - 2, peel, 2, height);
  }

  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(110, 75, 48, 0.18)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'poster-peel');
}

async function renderPhotocopySmear(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const source = imageData.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const seed = file.size % 251;

  const lumaAt = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    const index = (sy * width + sx) * 4;
    return (source[index] * 0.299 + source[index + 1] * 0.587 + source[index + 2] * 0.114) / 255;
  };

  for (let y = 0; y < height; y += 1) {
    const drag = seededNoise(Math.floor(y / 12), 0, seed) > 0.66 ? Math.round(width * 0.034 * seededNoise(y, 4, seed)) : 0;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luma = lumaAt(x + drag, y);
      const smear = Math.min(lumaAt(x - 9, y), lumaAt(x - 18, y), lumaAt(x - 31, y));
      const scan = y % 4 === 0 ? -0.1 : 0;
      const value = clampUnit((luma * 0.64 + smear * 0.3 - 0.43) * 2.25 + 0.5 + scan + (seededNoise(x, y, seed) - 0.5) * 0.16);
      const tone = value > 0.54 ? 245 : 18;
      data[index] = tone;
      data[index + 1] = tone;
      data[index + 2] = tone;
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  return finishEffect(canvas, file, format, 'photocopy-smear');
}

async function renderCopierDrag(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const source = imageData.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const seed = file.size % 257;

  const lumaAt = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    const index = (sy * width + sx) * 4;
    return (source[index] * 0.299 + source[index + 1] * 0.587 + source[index + 2] * 0.114) / 255;
  };

  for (let y = 0; y < height; y += 1) {
    const pull = Math.round(width * (0.025 + seededNoise(Math.floor(y / 18), 0, seed) * 0.065));
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luma = lumaAt(x + Math.round(Math.sin(y * 0.05) * 8), y);
      const dragged = Math.min(lumaAt(x - pull, y), lumaAt(x - Math.round(pull * 0.55), y), lumaAt(x - 8, y));
      const value = clampUnit((luma * 0.52 + dragged * 0.42 - 0.4) * 2.45 + 0.5 + (seededNoise(x, y, seed) - 0.5) * 0.2);
      const tone = value > 0.56 ? 246 : 14;
      data[index] = tone;
      data[index + 1] = tone;
      data[index + 2] = tone;
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  return finishEffect(canvas, file, format, 'copier-drag');
}

async function renderSoftBloom(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const glow = document.createElement('canvas');
  glow.width = width;
  glow.height = height;
  const glowContext = glow.getContext('2d');
  if (!glowContext) throw new Error('Canvas is not available in this browser.');
  glowContext.filter = `blur(${Math.max(10, Math.round(width * 0.025))}px) saturate(1.2) brightness(1.18)`;
  glowContext.drawImage(canvas, 0, 0);

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 239;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const grain = (seededNoise(x, y, seed) - 0.5) * 12;
      data[index] = clampByte(data[index] * 1.04 + 12 + grain);
      data[index + 1] = clampByte(data[index + 1] * 1.02 + 8 + grain * 0.8);
      data[index + 2] = clampByte(data[index + 2] * 0.98 + 6 + grain * 0.6);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.48;
  context.drawImage(glow, 0, 0);
  context.globalAlpha = 1;
  context.fillStyle = 'rgba(255, 214, 186, 0.1)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'soft-bloom');
}

async function renderFlashBloom(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 241;
  const centerX = width * 0.48;
  const centerY = height * 0.38;
  const maxDistance = Math.hypot(centerX, centerY);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const flash = Math.max(0, 1 - Math.hypot(x - centerX, y - centerY) / maxDistance * 1.42);
      const grain = (seededNoise(x, y, seed) - 0.5) * 22;
      data[index] = clampByte(data[index] * 1.08 + flash * 112 + grain + 12);
      data[index + 1] = clampByte(data[index + 1] * 1.03 + flash * 84 + grain * 0.82 + 8);
      data[index + 2] = clampByte(data[index + 2] * 0.95 + flash * 48 + grain * 0.62);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.filter = `blur(${Math.max(12, Math.round(width * 0.03))}px)`;
  context.globalCompositeOperation = 'screen';
  context.globalAlpha = 0.28;
  context.drawImage(canvas, 0, 0);
  context.globalAlpha = 1;
  context.filter = 'none';
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'flash-bloom');
}

async function renderRibbedGlass2(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const ribWidth = Math.max(14, Math.round(width / 34));

  const sampleIndex = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    return (sy * width + sx) * 4;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const local = (x % ribWidth) / ribWidth;
      const bend = Math.sin(local * Math.PI) * Math.round(ribWidth * 0.72) - ribWidth * 0.34;
      const sourceIndex = sampleIndex(Math.round(x + bend + Math.sin(y * 0.012) * 4), y);
      const highlight = local < 0.08 || local > 0.92 ? 34 : local > 0.42 && local < 0.55 ? -22 : 0;
      data[index] = clampByte(source[sourceIndex] * 1.02 + highlight);
      data[index + 1] = clampByte(source[sourceIndex + 1] * 1.01 + highlight * 0.86);
      data[index + 2] = clampByte(source[sourceIndex + 2] * 0.96 + highlight * 0.72);
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(28, 35, 24, 0.12)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'ribbed-glass-2');
}

async function renderGlassSlice(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const sliceWidth = Math.max(7, Math.round(width / 74));

  const sampleIndex = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    return (sy * width + sx) * 4;
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const slice = Math.floor(x / sliceWidth);
      const offset = Math.round(Math.sin(slice * 1.7) * sliceWidth * 1.7 + Math.sin(y * 0.015) * 3);
      const sourceIndex = sampleIndex(x + offset, y);
      const seam = x % sliceWidth < 1 ? 36 : 0;
      data[index] = clampByte(source[sourceIndex] + seam);
      data[index + 1] = clampByte(source[sourceIndex + 1] + seam * 0.88);
      data[index + 2] = clampByte(source[sourceIndex + 2] + seam * 0.72);
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(22, 32, 36, 0.1)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'glass-slice');
}

async function renderBadScanner(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const original = context.getImageData(0, 0, width, height);
  const source = original.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const seed = file.size % 223;

  const sampleIndex = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    return (sy * width + sx) * 4;
  };

  for (let y = 0; y < height; y += 1) {
    const jitter = Math.round((seededNoise(Math.floor(y / 5), 0, seed) - 0.5) * 8);
    const band = (seededNoise(0, Math.floor(y / 38), seed) - 0.5) * 34;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const sourceIndex = sampleIndex(x + jitter, y);
      const scratch = seededNoise(Math.floor(x / 2), Math.floor(y / 78), seed) > 0.996 ? 76 : 0;
      data[index] = clampByte(source[sourceIndex] * 1.03 + band + scratch + 5);
      data[index + 1] = clampByte(source[sourceIndex + 1] * 1.0 + band * 0.86 + scratch);
      data[index + 2] = clampByte(source[sourceIndex + 2] * 0.92 + band * 0.7 + scratch - 4);
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = 'rgba(72, 86, 72, 0.1)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'bad-scanner');
}

async function renderScannerBed(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 229;

  for (let y = 0; y < height; y += 1) {
    const lamp = Math.sin(y * 0.018) * 12 + (seededNoise(0, Math.floor(y / 48), seed) - 0.5) * 18;
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const dust = seededNoise(Math.floor(x / 2), Math.floor(y / 96), seed) > 0.997 ? 64 : 0;
      data[index] = clampByte(data[index] * 0.96 + lamp + dust + 10);
      data[index + 1] = clampByte(data[index + 1] * 0.99 + lamp * 0.92 + dust + 12);
      data[index + 2] = clampByte(data[index + 2] * 1.04 + lamp * 0.82 + dust + 18);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  context.globalCompositeOperation = 'screen';
  context.fillStyle = 'rgba(202, 226, 230, 0.08)';
  context.fillRect(0, 0, width, height);
  context.globalCompositeOperation = 'source-over';

  return finishEffect(canvas, file, format, 'scanner-bed');
}

async function renderNoirGrain(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 199;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const distance = Math.hypot(x - width / 2, y - height / 2) / Math.hypot(width / 2, height / 2);
      const luma = (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114);
      const grain = (seededNoise(x, y, seed) - 0.5) * 58;
      const value = clampByte((luma - 128) * 1.72 + 128 + grain - Math.max(0, distance - 0.36) * 130);
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = clampByte(value + 6);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return finishEffect(canvas, file, format, 'noir-grain');
}

async function renderNoirCrush(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const seed = file.size % 197;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const distance = Math.hypot(x - width / 2, y - height / 2) / Math.hypot(width / 2, height / 2);
      const luma = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
      const grain = (seededNoise(x, y, seed) - 0.5) * 72;
      const value = clampByte((luma - 128) * 2.2 + 120 + grain - Math.max(0, distance - 0.28) * 170);
      data[index] = value;
      data[index + 1] = value;
      data[index + 2] = value;
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return finishEffect(canvas, file, format, 'noir-crush');
}

async function renderHeatMap(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;
  const stops: Array<{ at: number; color: Rgb }> = [
    { at: 0, color: [30, 12, 67] },
    { at: 0.25, color: [31, 73, 161] },
    { at: 0.48, color: [19, 165, 142] },
    { at: 0.7, color: [239, 115, 36] },
    { at: 1, color: [255, 244, 167] },
  ];

  const colorFor = (value: number) => {
    const nextIndex = stops.findIndex((stop) => value <= stop.at);
    const highIndex = nextIndex < 1 ? 1 : nextIndex;
    const low = stops[highIndex - 1];
    const high = stops[highIndex] ?? stops[stops.length - 1];
    return mixColor(low.color, high.color, clampUnit((value - low.at) / Math.max(0.001, high.at - low.at)));
  };

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luma = clampUnit((data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255);
      const color = colorFor(luma);
      data[index] = clampByte(color[0]);
      data[index + 1] = clampByte(color[1]);
      data[index + 2] = clampByte(color[2]);
      data[index + 3] = 255;
    }
  }

  context.putImageData(imageData, 0, 0);
  return finishEffect(canvas, file, format, 'heat-map');
}

async function renderHeatMapGhost(file: File, format: OutputFormat) {
  const { canvas, context, width, height } = await createSourceCanvas(file, format);
  const imageData = context.getImageData(0, 0, width, height);
  const source = imageData.data;
  const output = context.createImageData(width, height);
  const data = output.data;
  const stops: Array<{ at: number; color: Rgb }> = [
    { at: 0, color: [24, 8, 55] },
    { at: 0.3, color: [28, 88, 176] },
    { at: 0.55, color: [38, 201, 151] },
    { at: 0.76, color: [245, 76, 41] },
    { at: 1, color: [255, 241, 135] },
  ];

  const colorFor = (value: number) => {
    const nextIndex = stops.findIndex((stop) => value <= stop.at);
    const highIndex = nextIndex < 1 ? 1 : nextIndex;
    const low = stops[highIndex - 1];
    const high = stops[highIndex] ?? stops[stops.length - 1];
    return mixColor(low.color, high.color, clampUnit((value - low.at) / Math.max(0.001, high.at - low.at)));
  };

  const sampleLuma = (x: number, y: number) => {
    const sx = Math.max(0, Math.min(width - 1, x));
    const sy = Math.max(0, Math.min(height - 1, y));
    const index = (sy * width + sx) * 4;
    return (source[index] * 0.299 + source[index + 1] * 0.587 + source[index + 2] * 0.114) / 255;
  };

  const ghostOffset = Math.max(5, Math.round(width * 0.015));
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const luma = sampleLuma(x, y);
      const ghost = Math.abs(luma - sampleLuma(x - ghostOffset, y));
      const color = colorFor(clampUnit(luma + ghost * 0.45));
      data[index] = clampByte(color[0] + ghost * 55);
      data[index + 1] = clampByte(color[1] + ghost * 24);
      data[index + 2] = clampByte(color[2] + ghost * 70);
      data[index + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
  return finishEffect(canvas, file, format, 'heat-map-ghost');
}

function renderEffect(file: File, format: OutputFormat, effectId: EffectId) {
  if (effectId === 'flash-trash') return renderFlashTrash(file, format);
  if (effectId === 'mall-portrait') return renderMallPortrait(file, format);
  if (effectId === 'acid-glitch') return renderAcidGlitch(file, format);
  if (effectId === 'haunted-glass') return renderHauntedGlass(file, format);
  if (effectId === 'polaroid-fade') return renderPolaroidFade(file, format);
  if (effectId === 'vhs-drip') return renderVhsDrip(file, format);
  if (effectId === 'blue-duotone') return renderBlueDuotone(file, format);
  if (effectId === 'linear-halftone') return renderLinearHalftone(file, format);
  if (effectId === 'xerox-ghost') return renderXeroxGhost(file, format);
  if (effectId === 'newsprint') return renderNewsprint(file, format);
  if (effectId === '3d-glasses') return render3dGlasses(file, format);
  if (effectId === 'muted-orange') return renderMutedTone(file, format, effectId, [191, 103, 62], [235, 218, 194], [42, 32, 27]);
  if (effectId === 'muted-green') return renderMutedTone(file, format, effectId, [102, 130, 86], [221, 221, 194], [24, 38, 31]);
  if (effectId === 'muted-yellow') return renderMutedTone(file, format, effectId, [191, 166, 76], [236, 226, 185], [43, 36, 24]);
  if (effectId === 'muted-red') return renderMutedTone(file, format, effectId, [159, 66, 58], [229, 207, 190], [42, 27, 25]);
  if (effectId === 'muted-pink') return renderMutedTone(file, format, effectId, [190, 119, 132], [237, 218, 208], [43, 32, 36]);
  if (effectId === 'ember-duotone') return renderDuotone(file, format, effectId, [37, 20, 16], [181, 87, 45], [238, 221, 191]);
  if (effectId === 'moss-duotone') return renderDuotone(file, format, effectId, [15, 32, 25], [94, 124, 76], [226, 222, 187]);
  if (effectId === 'rose-duotone') return renderDuotone(file, format, effectId, [42, 19, 31], [176, 98, 119], [237, 220, 205]);
  if (effectId === 'sulfur-duotone') return renderDuotone(file, format, effectId, [27, 29, 25], [171, 159, 62], [235, 230, 191]);
  if (effectId === 'poster-tear') return renderPosterTear(file, format);
  if (effectId === 'photocopy-smear') return renderPhotocopySmear(file, format);
  if (effectId === 'soft-bloom') return renderSoftBloom(file, format);
  if (effectId === 'ribbed-glass-2') return renderRibbedGlass2(file, format);
  if (effectId === 'bad-scanner') return renderBadScanner(file, format);
  if (effectId === 'noir-grain') return renderNoirGrain(file, format);
  if (effectId === 'heat-map') return renderHeatMap(file, format);
  if (effectId === 'flash-bloom') return renderFlashBloom(file, format);
  if (effectId === 'glass-slice') return renderGlassSlice(file, format);
  if (effectId === 'scanner-bed') return renderScannerBed(file, format);
  if (effectId === 'noir-crush') return renderNoirCrush(file, format);
  if (effectId === 'heat-map-ghost') return renderHeatMapGhost(file, format);
  if (effectId === 'poster-peel') return renderPosterPeel(file, format);
  if (effectId === 'copier-drag') return renderCopierDrag(file, format);
  if (effectId === 'midnight-duotone') return renderDuotone(file, format, effectId, [10, 15, 34], [82, 58, 124], [218, 232, 232]);
  return renderBadPrint(file, format);
}

export default function ToolsEffectsPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [format, setFormat] = useState<OutputFormat>('png');
  const [selectedEffectId, setSelectedEffectId] = useState<EffectId>('bad-print');
  const [isDragging, setIsDragging] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [zipBusy, setZipBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [frozenBackgroundStats, setFrozenBackgroundStats] = useState<BackgroundStats | null>(null);
  const [effectMenuOpen, setEffectMenuOpen] = useState(false);
  const [highlightedEffectId, setHighlightedEffectId] = useState<EffectId>('bad-print');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const effectMenuRef = useRef<HTMLDivElement>(null);
  const outputUrlsRef = useRef<Set<string>>(new Set());

  const outputConfig = useMemo(() => getOutputConfig(format), [format]);
  const selectedEffect = useMemo(() => getEffect(selectedEffectId), [selectedEffectId]);
  const selectedEffectIndex = EFFECTS.findIndex((effect) => effect.id === selectedEffectId);
  const processedCount = items.filter((item) => item.status === 'done').length;
  const activeCount = items.filter((item) => item.status === 'processing').length;
  const totalOutputBytes = items.reduce((sum, item) => sum + (item.outputBlob?.size ?? 0), 0);
  const previewItem = items[0];
  const hasItems = items.length > 0;
  const backgroundStats = exportOpen && frozenBackgroundStats
    ? frozenBackgroundStats
    : { itemCount: items.length, processedCount, totalOutputBytes };

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
    folderInputRef.current?.setAttribute('directory', '');
  }, []);

  useEffect(() => {
    if (!effectMenuOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!effectMenuRef.current?.contains(event.target as Node)) {
        setEffectMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [effectMenuOpen]);

  useEffect(() => {
    if (!exportOpen) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeExport();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [exportOpen]);

  useEffect(() => {
    return () => {
      outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      outputUrlsRef.current.clear();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'));
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  useEffect(() => {
    let cancelled = false;

    const renderPreview = async () => {
      if (!previewItem) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl('');
        }
        return;
      }

      setPreviewBusy(true);
      try {
        const result = await renderEffect(previewItem.file, 'png', selectedEffectId);
        if (cancelled) return;
        const nextUrl = URL.createObjectURL(result.blob);
        setPreviewUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextUrl;
        });
      } catch {
        if (!cancelled) setPreviewUrl('');
      } finally {
        if (!cancelled) setPreviewBusy(false);
      }
    };

    renderPreview();
    return () => {
      cancelled = true;
    };
  }, [previewItem?.id, selectedEffectId]);

  const resetProcessedOutputs = (closeExport = true) => {
    if (closeExport) setExportOpen(false);
    setItems((current) => current.map((item) => {
      if (item.outputUrl) {
        URL.revokeObjectURL(item.outputUrl);
        outputUrlsRef.current.delete(item.outputUrl);
      }
      if (item.status === 'done') {
        return {
          ...item,
          status: 'ready',
          progress: 'Ready',
          outputName: undefined,
          outputBlob: undefined,
          outputUrl: undefined,
        };
      }
      return item;
    }));
  };

  const chooseEffect = (effectId: EffectId) => {
    if (effectId === selectedEffectId || activeCount > 0) return;
    resetProcessedOutputs();
    setSelectedEffectId(effectId);
    setHighlightedEffectId(effectId);
  };

  const moveEffect = (direction: 1 | -1) => {
    const currentIndex = selectedEffectIndex >= 0 ? selectedEffectIndex : 0;
    const nextIndex = (currentIndex + direction + EFFECTS.length) % EFFECTS.length;
    chooseEffect(EFFECTS[nextIndex].id);
  };

  const chooseRandomEffect = () => {
    if (activeCount > 0 || EFFECTS.length < 2) return;
    const availableEffects = EFFECTS.filter((effect) => effect.id !== selectedEffectId);
    const nextEffect = availableEffects[Math.floor(Math.random() * availableEffects.length)];
    if (nextEffect) chooseEffect(nextEffect.id);
  };

  const selectEffectFromMenu = (effectId: EffectId) => {
    chooseEffect(effectId);
    setEffectMenuOpen(false);
  };

  const moveHighlightedEffect = (direction: 1 | -1) => {
    const currentIndex = EFFECTS.findIndex((effect) => effect.id === highlightedEffectId);
    const nextIndex = ((currentIndex >= 0 ? currentIndex : selectedEffectIndex) + direction + EFFECTS.length) % EFFECTS.length;
    setHighlightedEffectId(EFFECTS[nextIndex].id);
  };

  const onEffectMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && effectMenuOpen) {
      event.preventDefault();
      setEffectMenuOpen(false);
      return;
    }

    if (activeCount > 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!effectMenuOpen) {
        setHighlightedEffectId(selectedEffectId);
        setEffectMenuOpen(true);
      } else {
        moveHighlightedEffect(1);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!effectMenuOpen) {
        setHighlightedEffectId(selectedEffectId);
        setEffectMenuOpen(true);
      } else {
        moveHighlightedEffect(-1);
      }
    } else if (event.key === 'Home' && effectMenuOpen) {
      event.preventDefault();
      setHighlightedEffectId(EFFECTS[0].id);
    } else if (event.key === 'End' && effectMenuOpen) {
      event.preventDefault();
      setHighlightedEffectId(EFFECTS[EFFECTS.length - 1].id);
    } else if ((event.key === 'Enter' || event.key === ' ') && effectMenuOpen) {
      event.preventDefault();
      selectEffectFromMenu(highlightedEffectId);
    }
  };

  const chooseFormat = (nextFormat: OutputFormat) => {
    if (nextFormat === format || activeCount > 0) return;
    setFormat(nextFormat);
    resetProcessedOutputs(false);
    if (exportOpen && items.length) {
      void processItems(nextFormat, true);
    }
  };

  const addFiles = (incoming: File[]) => {
    setBatchError('');
    const imageFiles = incoming.filter((file) => file.type.startsWith('image/') || /\.(avif|bmp|gif|jpe?g|png|webp)$/i.test(file.name));
    const sizedFiles = imageFiles.filter((file) => file.size <= MAX_FILE_SIZE);

    setItems((current) => {
      const remaining = MAX_FILES - current.length;
      const accepted = sizedFiles.slice(0, Math.max(0, remaining));
      const next = accepted.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        status: 'ready' as const,
        progress: 'Ready',
      }));

      if (imageFiles.length !== sizedFiles.length) {
        setBatchError(`Skipped images over ${formatBytes(MAX_FILE_SIZE)}.`);
      } else if (sizedFiles.length > remaining) {
        setBatchError(`Added ${accepted.length}. Batch limit is ${MAX_FILES} images.`);
      } else if (incoming.length !== imageFiles.length) {
        setBatchError('Skipped files that were not images.');
      }

      return [...current, ...next];
    });
  };

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;
      if (patch.outputUrl && item.outputUrl && patch.outputUrl !== item.outputUrl) {
        URL.revokeObjectURL(item.outputUrl);
        outputUrlsRef.current.delete(item.outputUrl);
      }
      if (patch.outputUrl) outputUrlsRef.current.add(patch.outputUrl);
      return { ...item, ...patch };
    }));
  };

  const processItems = async (targetFormat: OutputFormat = format, forceAll = false) => {
    setBatchError('');
    const readyItems = items.filter((item) => forceAll || item.status === 'ready' || item.status === 'error');

    for (const item of readyItems) {
      updateItem(item.id, { status: 'processing', progress: 'Applying', error: undefined });
      try {
        const result = await renderEffect(item.file, targetFormat, selectedEffectId);
        updateItem(item.id, {
          status: 'done',
          progress: `${formatBytes(item.file.size)} to ${formatBytes(result.blob.size)}`,
          outputBlob: result.blob,
          outputName: result.name,
          outputUrl: URL.createObjectURL(result.blob),
        });
      } catch (error) {
        updateItem(item.id, {
          status: 'error',
          progress: 'Needs attention',
          error: error instanceof Error ? error.message : 'This image could not be processed in the browser.',
        });
      }
    }
  };

  const processAll = async () => {
    await processItems(format);
  };

  const applyAndOpenExport = async () => {
    if (!items.length || activeCount > 0) return;
    await processItems(format);
    setFrozenBackgroundStats({ itemCount: items.length, processedCount: items.length, totalOutputBytes });
    setExportOpen(true);
  };

  const closeExport = () => {
    setExportOpen(false);
    setFrozenBackgroundStats(null);
  };

  const clearAll = () => {
    items.forEach((item) => {
      if (item.outputUrl) {
        URL.revokeObjectURL(item.outputUrl);
        outputUrlsRef.current.delete(item.outputUrl);
      }
    });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    setItems([]);
    setBatchError('');
    closeExport();
  };

  const removeItem = (id: string) => {
    setItems((current) => {
      const target = current.find((item) => item.id === id);
      if (target?.outputUrl) {
        URL.revokeObjectURL(target.outputUrl);
        outputUrlsRef.current.delete(target.outputUrl);
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const downloadZip = async () => {
    const processed = items.filter((item) => item.outputBlob && item.outputName);
    if (!processed.length) return;

    setZipBusy(true);
    try {
      const zip = new JSZip();
      processed.forEach((item) => zip.file(item.outputName!, item.outputBlob!));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `hella-effects-${selectedEffect.id}-${outputConfig.ext}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setZipBusy(false);
    }
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  return (
    <div className="effects-page">
      <HellaRichSEO
        title="HELLA EFFECTS"
        description="Free browser image effects. Upload photos, apply hella.rich filter styles, and export locally with no account, no API, and no payment step."
        keywords="free image effects, vintage filter, glitch effect, halftone effect, browser image filter, hella.rich tools"
      />

      <style>{`
	        @font-face {
	          font-family: "Abismo Sangriento";
	          src: url("${import.meta.env.BASE_URL}fonts/AbismoSangriento-Regular.otf") format("opentype");
	          font-weight: 400;
	          font-style: normal;
	          font-display: swap;
	        }
	        @font-face {
	          font-family: "TC Acrylic Hand";
	          src: url("${import.meta.env.BASE_URL}fonts/TCAcrylicHandThick-Regular.otf") format("opentype");
	          font-weight: 400;
	          font-style: normal;
	          font-display: swap;
	        }
        .effects-page {
          min-height: 100vh;
          background: #0a0908;
          color: #f5f1e8;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding: clamp(88px, 8.8vw, 118px) clamp(24px, 4.1vw, 52px) clamp(54px, 6vw, 78px);
        }
	        .effects-shell {
	          max-width: 1186px;
	          margin: 0 auto;
	          display: grid;
	          grid-template-columns: minmax(0, 1.04fr) minmax(clamp(330px, 34vw, 452px), 0.78fr);
	          grid-template-areas: "intro settings" "drop batch";
	          grid-template-rows: minmax(clamp(360px, 29vw, 392px), auto) clamp(520px, 41vw, 586px);
	          column-gap: clamp(24px, 2.8vw, 34px);
	          row-gap: clamp(28px, 3vw, 34px);
	          align-items: stretch;
	        }
	        .effects-intro {
	          grid-area: intro;
	          min-width: 0;
	          min-height: 0;
	          display: flex;
	          flex-direction: column;
	          height: 100%;
	        }
        .effects-kicker,
        .effects-stat-label,
        .effects-label,
        .effects-pill,
        .effects-file-meta,
        .effects-button,
        .effects-format-button {
          font-family: "DM Mono", "Space Mono", monospace;
          text-transform: uppercase;
        }
        .effects-kicker {
          margin: 0 0 clamp(22px, 3.1vw, 36px);
          color: rgba(245,241,232,0.44);
          font-size: clamp(8px, 0.74vw, 10px);
          letter-spacing: 0.18em;
        }
        .effects-title {
          margin: 0;
          color: #f06459;
          font-family: "Abismo Sangriento", "DM Mono", monospace;
          font-size: clamp(54px, 7.6vw, 116px);
          font-weight: 400;
          line-height: 0.82;
          letter-spacing: 0;
          text-transform: uppercase;
          text-wrap: balance;
        }
        .effects-copy {
          max-width: clamp(500px, 52vw, 646px);
          margin: clamp(28px, 4.1vw, 50px) 0 0;
          color: rgba(245,241,232,0.82);
          font-size: clamp(18px, 1.75vw, 20px);
          line-height: 1.45;
          text-wrap: pretty;
        }
	        .effects-stats {
	          display: grid;
	          grid-template-columns: repeat(3, minmax(0, 1fr));
	          border: 1px solid rgba(245,241,232,0.16);
	          margin: auto 0 0;
	          overflow: hidden;
	        }
        .effects-stat {
          min-height: clamp(76px, 6.6vw, 80px);
          padding: clamp(14px, 1.3vw, 17px);
          border-right: 1px solid rgba(245,241,232,0.16);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .effects-stat:last-child { border-right: 0; }
        .effects-stat-label {
          color: rgba(245,241,232,0.42);
          font-size: clamp(8px, 0.65vw, 9px);
          letter-spacing: 0.17em;
        }
	        .effects-stat-value {
	          color: #f04f49;
	          font-size: clamp(28px, 3vw, 34px);
	          line-height: 1;
	          font-variant-numeric: tabular-nums;
	          white-space: nowrap;
	        }
        .effects-drop {
          grid-area: drop;
          border: 1px dashed rgba(245,241,232,0.34);
          background: rgba(245,241,232,0.035);
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
        }
	        .effects-drop.dragging {
	          border-color: #f04f49;
	          background: rgba(240,79,73,0.11);
	        }
        .effects-upload-state,
        .effects-preview-state {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: clamp(28px, 4.5vw, 56px);
        }
        .effects-preview-state { justify-content: stretch; }
        .effects-drop-icon {
          width: clamp(38px, 4vw, 48px);
          height: clamp(38px, 4vw, 48px);
          color: #f04f49;
          margin-bottom: clamp(22px, 2.8vw, 31px);
          stroke-width: 1.8;
        }
        .effects-drop-title {
          margin: 0;
          font-family: "DM Mono", monospace;
          font-size: clamp(19px, 2vw, 24px);
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .effects-drop-copy {
          margin: clamp(16px, 1.7vw, 18px) 0 0;
          color: rgba(245,241,232,0.62);
          font-size: clamp(13px, 1.35vw, 15px);
          line-height: 1.5;
        }
        .effects-preview-frame {
          width: 100%;
          flex: 1;
          min-height: 0;
          border: 1px solid rgba(245,241,232,0.12);
          background:
            linear-gradient(90deg, rgba(245,241,232,0.04) 1px, transparent 1px),
            linear-gradient(rgba(245,241,232,0.04) 1px, transparent 1px),
            #11100e;
          background-size: 18px 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .effects-preview-frame img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          image-rendering: auto;
        }
        .effects-preview-caption {
          width: 100%;
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-top: 14px;
          color: rgba(245,241,232,0.45);
          font-family: "DM Mono", monospace;
          font-size: clamp(8px, 0.72vw, 10px);
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .effects-effect-nav {
          width: 100%;
          display: grid;
          grid-template-columns: clamp(40px, 4vw, 44px) minmax(0, 1fr) clamp(40px, 4vw, 44px);
          align-items: center;
          gap: 10px;
          margin-top: 13px;
        }
        .effects-arrow {
          width: clamp(40px, 4vw, 44px);
          height: clamp(40px, 4vw, 44px);
          border: 1px solid rgba(245,241,232,0.16);
          background: rgba(245,241,232,0.07);
          color: rgba(245,241,232,0.78);
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .effects-arrow:hover:not(:disabled) {
          border-color: rgba(245,241,232,0.38);
          background: rgba(245,241,232,0.12);
          color: #f5f1e8;
        }
        .effects-arrow:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }
        .effects-selected {
          min-width: 0;
          border: 1px solid rgba(245,241,232,0.13);
          background: rgba(0,0,0,0.16);
          padding: 11px 12px;
          text-align: left;
        }
        .effects-selected-name,
        .effects-selected-count {
          font-family: "DM Mono", monospace;
          text-transform: uppercase;
          letter-spacing: 0.13em;
        }
        .effects-selected-name {
          color: #f5f1e8;
          font-size: clamp(10px, 0.95vw, 12px);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .effects-selected-count {
          margin-top: 5px;
          color: #f04f49;
          font-size: clamp(8px, 0.7vw, 9px);
        }
        .effects-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: clamp(9px, 1vw, 11px);
          margin-top: clamp(22px, 2.6vw, 28px);
        }
        .effects-button {
          min-height: clamp(40px, 3.6vw, 43px);
          border: 1px solid rgba(245,241,232,0.18);
          background: rgba(245,241,232,0.08);
          color: #f5f1e8;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 clamp(13px, 1.4vw, 16px);
          font-size: clamp(8px, 0.72vw, 10px);
          letter-spacing: 0.14em;
          cursor: pointer;
        }
        .effects-button:hover:not(:disabled),
        .effects-format-button:hover {
          border-color: rgba(245,241,232,0.4);
          background: rgba(245,241,232,0.12);
        }
        .effects-button.primary {
          background: #f04f49;
          border-color: #f04f49;
          color: #0a0908;
        }
        .effects-button:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }
        .effects-button.effects-dice-button {
          width: clamp(40px, 3.6vw, 43px);
          flex: 0 0 clamp(40px, 3.6vw, 43px);
          padding: 0;
        }
	        .effects-panel {
	          border: 1px solid rgba(245,241,232,0.18);
	          background: rgba(245,241,232,0.045);
	          box-sizing: border-box;
	          min-height: 0;
	          padding: clamp(26px, 2.6vw, 31px) clamp(24px, 2.3vw, 28px);
	        }
	        .effects-settings {
	          grid-area: settings;
	          min-width: 0;
	          height: 100%;
	          display: flex;
	          flex-direction: column;
	        }
        .effects-batch {
          grid-area: batch;
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .effects-panel-title {
          margin: 0 0 clamp(20px, 2.1vw, 25px);
          font-family: "DM Mono", monospace;
          font-size: clamp(9px, 0.78vw, 11px);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(245,241,232,0.7);
        }
        .effects-field { margin-top: clamp(20px, 2vw, 24px); }
        .effects-field:first-of-type { margin-top: 0; }
        .effects-label {
          display: block;
          margin-bottom: clamp(8px, 1vw, 11px);
          font-size: clamp(8px, 0.63vw, 9px);
          letter-spacing: 0.16em;
          color: rgba(245,241,232,0.48);
        }
        .effects-style-select {
          position: relative;
        }
        .effects-style-trigger {
          width: 100%;
          height: clamp(112px, 10vw, 132px);
          border: 1px solid rgba(240,79,73,0.42);
          background: rgba(72,22,20,0.42);
          color: #f5f1e8;
          border-radius: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) clamp(42px, 4vw, 48px);
          align-items: center;
          gap: clamp(14px, 1.5vw, 18px);
          padding: 0 clamp(14px, 1.4vw, 16px);
          cursor: pointer;
          text-align: left;
        }
        .effects-style-trigger:hover:not(:disabled),
        .effects-style-trigger[aria-expanded="true"] {
          border-color: rgba(240,79,73,0.78);
          background: rgba(72,22,20,0.62);
        }
        .effects-style-trigger:disabled {
          opacity: 0.48;
          cursor: not-allowed;
        }
        .effects-style-trigger:focus-visible,
        .effects-arrow:focus-visible,
        .effects-button:focus-visible,
        .effects-format-button:focus-visible,
        .effects-icon-button:focus-visible {
          outline: 1px solid #f04f49;
          outline-offset: 3px;
        }
        .effects-style-summary {
          min-width: 0;
          padding: clamp(16px, 1.9vw, 22px) 0;
        }
        .effects-style-name {
          display: block;
          color: #f5f1e8;
          font-family: "DM Mono", monospace;
          font-size: clamp(10px, 0.9vw, 12px);
          letter-spacing: 0.13em;
          text-transform: uppercase;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .effects-style-desc {
          display: -webkit-box;
          margin: clamp(11px, 1.2vw, 14px) 0 0;
          color: rgba(245,241,232,0.56);
          font-size: clamp(12px, 1.08vw, 13px);
          line-height: 1.45;
          overflow: hidden;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
        }
        .effects-style-caret {
          width: clamp(42px, 4vw, 48px);
          height: clamp(42px, 4vw, 48px);
          background: #f04f49;
          color: #0a0908;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          justify-self: end;
        }
        .effects-style-trigger[aria-expanded="true"] .effects-style-caret svg {
          transform: rotate(180deg);
        }
        .effects-style-caret svg {
          transition: transform 0.16s ease;
        }
        .effects-style-menu {
          position: absolute;
          z-index: 30;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          max-height: min(340px, 46vh);
          overflow-y: auto;
          border: 1px solid rgba(245,241,232,0.18);
          background: #12110f;
          box-shadow: 0 20px 44px rgba(0,0,0,0.42);
          padding: 6px;
        }
        .effects-style-option {
          width: 100%;
          min-height: 54px;
          border: 1px solid transparent;
          background: transparent;
          color: rgba(245,241,232,0.66);
          display: grid;
          grid-template-columns: minmax(0, 1fr) 22px;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          text-align: left;
          cursor: pointer;
        }
        .effects-style-option:hover,
        .effects-style-option.highlighted {
          border-color: rgba(245,241,232,0.16);
          background: rgba(245,241,232,0.07);
          color: #f5f1e8;
        }
        .effects-style-option.active {
          border-color: rgba(240,79,73,0.48);
          background: rgba(240,79,73,0.13);
          color: #f5f1e8;
        }
        .effects-style-option-title {
          display: block;
          font-family: "DM Mono", monospace;
          font-size: clamp(8px, 0.72vw, 10px);
          letter-spacing: 0.13em;
          text-transform: uppercase;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .effects-style-option-caption {
          display: block;
          margin-top: 5px;
          color: rgba(245,241,232,0.44);
          font-size: clamp(11px, 1vw, 12px);
          line-height: 1.35;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .effects-format-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: clamp(8px, 0.9vw, 10px);
        }
        .effects-format-button {
          height: clamp(42px, 4vw, 44px);
          border: 1px solid rgba(245,241,232,0.16);
          background: rgba(0,0,0,0.18);
          color: rgba(245,241,232,0.66);
          border-radius: 3px;
          font-size: clamp(8px, 0.72vw, 10px);
          letter-spacing: 0.12em;
          cursor: pointer;
        }
        .effects-format-button.active {
          background: #f5f1e8;
          color: #0a0908;
          border-color: #f5f1e8;
        }
        .effects-note {
          margin: clamp(12px, 1.35vw, 15px) 0 0;
          color: rgba(245,241,232,0.42);
          font-size: clamp(11px, 1.08vw, 12px);
          line-height: 1.45;
        }
        .effects-batch-actions {
          justify-content: flex-start;
          margin-top: 0;
        }
        .effects-queue {
          margin-top: clamp(18px, 1.8vw, 21px);
          border: 1px solid rgba(245,241,232,0.14);
          min-height: 0;
          flex: 1 1 auto;
          overflow: auto;
        }
        .effects-file {
          display: grid;
          grid-template-columns: 26px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: clamp(12px, 1.3vw, 14px);
          border-bottom: 1px solid rgba(245,241,232,0.1);
        }
        .effects-file:last-child { border-bottom: 0; }
        .effects-file-name {
          overflow: hidden;
          color: rgba(245,241,232,0.86);
          font-size: clamp(13px, 1.25vw, 14px);
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .effects-file-meta {
          margin-top: 4px;
          color: rgba(245,241,232,0.42);
          font-size: clamp(8px, 0.7vw, 9px);
          letter-spacing: 0.08em;
        }
        .effects-file-error {
          margin-top: 6px;
          color: #ff8f88;
          font-size: clamp(11px, 1vw, 12px);
          line-height: 1.35;
        }
        .effects-file-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .effects-icon-button {
          width: clamp(32px, 3.4vw, 34px);
          height: clamp(32px, 3.4vw, 34px);
          border: 1px solid rgba(245,241,232,0.14);
          background: rgba(245,241,232,0.06);
          color: rgba(245,241,232,0.7);
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .effects-icon-button:hover { color: #f5f1e8; border-color: rgba(245,241,232,0.36); }
        .effects-empty {
          min-height: clamp(68px, 7vw, 70px);
          padding: clamp(20px, 2vw, 24px);
          color: rgba(245,241,232,0.42);
          font-size: clamp(13px, 1.25vw, 14px);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
	        .effects-alert {
	          margin-top: 14px;
	          color: #ffb3ad;
	          font-size: clamp(12px, 1.1vw, 13px);
	          line-height: 1.4;
	        }
	        .effects-hidden { display: none; }
	        .effects-page {
	          padding: clamp(92px, 7.2vw, 132px) clamp(22px, 4.6vw, 72px) clamp(56px, 5vw, 86px);
	        }
	        .effects-shell {
	          width: min(100%, clamp(780px, 72vw, 1180px));
	          display: block;
	          border: 1px solid rgba(245,241,232,0.2);
	          background: rgba(245,241,232,0.025);
	          padding: clamp(36px, 4.1vw, 56px) clamp(34px, 4.2vw, 58px) clamp(34px, 4.1vw, 55px);
	        }
	        .effects-intro {
	          display: grid;
	          grid-template-columns: minmax(0, 1fr) auto;
	          align-items: end;
	          column-gap: clamp(24px, 4vw, 64px);
	          height: auto;
	        }
	        .effects-kicker,
	        .effects-title {
	          grid-column: 1 / -1;
	        }
	        .effects-title {
	          font-family: "TC Acrylic Hand", "DM Mono", monospace;
	          font-size: clamp(60px, 8.2vw, 124px);
	          line-height: 0.82;
	          letter-spacing: 0;
	        }
	        .effects-copy {
	          max-width: clamp(430px, 38vw, 580px);
	          margin-top: clamp(24px, 3.3vw, 46px);
	          font-size: clamp(13px, 1.05vw, 15px);
	          line-height: 1.45;
	        }
	        .effects-stats {
	          display: grid;
	          grid-template-columns: repeat(3, auto);
	          gap: clamp(26px, 3.1vw, 46px);
	          justify-content: end;
	          align-items: start;
	          align-self: end;
	          border: 0;
	          margin: 0;
	          min-width: clamp(220px, 22vw, 310px);
	        }
	        .effects-shell:not(.has-items) .effects-stats {
	          display: none;
	        }
	        .effects-shell.export-open .effects-button:disabled {
	          opacity: 1;
	        }
	        .effects-stat {
	          min-height: 0;
	          padding: 0;
	          border: 0;
	          display: block;
	        }
	        .effects-stat-label {
	          display: block;
	          margin-bottom: clamp(5px, 0.5vw, 7px);
	          font-size: clamp(7px, 0.58vw, 9px);
	        }
	        .effects-stat-value {
	          font-size: clamp(17px, 1.7vw, 22px);
	          line-height: 1;
	        }
	        .effects-drop {
	          margin-top: clamp(28px, 2.8vw, 34px);
	          height: auto;
	          min-height: clamp(520px, 49vw, 680px);
	          border-color: rgba(245,241,232,0.2);
	          background: rgba(12,11,10,0.56);
	        }
	        .effects-shell:not(.has-items) .effects-drop {
	          border-style: solid;
	          min-height: clamp(560px, 55vw, 720px);
	        }
	        .effects-shell.has-items .effects-drop {
	          border: 0;
	          background: transparent;
	          min-height: 0;
	        }
	        .effects-upload-state {
	          min-height: clamp(500px, 50vw, 655px);
	        }
	        .effects-preview-state {
	          padding: 0;
	          align-items: stretch;
	          text-align: left;
	        }
	        .effects-preview-frame {
	          height: clamp(330px, 31vw, 430px);
	          flex: 0 0 auto;
	          border-color: rgba(245,241,232,0.16);
	        }
	        .effects-preview-caption {
	          margin-top: clamp(18px, 1.7vw, 22px);
	          font-size: clamp(9px, 0.85vw, 12px);
	          letter-spacing: 0.14em;
	        }
	        .effects-effect-nav {
	          grid-template-columns: clamp(66px, 5.8vw, 78px) minmax(0, 1fr) clamp(66px, 5.8vw, 78px);
	          gap: clamp(18px, 2vw, 26px);
	          margin-top: clamp(30px, 3.2vw, 42px);
	        }
	        .effects-arrow {
	          width: clamp(58px, 5.5vw, 72px);
	          height: clamp(58px, 5.5vw, 72px);
	        }
	        .effects-selected {
	          border: 0;
	          background: transparent;
	          padding: 0;
	          align-self: center;
	        }
	        .effects-selected-name {
	          font-size: clamp(17px, 1.65vw, 22px);
	          letter-spacing: 0.18em;
	        }
	        .effects-selected-count {
	          font-size: clamp(10px, 0.92vw, 12px);
	        }
	        .effects-actions {
	          justify-content: flex-start;
	          align-items: center;
	          gap: clamp(14px, 1.5vw, 20px);
	          margin-top: clamp(28px, 3.1vw, 42px);
	        }
	        .effects-button {
	          min-height: clamp(48px, 4.6vw, 68px);
	          padding: 0 clamp(18px, 2vw, 28px);
	          font-size: clamp(10px, 0.92vw, 13px);
	          letter-spacing: 0.15em;
	        }
	        .effects-button.effects-dice-button {
	          width: clamp(48px, 4.6vw, 68px);
	          flex-basis: clamp(48px, 4.6vw, 68px);
	        }
	        .effects-apply-button {
	          margin-left: auto;
	          min-width: clamp(220px, 21vw, 300px);
	          font-size: clamp(13px, 1.2vw, 17px);
	          letter-spacing: 0.16em;
	        }
	        .effects-settings,
	        .effects-batch {
	          display: none;
	        }
	        .effects-export-overlay {
	          position: fixed;
	          inset: 0;
	          z-index: 80;
	          display: flex;
	          justify-content: flex-end;
	          background: rgba(0,0,0,0);
	          pointer-events: none;
	          opacity: 0;
	          transition: opacity 0.18s ease, background 0.18s ease;
	        }
	        .effects-export-overlay.open {
	          background: rgba(0,0,0,0.72);
	          pointer-events: auto;
	          opacity: 1;
	        }
	        .effects-export-drawer {
	          width: min(100%, clamp(420px, 48vw, 590px));
	          min-height: 100%;
	          border-left: 1px solid rgba(245,241,232,0.18);
	          background: #0a0908;
	          padding: clamp(28px, 3.4vw, 48px);
	          transform: translateX(100%);
	          transition: transform 0.22s cubic-bezier(.2,.8,.2,1);
	          overflow-y: auto;
	        }
	        .effects-export-overlay.open .effects-export-drawer {
	          transform: translateX(0);
	        }
	        .effects-export-close {
	          margin-left: auto;
	          width: clamp(42px, 4vw, 48px);
	          height: clamp(42px, 4vw, 48px);
	          border: 1px solid rgba(245,241,232,0.16);
	          background: rgba(245,241,232,0.08);
	          color: rgba(245,241,232,0.72);
	          display: flex;
	          align-items: center;
	          justify-content: center;
	          cursor: pointer;
	        }
	        .effects-export-card {
	          border: 1px solid rgba(245,241,232,0.18);
	          background: rgba(245,241,232,0.045);
	          padding: clamp(24px, 2.7vw, 31px);
	          margin-top: clamp(28px, 3vw, 36px);
	        }
	        .effects-export-card .effects-queue {
	          min-height: clamp(260px, 31vw, 430px);
	          max-height: clamp(300px, 44vw, 520px);
	        }
	        .effects-export-actions {
	          margin-top: clamp(18px, 2vw, 24px);
	          justify-content: flex-start;
	        }
	        @media (max-width: 960px) {
	          .effects-shell {
	            width: min(100%, 760px);
	          }
	          .effects-intro {
	            grid-template-columns: 1fr;
	          }
	          .effects-stats {
	            justify-content: start;
	            margin-top: clamp(22px, 5vw, 34px);
	          }
	          .effects-apply-button {
	            margin-left: 0;
	            width: 100%;
	          }
	        }
	        @media (max-width: 680px) {
	          .effects-page {
	            padding: clamp(84px, 17vw, 104px) clamp(14px, 4.5vw, 24px) clamp(28px, 8vw, 48px);
	          }
	          .effects-shell {
	            padding: clamp(24px, 7vw, 34px) clamp(18px, 6vw, 28px) clamp(22px, 7vw, 32px);
	          }
	          .effects-title {
	            font-size: clamp(44px, 18vw, 76px);
	          }
	          .effects-stats {
	            grid-template-columns: repeat(3, minmax(0, 1fr));
	            width: 100%;
	            gap: 12px;
	          }
	          .effects-effect-nav {
	            grid-template-columns: 48px minmax(0, 1fr) 48px;
	          }
	          .effects-arrow {
	            width: 48px;
	            height: 48px;
	          }
	          .effects-export-drawer {
	            width: 100%;
	            padding: clamp(18px, 5vw, 28px);
	          }
	        }
	        @media (max-width: 960px) {
          .effects-page {
            padding: clamp(78px, 14vw, 104px) clamp(16px, 5vw, 34px) clamp(34px, 8vw, 56px);
          }
          .effects-shell {
            grid-template-columns: 1fr;
            grid-template-areas: "intro" "settings" "drop" "batch";
            grid-template-rows: auto auto clamp(420px, 78vw, 586px) clamp(420px, 78vw, 586px);
          }
          .effects-title { font-size: clamp(48px, 17vw, 104px); }
          .effects-copy {
            max-width: 100%;
            margin-top: clamp(18px, 5vw, 34px);
          }
          .effects-stats { margin-top: clamp(28px, 8vw, 48px); }
        }
        @media (max-width: 680px) {
          .effects-stats { grid-template-columns: 1fr; }
          .effects-stat { border-right: 0; border-bottom: 1px solid rgba(245,241,232,0.14); }
          .effects-stat:last-child { border-bottom: 0; }
          .effects-title { font-size: clamp(44px, 21vw, 82px); }
        }
	        @media (max-width: 560px) {
	          .effects-format-grid { grid-template-columns: 1fr; }
	          .effects-file { grid-template-columns: 22px minmax(0, 1fr); }
	          .effects-file-actions { grid-column: 2; justify-content: flex-start; }
	          .effects-actions { justify-content: stretch; }
          .effects-button { flex: 1 1 100%; }
          .effects-button.effects-dice-button {
            flex: 0 0 43px;
            width: 43px;
          }
          .effects-batch-actions { justify-content: stretch; }
          .effects-preview-caption { flex-direction: column; gap: 6px; }
          .effects-effect-nav {
            grid-template-columns: 38px minmax(0, 1fr) 38px;
          }
          .effects-arrow {
            width: 38px;
	            height: 38px;
	          }
	        }
	        @media (max-width: 960px) {
	          .effects-shell {
	            display: block;
	            grid-template-columns: none;
	            grid-template-areas: none;
	            grid-template-rows: none;
	          }
	          .effects-stats {
	            margin-top: clamp(22px, 5vw, 34px);
	          }
	        }
	        @media (max-width: 680px) {
	          .effects-stats {
	            grid-template-columns: repeat(3, minmax(0, 1fr));
	            width: 100%;
	            gap: 12px;
	          }
	          .effects-stat {
	            border: 0;
	          }
	        }
	        @media (max-width: 560px) {
	          .effects-button.effects-dice-button {
	            flex: 0 0 clamp(48px, 13vw, 56px);
	            width: clamp(48px, 13vw, 56px);
	          }
	          .effects-effect-nav {
	            grid-template-columns: 48px minmax(0, 1fr) 48px;
	          }
	          .effects-arrow {
	            width: 48px;
	            height: 48px;
	          }
	        }
	      `}</style>

	      <div className={`effects-shell${hasItems ? ' has-items' : ''}${exportOpen ? ' export-open' : ''}`}>
        <section className="effects-intro" aria-labelledby="effects-title">
          <p className="effects-kicker">hella.rich / tools / effects</p>
          <h1 id="effects-title" className="effects-title">HELLA EFFECTS</h1>
          <p className="effects-copy">
            Apply hella.rich photo styles in your browser. Your files stay on your device. Free, no account, no payment step.
          </p>

          <div className="effects-stats" aria-label="Batch status">
            <div className="effects-stat">
              <span className="effects-stat-label">Batch</span>
	              <span className="effects-stat-value">{backgroundStats.itemCount}/{MAX_FILES}</span>
            </div>
            <div className="effects-stat">
              <span className="effects-stat-label">Processed</span>
	              <span className="effects-stat-value">{backgroundStats.processedCount}</span>
            </div>
            <div className="effects-stat">
              <span className="effects-stat-label">Output</span>
	              <span className="effects-stat-value">{formatBytes(backgroundStats.totalOutputBytes)}</span>
            </div>
          </div>
        </section>

        <div
          className={`effects-drop${isDragging ? ' dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          {previewItem ? (
            <div className="effects-preview-state">
              <div className="effects-preview-frame">
                {previewBusy && !previewUrl ? (
                  <Loader2 className="effects-drop-icon" aria-hidden="true" />
                ) : previewUrl ? (
                  <img src={previewUrl} alt={selectedEffect.alt} />
                ) : (
                  <p className="effects-drop-copy">Preview unavailable for this image.</p>
                )}
              </div>
              <div className="effects-preview-caption">
                <span>{previewItem.file.name}</span>
                <span>{previewBusy ? 'Rendering preview' : `Live ${selectedEffect.label} preview`}</span>
              </div>
              <div className="effects-effect-nav" aria-label="Effect picker">
                <button className="effects-arrow" type="button" onClick={() => moveEffect(-1)} disabled={activeCount > 0} aria-label="Previous effect">
                  <ChevronLeft size={18} aria-hidden="true" />
                </button>
                <div className="effects-selected" aria-live="polite">
                  <div className="effects-selected-name">{selectedEffect.label}</div>
                  <div className="effects-selected-count">{selectedEffectIndex + 1}/{EFFECTS.length}</div>
                </div>
                <button className="effects-arrow" type="button" onClick={() => moveEffect(1)} disabled={activeCount > 0} aria-label="Next effect">
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="effects-actions">
                <button className="effects-button" type="button" onClick={() => fileInputRef.current?.click()}>
                  <FileImage size={16} aria-hidden="true" />
                  Add images
                </button>
                <button
                  aria-label="Random effect"
                  className="effects-button effects-dice-button"
                  disabled={activeCount > 0}
                  onClick={chooseRandomEffect}
                  title="Random effect"
                  type="button"
                >
                  <Dice6 size={16} aria-hidden="true" />
                </button>
	                <button className="effects-button" type="button" onClick={clearAll}>
	                  <Trash2 size={16} aria-hidden="true" />
	                  Clear
	                </button>
		                <button className="effects-button primary effects-apply-button" type="button" onClick={applyAndOpenExport} disabled={!items.length || activeCount > 0}>
		                  Apply effect
		                </button>
	              </div>
            </div>
          ) : (
            <div className="effects-upload-state">
              <Upload className="effects-drop-icon" aria-hidden="true" />
              <p className="effects-drop-title">Drop images here</p>
              <p className="effects-drop-copy">JPG, PNG, WebP, GIF, BMP, and AVIF. Up to {MAX_FILES} images, {formatBytes(MAX_FILE_SIZE)} each.</p>
              <div className="effects-actions">
                <button className="effects-button" type="button" onClick={() => fileInputRef.current?.click()}>
                  <FileImage size={16} aria-hidden="true" />
                  Select images
                </button>
                <button className="effects-button" type="button" onClick={() => folderInputRef.current?.click()}>
                  <FileArchive size={16} aria-hidden="true" />
                  Select folder
                </button>
              </div>
              {batchError && <div className="effects-alert" role="status">{batchError}</div>}
            </div>
          )}
          <input
            ref={fileInputRef}
            className="effects-hidden"
            type="file"
            accept={ACCEPTED_INPUT}
            multiple
            onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
          />
          <input
            ref={folderInputRef}
            className="effects-hidden"
            type="file"
            accept={ACCEPTED_INPUT}
            multiple
            onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
          />
        </div>

        <aside className="effects-panel effects-settings" aria-label="Effect settings">
          <h2 className="effects-panel-title">Effect settings</h2>

          <div className="effects-field">
            <label className="effects-label">Style</label>
            <div className="effects-style-select" ref={effectMenuRef} onKeyDown={onEffectMenuKeyDown}>
              <button
                aria-controls="effects-style-menu"
                aria-expanded={effectMenuOpen}
                aria-haspopup="listbox"
                className="effects-style-trigger"
                disabled={activeCount > 0}
                type="button"
                onClick={() => {
                  setHighlightedEffectId(selectedEffectId);
                  setEffectMenuOpen((isOpen) => !isOpen);
                }}
              >
                <span className="effects-style-summary">
                  <span className="effects-style-name">{selectedEffect.label}</span>
                  <span className="effects-style-desc">{selectedEffect.caption}</span>
                </span>
                <span className="effects-style-caret" aria-hidden="true">
                  <ChevronDown size={18} />
                </span>
              </button>

              {effectMenuOpen && (
                <div className="effects-style-menu" id="effects-style-menu" role="listbox" aria-label="Effect presets" tabIndex={-1}>
                  {EFFECTS.map((effect) => {
                    const isSelected = selectedEffectId === effect.id;
                    const isHighlighted = highlightedEffectId === effect.id;
                    return (
                      <button
                        aria-selected={isSelected}
                        className={`effects-style-option${isSelected ? ' active' : ''}${isHighlighted ? ' highlighted' : ''}`}
                        key={effect.id}
                        role="option"
                        type="button"
                        onClick={() => selectEffectFromMenu(effect.id)}
                        onMouseEnter={() => setHighlightedEffectId(effect.id)}
                      >
                        <span>
                          <span className="effects-style-option-title">{effect.label}</span>
                          <span className="effects-style-option-caption">{effect.caption}</span>
                        </span>
                        {isSelected && <Check size={14} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="effects-field">
            <label className="effects-label">Save as</label>
            <div className="effects-format-grid">
              {OUTPUT_FORMATS.map((item) => (
                <button
                  className={`effects-format-button${format === item.value ? ' active' : ''}`}
                  key={item.value}
                  type="button"
                  onClick={() => chooseFormat(item.value)}
                  disabled={activeCount > 0}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <p className="effects-note">
            Up to {MAX_FILES} images, {formatBytes(MAX_FILE_SIZE)} each. Large images are resized to {MAX_RENDER_DIMENSION}px while processing.
          </p>
        </aside>

        <aside className="effects-panel effects-batch" aria-label="Batch processing">
          <h2 className="effects-panel-title">Batch</h2>
          <div className="effects-actions effects-batch-actions">
	            <button className="effects-button primary" type="button" onClick={processAll} disabled={!items.length || activeCount > 0}>
	              Apply effect
	            </button>
            <button className="effects-button" type="button" onClick={downloadZip} disabled={!processedCount || zipBusy}>
              {zipBusy ? <Loader2 size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
              Download zip
            </button>
            <button className="effects-button" type="button" onClick={clearAll} disabled={!items.length}>
              <Trash2 size={16} aria-hidden="true" />
              Clear
            </button>
          </div>

          <div className="effects-queue">
            {items.length ? items.map((item) => (
              <div className="effects-file" key={item.id}>
                {item.status === 'processing' ? (
                  <Loader2 size={16} aria-hidden="true" />
                ) : item.status === 'done' ? (
                  <Check size={16} aria-hidden="true" />
                ) : item.status === 'error' ? (
                  <X size={16} aria-hidden="true" />
                ) : (
                  <FileImage size={16} aria-hidden="true" />
                )}
                <div>
                  <div className="effects-file-name">{item.file.name}</div>
                  <div className="effects-file-meta">{item.progress}</div>
                  {item.error && <div className="effects-file-error">{item.error}</div>}
                </div>
                <div className="effects-file-actions">
                  {item.outputUrl && (
                    <a className="effects-icon-button" href={item.outputUrl} download={item.outputName} aria-label={`Download ${item.outputName}`}>
                      <Download size={15} aria-hidden="true" />
                    </a>
                  )}
                  <button className="effects-icon-button" type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="effects-empty">No files selected.</div>
            )}
          </div>
	        </aside>
	      </div>

	      <div
	        aria-hidden={!exportOpen}
	        className={`effects-export-overlay${exportOpen ? ' open' : ''}`}
	        onClick={closeExport}
	      >
	        <aside
	          aria-label="Export processed images"
	          aria-modal="true"
	          className="effects-export-drawer"
	          onClick={(event) => event.stopPropagation()}
	          role="dialog"
	        >
	          <button className="effects-export-close" type="button" onClick={closeExport} aria-label="Close export panel">
	            <X size={24} aria-hidden="true" />
	          </button>

	          <section className="effects-export-card" aria-label="Output settings">
	            <div className="effects-field">
	              <label className="effects-label">Save as</label>
	              <div className="effects-format-grid">
	                {OUTPUT_FORMATS.map((item) => (
	                  <button
	                    className={`effects-format-button${format === item.value ? ' active' : ''}`}
	                    key={item.value}
	                    type="button"
	                    onClick={() => chooseFormat(item.value)}
	                    disabled={activeCount > 0}
	                  >
	                    {item.label}
	                  </button>
	                ))}
	              </div>
	            </div>

	            <p className="effects-note">
	              Up to {MAX_FILES} images, {formatBytes(MAX_FILE_SIZE)} each. Large images are resized to {MAX_RENDER_DIMENSION}px while processing.
	            </p>
	          </section>

	          <section className="effects-export-card" aria-label="Batch downloads">
	            <h2 className="effects-panel-title">Batch</h2>
	            <div className="effects-queue">
	              {items.length ? items.map((item) => (
	                <div className="effects-file" key={item.id}>
	                  {item.status === 'processing' ? (
	                    <Loader2 size={16} aria-hidden="true" />
	                  ) : item.status === 'done' ? (
	                    <Check size={16} aria-hidden="true" />
	                  ) : item.status === 'error' ? (
	                    <X size={16} aria-hidden="true" />
	                  ) : (
	                    <FileImage size={16} aria-hidden="true" />
	                  )}
	                  <div>
	                    <div className="effects-file-name">{item.file.name}</div>
	                    <div className="effects-file-meta">{item.progress}</div>
	                    {item.error && <div className="effects-file-error">{item.error}</div>}
	                  </div>
	                  <div className="effects-file-actions">
	                    {item.outputUrl && (
	                      <a className="effects-icon-button" href={item.outputUrl} download={item.outputName} aria-label={`Download ${item.outputName}`}>
	                        <Download size={15} aria-hidden="true" />
	                      </a>
	                    )}
	                    <button className="effects-icon-button" type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`}>
	                      <Trash2 size={15} aria-hidden="true" />
	                    </button>
	                  </div>
	                </div>
	              )) : (
	                <div className="effects-empty">No files selected.</div>
	              )}
	            </div>
	            <div className="effects-actions effects-export-actions">
	              <button className="effects-button" type="button" onClick={downloadZip} disabled={processedCount < 2 || zipBusy || activeCount > 0}>
	                {zipBusy ? <Loader2 size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
	                Download zip
	              </button>
	              <button className="effects-button" type="button" onClick={clearAll} disabled={!items.length || activeCount > 0}>
	                <Trash2 size={16} aria-hidden="true" />
	                Clear
	              </button>
	            </div>
	          </section>
	        </aside>
	      </div>
	    </div>
	  );
	}
