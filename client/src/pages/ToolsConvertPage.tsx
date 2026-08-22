import { type CSSProperties, type DragEvent, useEffect, useMemo, useRef, useState } from 'react';
import heic2any from 'heic2any';
import JSZip from 'jszip';
import { Check, Download, FileArchive, FileImage, Loader2, Trash2, Upload, X } from 'lucide-react';
import { HellaRichSEO } from '../components/HellaRichSEO';

const MAX_FILES = 100;
const ACCEPTED_INPUT = [
  'image/heic',
  'image/heif',
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
  { label: 'AVIF', value: 'avif', mime: 'image/avif', ext: 'avif', lossy: true },
] as const;

type OutputFormat = (typeof OUTPUT_FORMATS)[number]['value'];
type ConvertStatus = 'ready' | 'converting' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  status: ConvertStatus;
  progress: string;
  error?: string;
  outputName?: string;
  outputBlob?: Blob;
  outputUrl?: string;
}

interface ConvertOptions {
  format: OutputFormat;
  quality: number;
  maxDimension: number;
  flattenJpg: boolean;
}

const EXPLOSION_PIXELS = [
  { x: '-28vw', y: '-20vh', size: 14, delay: 0, color: '#f04f49' },
  { x: '-18vw', y: '-10vh', size: 22, delay: 18, color: '#ff7a35' },
  { x: '-9vw', y: '-23vh', size: 12, delay: 34, color: '#ffb447' },
  { x: '-4vw', y: '-13vh', size: 28, delay: 0, color: '#f5f1e8' },
  { x: '7vw', y: '-22vh', size: 18, delay: 24, color: '#f04f49' },
  { x: '18vw', y: '-12vh', size: 22, delay: 10, color: '#ff7a35' },
  { x: '30vw', y: '-20vh', size: 12, delay: 42, color: '#f5f1e8' },
  { x: '-32vw', y: '2vh', size: 12, delay: 58, color: '#ffb447' },
  { x: '-20vw', y: '11vh', size: 24, delay: 16, color: '#f04f49' },
  { x: '-8vw', y: '22vh', size: 16, delay: 40, color: '#ff7a35' },
  { x: '0vw', y: '13vh', size: 30, delay: 8, color: '#f5f1e8' },
  { x: '10vw', y: '24vh', size: 14, delay: 50, color: '#ffb447' },
  { x: '20vw', y: '10vh', size: 24, delay: 20, color: '#f04f49' },
  { x: '34vw', y: '1vh', size: 12, delay: 66, color: '#ff7a35' },
  { x: '-44vw', y: '-30vh', size: 7, delay: 86, color: '#f04f49' },
  { x: '-38vw', y: '28vh', size: 8, delay: 96, color: '#ffb447' },
  { x: '-2vw', y: '-42vh', size: 8, delay: 76, color: '#f5f1e8' },
  { x: '40vw', y: '30vh', size: 7, delay: 92, color: '#f04f49' },
  { x: '46vw', y: '-32vh', size: 8, delay: 82, color: '#ffb447' },
] as const;

