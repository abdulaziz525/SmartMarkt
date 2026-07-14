/**
 * ZATCA (Fatoora) Simplified Tax Invoice QR Code TLV Generator
 * 
 * Under the ZATCA Phase 1 regulations in Saudi Arabia, the QR code on a simplified tax invoice
 * must contain a Base64-encoded TLV (Tag-Length-Value) structure with the following fields:
 * - Tag 1: Seller's name
 * - Tag 2: Seller's VAT registration number
 * - Tag 3: Timestamp of the invoice (ISO 8601 format)
 * - Tag 4: Invoice total (with VAT)
 * - Tag 5: VAT total
 */

function toTLV(tag: number, value: string): Uint8Array {
  const encoder = new TextEncoder();
  const valueBytes = encoder.encode(value);
  const tlvBytes = new Uint8Array(2 + valueBytes.length);
  tlvBytes[0] = tag;
  tlvBytes[1] = valueBytes.length;
  tlvBytes.set(valueBytes, 2);
  return tlvBytes;
}

/**
 * Generates the Base64 encoded TLV string required for the ZATCA QR Code.
 */
export function generateZatcaBase64(
  sellerName: string,
  vatNumber: string,
  timestamp: string, // ISO 8601 string (e.g. 2026-07-13T03:49:43Z)
  total: number,
  vatTotal: number
): string {
  const t1 = toTLV(1, sellerName);
  const t2 = toTLV(2, vatNumber);
  const t3 = toTLV(3, timestamp);
  const t4 = toTLV(4, total.toFixed(2));
  const t5 = toTLV(5, vatTotal.toFixed(2));
  
  // Combine all tag-length-values into one array
  const totalLength = t1.length + t2.length + t3.length + t4.length + t5.length;
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const t of [t1, t2, t3, t4, t5]) {
    combined.set(t, offset);
    offset += t.length;
  }
  
  // Convert binary array to Base64 string
  let binary = '';
  const len = combined.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return window.btoa(binary);
}
