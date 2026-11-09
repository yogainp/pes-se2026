import { toPng, toJpeg, toBlob } from 'html-to-image';

export interface ExportImageOptions {
  element: HTMLElement;
  filename?: string;
  format?: 'png' | 'jpeg';
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
}

export interface CopyImageOptions {
  element: HTMLElement;
  pixelRatio?: number;
  backgroundColor?: string;
}

export interface GenerateDataUrlOptions {
  element: HTMLElement;
  format?: 'png' | 'jpeg';
  quality?: number;
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Filter function to exclude elements marked with .export-exclude
 */
const exportFilter = (node: HTMLElement) => {
  if (node.classList && node.classList.contains('export-exclude')) {
    return false;
  }
  return true;
};

/**
 * Menyiapkan elemen sebelum capture (mengaktifkan mode export)
 */
async function prepareElement(element: HTMLElement): Promise<() => void> {
  element.classList.add('is-exporting');
  // Berikan waktu jeda singkat agar browser me-render reflow CSS
  await new Promise((resolve) => setTimeout(resolve, 80));

  return () => {
    element.classList.remove('is-exporting');
  };
}

/**
 * Menghasilkan Data URL (base64) dari elemen HTML
 */
export async function generateElementDataUrl({
  element,
  format = 'png',
  quality = 0.95,
  pixelRatio = 2,
  backgroundColor = '#ffffff',
}: GenerateDataUrlOptions): Promise<string> {
  const cleanup = await prepareElement(element);

  const options = {
    backgroundColor,
    pixelRatio,
    quality,
    filter: exportFilter,
    preferredFontFormat: 'woff2' as const,
  };

  try {
    try {
      if (format === 'jpeg') {
        return await toJpeg(element, options);
      }
      return await toPng(element, options);
    } catch (err) {
      console.warn('Export dengan font eksternal gagal, mencoba fallback skipFonts: true...', err);
      if (format === 'jpeg') {
        return await toJpeg(element, { ...options, skipFonts: true });
      }
      return await toPng(element, { ...options, skipFonts: true });
    }
  } finally {
    cleanup();
  }
}

/**
 * Mengunduh elemen HTML sebagai file gambar PNG atau JPEG
 */
export async function exportElementToImage({
  element,
  filename = 'monitoring-progres',
  format = 'png',
  quality = 0.95,
  pixelRatio = 2,
  backgroundColor = '#ffffff',
}: ExportImageOptions): Promise<string> {
  const dataUrl = await generateElementDataUrl({
    element,
    format,
    quality,
    pixelRatio,
    backgroundColor,
  });

  const extension = format === 'jpeg' ? 'jpg' : 'png';
  const cleanFilename = filename.endsWith(`.${extension}`) ? filename : `${filename}.${extension}`;

  const link = document.createElement('a');
  link.download = cleanFilename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}

/**
 * Menyalin gambar elemen ke clipboard (siap di-paste ke WhatsApp Web)
 */
export async function copyElementToClipboard({
  element,
  pixelRatio = 2,
  backgroundColor = '#ffffff',
}: CopyImageOptions): Promise<boolean> {
  if (!navigator.clipboard || !window.ClipboardItem) {
    throw new Error('Clipboard API gambar tidak didukung di browser ini.');
  }

  const cleanup = await prepareElement(element);

  const options = {
    backgroundColor,
    pixelRatio,
    filter: exportFilter,
    preferredFontFormat: 'woff2' as const,
  };

  let blob: Blob | null = null;
  try {
    try {
      blob = await toBlob(element, options);
    } catch (err) {
      console.warn('toBlob gagal dengan font eksternal, fallback ke skipFonts: true...', err);
      blob = await toBlob(element, { ...options, skipFonts: true });
    }
  } finally {
    cleanup();
  }

  if (!blob) {
    throw new Error('Gagal menghasilkan file gambar untuk clipboard.');
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      'image/png': blob,
    }),
  ]);

  return true;
}