function isHeicLike(file: File) {
  const name = file.name.toLowerCase();
  return file.type === 'image/heic' || file.type === 'image/heif' || name.endsWith('.heic') || name.endsWith('.heif');
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cleanBaseName(name: string) {
  const trimmed = name.replace(/\.[^.]+$/, '').replace(/[^\w.-]+/g, '-').replace(/-+/g, '-');
  return trimmed || 'converted-image';
}

function getOutputConfig(format: OutputFormat) {
  return OUTPUT_FORMATS.find((item) => item.value === format) ?? OUTPUT_FORMATS[0];
}

async function blobToImageBitmap(blob: Blob) {
  if ('createImageBitmap' in window) {
    return createImageBitmap(blob, { imageOrientation: 'from-image' });
  }

  const url = URL.createObjectURL(blob);
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

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality: number) {
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

async function convertImage(file: File, options: ConvertOptions) {
  const target = getOutputConfig(options.format);
  const quality = Math.min(1, Math.max(0.1, options.quality / 100));
  let sourceBlob: Blob = file;

  if (isHeicLike(file)) {
    const heicOutput = await heic2any({
      blob: file,
      toType: target.value === 'jpg' ? 'image/jpeg' : 'image/png',
      quality,
    });
    sourceBlob = Array.isArray(heicOutput) ? heicOutput[0] : heicOutput;
  }

  const bitmap = await blobToImageBitmap(sourceBlob);
  const maxDimension = Math.max(0, options.maxDimension);
  const scale = maxDimension > 0 ? Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height)) : 1;
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d', { alpha: target.value !== 'jpg' || !options.flattenJpg });
  if (!context) throw new Error('Canvas is not available in this browser.');

  if (target.value === 'jpg' && options.flattenJpg) {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await canvasToBlob(canvas, target.mime, target.lossy ? quality : 1);
  return {
    blob,
    name: `${cleanBaseName(file.name)}.${target.ext}`,
  };
}

export default function ToolsConvertPage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [format, setFormat] = useState<OutputFormat>('png');
  const [quality, setQuality] = useState(92);
  const [maxDimension, setMaxDimension] = useState(0);
  const [flattenJpg, setFlattenJpg] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [celebrationKey, setCelebrationKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const outputUrlsRef = useRef<Set<string>>(new Set());

  const outputConfig = useMemo(() => getOutputConfig(format), [format]);
  const convertedCount = items.filter((item) => item.status === 'done').length;
  const activeCount = items.filter((item) => item.status === 'converting').length;
  const totalOutputBytes = items.reduce((sum, item) => sum + (item.outputBlob?.size ?? 0), 0);

  useEffect(() => {
    return () => {
      outputUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      outputUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
    folderInputRef.current?.setAttribute('directory', '');
  }, []);

  useEffect(() => {
    if (!celebrationKey) return;
    const timeout = window.setTimeout(() => setCelebrationKey(0), 1180);
    return () => window.clearTimeout(timeout);
  }, [celebrationKey]);

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith('image/'));
      if (files.length) addFiles(files);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const addFiles = (incoming: File[]) => {
    setBatchError('');
    const imageFiles = incoming.filter((file) => file.type.startsWith('image/') || /\.(heic|heif|avif|bmp|gif|jpe?g|png|webp)$/i.test(file.name));

    setItems((current) => {
      const remaining = MAX_FILES - current.length;
      const accepted = imageFiles.slice(0, Math.max(0, remaining));
      const next = accepted.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        status: 'ready' as const,
        progress: 'Ready',
      }));

      if (imageFiles.length > remaining) {
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
      if (patch.outputUrl) {
        outputUrlsRef.current.add(patch.outputUrl);
      }
      return { ...item, ...patch };
    }));
  };

  const convertAll = async () => {
    setBatchError('');
    const options: ConvertOptions = { format, quality, maxDimension, flattenJpg };
    const readyItems = items.filter((item) => item.status === 'ready' || item.status === 'error');
    let completed = 0;

    for (const item of readyItems) {
      updateItem(item.id, { status: 'converting', progress: 'Converting', error: undefined });
      try {
        const result = await convertImage(item.file, options);
        completed += 1;
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
          error: error instanceof Error ? error.message : 'This file could not be converted in the browser.',
        });
      }
    }

    if (completed > 0) {
      setCelebrationKey((current) => current + 1);
    }
  };

  const clearAll = () => {
    items.forEach((item) => {
      if (item.outputUrl) {
        URL.revokeObjectURL(item.outputUrl);
        outputUrlsRef.current.delete(item.outputUrl);
      }
    });
    setItems([]);
    setBatchError('');
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
    const converted = items.filter((item) => item.outputBlob && item.outputName);
    if (!converted.length) return;

    setZipBusy(true);
    try {
      const zip = new JSZip();
      const names = new Map<string, number>();
      converted.forEach((item) => {
        const originalName = item.outputName!;
        const seen = names.get(originalName) ?? 0;
        names.set(originalName, seen + 1);
        const safeName = seen === 0
          ? originalName
          : originalName.replace(/(\.[^.]+)$/, `-${seen + 1}$1`);
        zip.file(safeName, item.outputBlob!);
      });
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `hella-rich-converted-${outputConfig.ext}.zip`;
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
    <div className="convert-page">
      <HellaRichSEO
        title="HELLA CONVERT"
        description="Free image converter. Your files stay on your device. Convert HEIC, JPG, PNG, WebP, GIF, BMP, and AVIF files with no account, ads, or payment step."
        keywords="free image converter, HEIC to PNG, HEIC to JPG, image compression, browser converter, hella.rich tools"
      />

      <style>{`
        @font-face {
          font-family: "Abismo Sangriento";
          src: url("${import.meta.env.BASE_URL}fonts/AbismoSangriento-Regular.otf") format("opentype");
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
        .convert-page {
          min-height: 100vh;
          background: #0a0908;
          color: #f5f1e8;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          padding:
            clamp(88px, 8.8vw, 118px)
            clamp(24px, 4.1vw, 52px)
            clamp(54px, 6vw, 78px);
        }
        .convert-shell {
          max-width: 1186px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.04fr) minmax(clamp(330px, 34vw, 452px), 0.78fr);
          grid-template-areas:
            "intro settings"
            "drop batch";
          grid-template-rows: auto clamp(520px, 41vw, 586px);
          column-gap: clamp(24px, 2.8vw, 34px);
          row-gap: clamp(36px, 3.9vw, 38px);
          align-items: stretch;
        }
        .convert-intro,
        .convert-settings,
        .convert-drop,
        .convert-batch {
          min-width: 0;
        }
        .convert-intro {
          grid-area: intro;
          display: flex;
          flex-direction: column;
        }
        .convert-kicker,
        .convert-stat-label,
        .convert-label,
        .convert-pill,
        .convert-file-meta,
        .convert-button,
        .convert-format-button,
        .convert-check-label {
          font-family: "DM Mono", "Space Mono", monospace;
          text-transform: uppercase;
        }
        .convert-kicker {
          margin: 0 0 clamp(22px, 3.1vw, 36px);
          color: rgba(245,241,232,0.44);
          font-size: clamp(8px, 0.74vw, 10px);
          letter-spacing: 0.18em;
        }
        .convert-title {
          margin: 0;
          max-width: 100%;
          color: #f06459;
          font-family: "Abismo Sangriento", "DM Mono", monospace;
          font-size: clamp(54px, 7.6vw, 116px);
          font-weight: 400;
          line-height: 0.82;
          letter-spacing: 0;
          text-transform: uppercase;
          text-wrap: balance;
        }
        .convert-copy {
          max-width: clamp(500px, 52vw, 646px);
          margin: clamp(28px, 4.1vw, 50px) 0 0;
          color: rgba(245,241,232,0.82);
          font-size: clamp(18px, 1.75vw, 20px);
          line-height: 1.45;
          text-wrap: pretty;
        }
        .convert-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border: 1px solid rgba(245,241,232,0.16);
          margin: auto 0 0;
        }
        .convert-stat {
          min-height: clamp(76px, 6.6vw, 80px);
          padding: clamp(14px, 1.3vw, 17px);
          border-right: 1px solid rgba(245,241,232,0.16);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .convert-stat:last-child { border-right: 0; }
        .convert-stat-label {
          color: rgba(245,241,232,0.42);
          font-size: clamp(8px, 0.65vw, 9px);
          letter-spacing: 0.17em;
        }
        .convert-stat-value {
          color: #f04f49;
          font-size: clamp(28px, 3vw, 34px);
          line-height: 1;
        }
        .convert-drop {
          grid-area: drop;
          border: 1px dashed rgba(245,241,232,0.34);
          background: rgba(245,241,232,0.035);
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          padding: clamp(28px, 4.5vw, 56px);
          transition: border-color 0.16s ease, background 0.16s ease, transform 0.16s ease;
        }
        .convert-drop.dragging {
          border-color: #f04f49;
          background: rgba(240,79,73,0.11);
          transform: translateY(-2px);
        }
        .convert-drop-icon {
          width: clamp(38px, 4vw, 48px);
          height: clamp(38px, 4vw, 48px);
          color: #f04f49;
          margin-bottom: clamp(22px, 2.8vw, 31px);
          stroke-width: 1.8;
        }
        .convert-drop-title {
          margin: 0;
          font-family: "DM Mono", monospace;
          font-size: clamp(19px, 2vw, 24px);
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }
        .convert-drop-copy {
          margin: clamp(16px, 1.7vw, 18px) 0 0;
          color: rgba(245,241,232,0.62);
          font-size: clamp(13px, 1.35vw, 15px);
          line-height: 1.5;
        }
        .convert-actions {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: clamp(9px, 1vw, 11px);
          margin-top: clamp(22px, 2.6vw, 28px);
        }
        .convert-button {
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
        .convert-button:hover:not(:disabled),
        .convert-format-button:hover {
          border-color: rgba(245,241,232,0.4);
          background: rgba(245,241,232,0.12);
        }
        .convert-button.primary {
          background: #f04f49;
          border-color: #f04f49;
          color: #0a0908;
        }
        .convert-button.danger {
          color: rgba(245,241,232,0.68);
        }
        .convert-button:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }
        .convert-panel {
          border: 1px solid rgba(245,241,232,0.18);
          background: rgba(245,241,232,0.045);
          box-sizing: border-box;
          padding: clamp(26px, 2.6vw, 31px) clamp(24px, 2.3vw, 28px);
        }
        .convert-settings {
          grid-area: settings;
        }
        .convert-batch {
          grid-area: batch;
          min-height: 0;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .convert-panel-title {
          margin: 0 0 clamp(20px, 2.1vw, 25px);
          font-family: "DM Mono", monospace;
          font-size: clamp(9px, 0.78vw, 11px);
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(245,241,232,0.7);
        }
        .convert-field { margin-top: clamp(20px, 2vw, 24px); }
        .convert-field:first-of-type { margin-top: 0; }
        .convert-label {
          display: block;
          margin-bottom: clamp(8px, 1vw, 11px);
          font-size: clamp(8px, 0.63vw, 9px);
          letter-spacing: 0.16em;
          color: rgba(245,241,232,0.48);
        }
        .convert-format-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: clamp(8px, 0.9vw, 10px);
        }
        .convert-format-button {
          height: clamp(42px, 4vw, 44px);
          border: 1px solid rgba(245,241,232,0.16);
          background: rgba(0,0,0,0.18);
          color: rgba(245,241,232,0.66);
          border-radius: 3px;
          font-size: clamp(8px, 0.72vw, 10px);
          letter-spacing: 0.12em;
          cursor: pointer;
        }
        .convert-format-button.active {
          background: #f5f1e8;
          color: #0a0908;
          border-color: #f5f1e8;
        }
        .convert-range-row,
        .convert-input-row {
          display: flex;
          align-items: center;
          gap: clamp(14px, 1.8vw, 22px);
        }
        .convert-range-row input[type="range"] {
          width: 100%;
          accent-color: #f04f49;
        }
        .convert-number {
          width: clamp(86px, 8vw, 96px);
          height: clamp(38px, 4vw, 42px);
          border: 1px solid rgba(245,241,232,0.16);
          background: rgba(0,0,0,0.22);
          color: #f5f1e8;
          border-radius: 3px;
          padding: 0 clamp(10px, 1.1vw, 14px);
          font-size: clamp(14px, 1.35vw, 16px);
        }
        .convert-pill {
          min-width: 68px;
          color: #f04f49;
          font-size: clamp(8px, 0.72vw, 10px);
          letter-spacing: 0.12em;
          text-align: right;
        }
        .convert-checks {
          display: grid;
          gap: 10px;
          margin-top: clamp(22px, 2vw, 26px);
        }
        .convert-check-label {
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(245,241,232,0.68);
          font-size: clamp(8px, 0.72vw, 10px);
          letter-spacing: 0.1em;
        }
        .convert-check-label input { accent-color: #f04f49; }
        .convert-queue {
          margin-top: clamp(18px, 1.8vw, 21px);
          border: 1px solid rgba(245,241,232,0.14);
          min-height: 0;
          flex: 1 1 auto;
          overflow: auto;
        }
        .convert-file {
          display: grid;
          grid-template-columns: 26px minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: clamp(12px, 1.3vw, 14px);
          border-bottom: 1px solid rgba(245,241,232,0.1);
        }
        .convert-file:last-child { border-bottom: 0; }
        .convert-file-name {
          overflow: hidden;
          color: rgba(245,241,232,0.86);
          font-size: clamp(13px, 1.25vw, 14px);
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .convert-file-meta {
          margin-top: 4px;
          color: rgba(245,241,232,0.42);
          font-size: clamp(8px, 0.7vw, 9px);
          letter-spacing: 0.08em;
        }
        .convert-file-error {
          margin-top: 6px;
          color: #ff8f88;
          font-size: clamp(11px, 1vw, 12px);
          line-height: 1.35;
        }
        .convert-file-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .convert-icon-button {
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
        .convert-icon-button:hover { color: #f5f1e8; border-color: rgba(245,241,232,0.36); }
        .convert-empty {
          min-height: clamp(68px, 7vw, 70px);
          padding: clamp(20px, 2vw, 24px);
          color: rgba(245,241,232,0.42);
          font-size: clamp(13px, 1.25vw, 14px);
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .convert-alert {
          margin-top: 14px;
          color: #ffb3ad;
          font-size: clamp(12px, 1.1vw, 13px);
          line-height: 1.4;
        }
        .convert-note {
          margin: clamp(12px, 1.35vw, 15px) 0 0;
          color: rgba(245,241,232,0.42);
          font-size: clamp(11px, 1.08vw, 12px);
          line-height: 1.45;
        }
        .convert-batch-actions {
          justify-content: flex-start;
          margin-top: 0;
        }
        .convert-hidden { display: none; }
        .convert-celebration {
          position: fixed;
          inset: 0;
          z-index: 2147483000;
          pointer-events: none;
          overflow: hidden;
          contain: layout paint style;
          animation: convert-flash 1120ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .convert-celebration-ring,
        .convert-celebration-ring::before,
        .convert-celebration-ring::after {
          position: absolute;
          left: 50%;
          top: 50%;
          width: clamp(64px, 12vw, 150px);
          height: clamp(64px, 12vw, 150px);
          border: clamp(8px, 1.2vw, 14px) solid rgba(240,79,73,0.74);
          transform: translate3d(-50%, -50%, 0);
          image-rendering: pixelated;
          opacity: 0;
          will-change: transform, opacity;
          animation: convert-ring-blast 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .convert-celebration-ring::before,
        .convert-celebration-ring::after {
          content: "";
        }
        .convert-celebration-ring::before {
          width: 62%;
          height: 62%;
          border-color: rgba(255,180,71,0.76);
          animation-delay: 42ms;
        }
        .convert-celebration-ring::after {
          width: 36%;
          height: 36%;
          border-color: rgba(245,241,232,0.84);
          animation-delay: 84ms;
        }
        .convert-celebration-core {
          position: absolute;
          left: 50%;
          top: 50%;
          width: clamp(24px, 4vw, 48px);
          height: clamp(24px, 4vw, 48px);
          background: #f04f49;
          box-shadow:
            0 0 0 clamp(16px, 2vw, 26px) rgba(255,122,53,0.34),
            0 0 58px rgba(240,79,73,0.68);
          transform: translate3d(-50%, -50%, 0);
          image-rendering: pixelated;
          will-change: transform, opacity;
          animation: convert-core-burst 820ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .convert-celebration-pixel {
          position: absolute;
          left: 50%;
          top: 50%;
          width: var(--pixel-size);
          height: var(--pixel-size);
          background: var(--pixel-color);
          transform: translate3d(-50%, -50%, 0);
          image-rendering: pixelated;
          will-change: transform, opacity;
          animation: convert-pixel-burst 980ms cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--pixel-delay);
        }
        @keyframes convert-flash {
          0% { background: rgba(240,79,73,0.00); }
          10% { background: rgba(245,241,232,0.08); }
          22% { background: rgba(240,79,73,0.09); }
          45% { background: rgba(255,122,53,0.035); }
          100% { background: rgba(240,79,73,0.00); }
        }
        @keyframes convert-ring-blast {
          0% {
            opacity: 0;
            transform: translate3d(-50%, -50%, 0) scale(0.12) rotate(0deg);
          }
          12% {
            opacity: 1;
            transform: translate3d(-50%, -50%, 0) scale(0.68) rotate(0deg);
          }
          48% {
            opacity: 0.82;
            transform: translate3d(-50%, -50%, 0) scale(1.8) rotate(6deg);
          }
          100% {
            opacity: 0;
            transform: translate3d(-50%, -50%, 0) scale(3.4) rotate(12deg);
          }
        }
        @keyframes convert-core-burst {
          0% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(0.4); }
          10% { opacity: 1; transform: translate3d(-50%, -50%, 0) scale(2.6); }
          34% { opacity: 0.94; transform: translate3d(-50%, -50%, 0) scale(4.2); }
          100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(7.2); }
        }
        @keyframes convert-pixel-burst {
          0% {
            opacity: 0;
            transform: translate3d(-50%, -50%, 0) scale(1);
          }
          10% {
            opacity: 1;
            transform: translate3d(-50%, -50%, 0) scale(1.8);
          }
          42% {
            opacity: 1;
            transform: translate3d(-50%, -50%, 0) scale(1.12);
          }
          100% {
            opacity: 0;
            transform: translate3d(calc(-50% + var(--pixel-x)), calc(-50% + var(--pixel-y)), 0) scale(0.72);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .convert-celebration {
            animation: convert-flash 360ms steps(1, end) both;
          }
          .convert-celebration-ring,
          .convert-celebration-core,
          .convert-celebration-pixel {
            animation: none;
            opacity: 0;
          }
        }
        @media (max-width: 960px) {
          .convert-page {
            padding:
              clamp(78px, 14vw, 104px)
              clamp(16px, 5vw, 34px)
              clamp(34px, 8vw, 56px);
          }
          .convert-shell {
            grid-template-columns: 1fr;
            grid-template-areas:
              "intro"
              "settings"
              "drop"
              "batch";
            grid-template-rows:
              auto
              auto
              clamp(420px, 78vw, 586px)
              clamp(420px, 78vw, 586px);
            align-items: stretch;
          }
          .convert-title {
            font-size: clamp(48px, 17vw, 104px);
          }
          .convert-copy {
            max-width: 100%;
            margin-top: clamp(18px, 5vw, 34px);
          }
          .convert-stats {
            margin-top: clamp(28px, 8vw, 48px);
          }
        }
        @media (max-width: 680px) {
          .convert-stats { grid-template-columns: 1fr; }
          .convert-stat { border-right: 0; border-bottom: 1px solid rgba(245,241,232,0.14); }
          .convert-stat:last-child { border-bottom: 0; }
          .convert-title {
            font-size: clamp(44px, 21vw, 82px);
          }
        }
        @media (max-width: 560px) {
          .convert-format-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .convert-file { grid-template-columns: 22px minmax(0, 1fr); }
          .convert-file-actions { grid-column: 2; justify-content: flex-start; }
          .convert-actions { justify-content: stretch; }
          .convert-button { flex: 1 1 100%; }
          .convert-batch-actions {
            justify-content: stretch;
          }
        }
      `}</style>

      {celebrationKey > 0 && (
        <div className="convert-celebration" key={celebrationKey} aria-hidden="true">
          <span className="convert-celebration-ring" />
          <span className="convert-celebration-core" />
          {EXPLOSION_PIXELS.map((pixel, index) => (
            <span
              className="convert-celebration-pixel"
              key={`${celebrationKey}-${index}`}
              style={{
                '--pixel-x': pixel.x,
                '--pixel-y': pixel.y,
                '--pixel-size': `${pixel.size}px`,
                '--pixel-delay': `${pixel.delay}ms`,
                '--pixel-color': pixel.color,
              } as CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="convert-shell">
        <section className="convert-intro" aria-labelledby="convert-title">
          <p className="convert-kicker">hella.rich / tools / convert</p>
          <h1 id="convert-title" className="convert-title">HELLA CONVERT</h1>
          <p className="convert-copy">
            Convert image files in your browser. Your files stay on your device. Free, no account, no payment step.
          </p>

          <div className="convert-stats" aria-label="Batch status">
            <div className="convert-stat">
              <span className="convert-stat-label">Batch</span>
              <span className="convert-stat-value">{items.length}/{MAX_FILES}</span>
            </div>
            <div className="convert-stat">
              <span className="convert-stat-label">Converted</span>
              <span className="convert-stat-value">{convertedCount}</span>
            </div>
            <div className="convert-stat">
              <span className="convert-stat-label">Output</span>
              <span className="convert-stat-value">{formatBytes(totalOutputBytes)}</span>
            </div>
          </div>
        </section>

        <div
          className={`convert-drop${isDragging ? ' dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <Upload className="convert-drop-icon" aria-hidden="true" />
          <p className="convert-drop-title">Drop images here</p>
          <p className="convert-drop-copy">HEIC, HEIF, JPG, PNG, WebP, GIF, BMP, and AVIF. Paste also works.</p>
          <div className="convert-actions">
            <button className="convert-button" type="button" onClick={() => fileInputRef.current?.click()}>
              <FileImage size={16} aria-hidden="true" />
              Select images
            </button>
            <button className="convert-button" type="button" onClick={() => folderInputRef.current?.click()}>
              <FileArchive size={16} aria-hidden="true" />
              Select folder
            </button>
          </div>
          {batchError && <div className="convert-alert" role="status">{batchError}</div>}
          <input
            ref={fileInputRef}
            className="convert-hidden"
            type="file"
            accept={ACCEPTED_INPUT}
            multiple
            onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
          />
          <input
            ref={folderInputRef}
            className="convert-hidden"
            type="file"
            accept={ACCEPTED_INPUT}
            multiple
            onChange={(event) => addFiles(Array.from(event.currentTarget.files ?? []))}
          />
        </div>

        <aside className="convert-panel convert-settings" aria-label="Conversion settings">
            <h2 className="convert-panel-title">Output settings</h2>

            <div className="convert-field">
              <label className="convert-label">Convert to</label>
              <div className="convert-format-grid">
                {OUTPUT_FORMATS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`convert-format-button${format === item.value ? ' active' : ''}`}
                    onClick={() => setFormat(item.value)}
                    aria-pressed={format === item.value}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="convert-field">
              <label className="convert-label" htmlFor="convert-quality">Quality</label>
              <div className="convert-range-row">
                <input
                  id="convert-quality"
                  type="range"
                  min="50"
                  max="100"
                  step="1"
                  value={quality}
                  disabled={!outputConfig.lossy}
                  onChange={(event) => setQuality(Number(event.target.value))}
                />
                <span className="convert-pill">{outputConfig.lossy ? `${quality}%` : 'Lossless'}</span>
              </div>
            </div>

            <div className="convert-field">
              <label className="convert-label" htmlFor="convert-resize">Max dimension</label>
              <div className="convert-input-row">
                <input
                  id="convert-resize"
                  className="convert-number"
                  type="number"
                  min="0"
                  step="100"
                  value={maxDimension}
                  onChange={(event) => setMaxDimension(Number(event.target.value))}
                />
                <span className="convert-pill">{maxDimension > 0 ? 'Pixels' : 'Original'}</span>
              </div>
            </div>

            <div className="convert-checks">
              <label className="convert-check-label">
                <input type="checkbox" checked={flattenJpg} onChange={(event) => setFlattenJpg(event.target.checked)} disabled={format !== 'jpg'} />
                White background for JPG
              </label>
            </div>
            <p className="convert-note">
              Re-encoding through canvas strips metadata by default. HEIC/HEIF decoding may take longer on large iPhone batches.
            </p>
        </aside>

        <aside className="convert-panel convert-batch" aria-label="Batch">
            <h2 className="convert-panel-title">Batch</h2>
            <div className="convert-actions convert-batch-actions">
              <button className="convert-button primary" type="button" disabled={!items.length || activeCount > 0} onClick={convertAll}>
                {activeCount > 0 ? <Loader2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}
                Convert
              </button>
              <button className="convert-button" type="button" disabled={!convertedCount || zipBusy} onClick={downloadZip}>
                {zipBusy ? <Loader2 size={16} aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
                Download ZIP
              </button>
              <button className="convert-button danger" type="button" disabled={!items.length} onClick={clearAll}>
                <Trash2 size={16} aria-hidden="true" />
                Clear
              </button>
            </div>

            <div className="convert-queue" aria-live="polite">
              {!items.length ? (
                <div className="convert-empty">No files selected.</div>
              ) : (
                items.map((item) => (
                  <div className="convert-file" key={item.id}>
                    {item.status === 'converting' ? (
                      <Loader2 size={20} aria-hidden="true" />
                    ) : item.status === 'done' ? (
                      <Check size={20} aria-hidden="true" />
                    ) : item.status === 'error' ? (
                      <X size={20} aria-hidden="true" />
                    ) : (
                      <FileImage size={20} aria-hidden="true" />
                    )}
                    <div>
                      <div className="convert-file-name">{item.file.name}</div>
                      <div className="convert-file-meta">{formatBytes(item.file.size)} · {item.progress}</div>
                      {item.error && <div className="convert-file-error">{item.error}</div>}
                    </div>
                    <div className="convert-file-actions">
                      {item.outputUrl && item.outputName && (
                        <a className="convert-icon-button" href={item.outputUrl} download={item.outputName} aria-label={`Download ${item.outputName}`}>
                          <Download size={16} aria-hidden="true" />
                        </a>
                      )}
                      <button className="convert-icon-button" type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.file.name}`}>
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
        </aside>
      </div>
    </div>
  );
}
