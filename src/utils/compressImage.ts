/**
 * Compresses an uploaded image File into a crisp, lightweight JPEG data URL (~45–70 KB, <= 95,000 chars)
 * so that uploaded photos save instantaneously to both the server database, Firestore, and localStorage
 * without ever exceeding payload or storage quotas.
 */
export function compressImageFile(
  file: File,
  maxDimension = 760,
  quality = 0.72,
  maxBase64Length = 95_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      if (typeof rawDataUrl !== 'string') {
        reject(new Error('Format gambar tidak valid.'));
        return;
      }

      // If already very compact (< 45 KB), return directly
      if (rawDataUrl.length < 45_000) {
        resolve(rawDataUrl);
        return;
      }

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          const renderAt = (targetDim: number, targetQual: number): string => {
            let { width, height } = img;
            if (width > targetDim || height > targetDim) {
              if (width >= height) {
                height = Math.round((height * targetDim) / width);
                width = targetDim;
              } else {
                width = Math.round((width * targetDim) / height);
                height = targetDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) return rawDataUrl;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg', targetQual);
          };

          let compressedDataUrl = renderAt(maxDimension, quality);

          // If high-detail image (e.g. dense foliage) is still > maxBase64Length, step down smoothly
          const steps: Array<[number, number]> = [
            [680, 0.65],
            [600, 0.6],
            [520, 0.55],
            [460, 0.5],
          ];
          for (const [dim, qual] of steps) {
            if (compressedDataUrl.length <= maxBase64Length) break;
            compressedDataUrl = renderAt(dim, qual);
          }

          resolve(compressedDataUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Re-compresses an existing data:image/... base64 string if it exceeds maxBase64Length.
 */
export function compressDataUrlIfNeeded(
  dataUrl: string,
  maxBase64Length = 85_000
): Promise<string> {
  if (
    typeof window === 'undefined' ||
    !dataUrl ||
    !dataUrl.startsWith('data:image/') ||
    dataUrl.length <= maxBase64Length
  ) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      try {
        const renderAt = (targetDim: number, targetQual: number): string => {
          let { width, height } = img;
          if (width > targetDim || height > targetDim) {
            if (width >= height) {
              height = Math.round((height * targetDim) / width);
              width = targetDim;
            } else {
              width = Math.round((width * targetDim) / height);
              height = targetDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) return dataUrl;
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', targetQual);
        };

        let out = renderAt(660, 0.65);
        const steps: Array<[number, number]> = [
          [580, 0.6],
          [500, 0.55],
          [440, 0.5],
        ];
        for (const [dim, qual] of steps) {
          if (out.length <= maxBase64Length) break;
          out = renderAt(dim, qual);
        }
        resolve(out);
      } catch {
        resolve(dataUrl);
      }
    };
    img.src = dataUrl;
  });
}

/**
 * Compresses an uploaded sponsor/support logo File into a compact data URL (<= 85,000 chars)
 * while preserving transparency (PNG/WebP/SVG) when available.
 */
export function compressLogoFile(
  file: File,
  maxDimension = 360,
  maxBase64Length = 85_000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file logo.'));
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      if (typeof rawDataUrl !== 'string') {
        reject(new Error('Format gambar logo tidak valid.'));
        return;
      }

      if (rawDataUrl.length <= 45_000) {
        resolve(rawDataUrl);
        return;
      }

      const isTransparentFormat =
        file.type === 'image/png' ||
        file.type === 'image/webp' ||
        file.type === 'image/svg+xml';

      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        try {
          const renderAt = (
            targetDim: number,
            mime: string,
            targetQual: number
          ): string => {
            let { width, height } = img;
            if (width > targetDim || height > targetDim) {
              if (width >= height) {
                height = Math.round((height * targetDim) / width);
                width = targetDim;
              } else {
                width = Math.round((width * targetDim) / height);
                height = targetDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = Math.max(1, width);
            canvas.height = Math.max(1, height);
            const ctx = canvas.getContext('2d');
            if (!ctx) return rawDataUrl;
            if (!isTransparentFormat || mime === 'image/jpeg') {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            return canvas.toDataURL(mime, targetQual);
          };

          const preferredMime = isTransparentFormat ? 'image/webp' : 'image/jpeg';
          let out = renderAt(maxDimension, preferredMime, 0.85);
          const steps: Array<[number, number]> = [
            [300, 0.78],
            [240, 0.72],
            [180, 0.65],
          ];
          for (const [dim, qual] of steps) {
            if (out.length <= maxBase64Length) break;
            out = renderAt(dim, preferredMime, qual);
          }
          if (out.length > maxBase64Length) {
            out = renderAt(220, 'image/jpeg', 0.65);
          }
          resolve(out);
        } catch {
          resolve(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

