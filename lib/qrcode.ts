/**
 * QR Code Generator
 * Produces base64 PNG data URIs for profile QR codes
 */
import QRCode from 'qrcode';

export interface QrOptions {
  /** The content to encode */
  data: string;
  /** Output size in pixels (width = height) */
  size?: number;
  /** Error correction level: L | M | Q | H */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  /** Dark module color */
  darkColor?: string;
  /** Light module color */
  lightColor?: string;
}

/**
 * Generates a QR code as a base64 data URI (PNG)
 */
export async function generateQrDataUri(opts: QrOptions): Promise<string> {
  const {
    data,
    size = 300,
    errorCorrectionLevel = 'Q',
    darkColor = '#1e293b',
    lightColor = '#ffffff',
  } = opts;

  return QRCode.toDataURL(data, {
    width: size,
    margin: 2,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}

/**
 * Generates a QR code as a raw PNG Buffer (for server-side rendering)
 */
export async function generateQrBuffer(opts: QrOptions): Promise<Buffer> {
  const {
    data,
    size = 300,
    errorCorrectionLevel = 'Q',
    darkColor = '#1e293b',
    lightColor = '#ffffff',
  } = opts;

  return QRCode.toBuffer(data, {
    width: size,
    margin: 2,
    errorCorrectionLevel,
    color: {
      dark: darkColor,
      light: lightColor,
    },
    type: 'png',
  });
}
