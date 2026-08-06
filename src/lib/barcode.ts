import bwipjs from "bwip-js/node";
import QRCode from "qrcode";

/** Server-only barcode/QR rendering to inline SVG. Import only from server components. */

export async function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

export function code128Svg(text: string): string {
  return bwipjs.toSVG({
    bcid: "code128",
    text,
    scale: 3,
    height: 12,
    includetext: true,
    textxalign: "center",
    textsize: 9,
  });
}
