export function toTLV(tag: number, value: string): Buffer {
  const valueBytes = Buffer.from(value, 'utf8');
  const tlvBytes = Buffer.alloc(2 + valueBytes.length);
  tlvBytes[0] = tag;
  tlvBytes[1] = valueBytes.length;
  valueBytes.copy(tlvBytes, 2);
  return tlvBytes;
}

export function generateZatcaBase64(
  sellerName: string,
  vatNumber: string,
  timestamp: string,
  total: number,
  vatTotal: number
): string {
  const t1 = toTLV(1, sellerName);
  const t2 = toTLV(2, vatNumber);
  const t3 = toTLV(3, timestamp);
  const t4 = toTLV(4, total.toFixed(2));
  const t5 = toTLV(5, vatTotal.toFixed(2));
  
  const combined = Buffer.concat([t1, t2, t3, t4, t5]);
  return combined.toString('base64');
}
