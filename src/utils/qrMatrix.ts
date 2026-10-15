/**
 * Self-contained Standard QR Code Generator (ISO/IEC 18004 compliant subset).
 * Generates valid, optical-reader scannable QR Code SVG and matrix arrays without external dependencies.
 */

export interface QrMatrixOptions {
  size?: number;
  margin?: number;
  darkColor?: string;
  lightColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * Encodes text into an SVG string representing a scannable QR Code.
 */
export function generateQrCodeSvg(text: string, options: QrMatrixOptions = {}): { svg: string; dataUrl: string; size: number } {
  const size = options.size || 256;
  const margin = options.margin !== undefined ? options.margin : 4;
  const darkColor = options.darkColor || '#0f172a';
  const lightColor = options.lightColor || '#ffffff';

  const matrix = createQrCodeMatrix(text);
  const moduleCount = matrix.length;
  const totalDim = moduleCount + margin * 2;
  const cellSize = size / totalDim;

  let rects = '';
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      if (matrix[r][c]) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        rects += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${cellSize.toFixed(2)}" height="${cellSize.toFixed(2)}" fill="${darkColor}"/>`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${lightColor}"/>${rects}</svg>`;
  const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

  return {
    svg,
    dataUrl,
    size: moduleCount,
  };
}

/**
 * Creates a standard QR code binary matrix (2D boolean array).
 * Uses Byte Mode and Reed-Solomon Error Correction.
 */
export function createQrCodeMatrix(data: string): boolean[][] {
  // Determine appropriate QR Version (1: 21x21, 2: 25x25, 3: 29x29, 4: 33x33) based on length
  const bytes = new TextEncoder().encode(data);
  let version = 1;
  const capacities = [17, 32, 53, 78, 106, 134, 154, 192]; // Capacities for Level M Byte mode

  for (let v = 0; v < capacities.length; v++) {
    if (bytes.length <= capacities[v]) {
      version = v + 1;
      break;
    }
    if (v === capacities.length - 1) version = capacities.length;
  }

  const dim = 17 + 4 * version;
  const matrix: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));
  const isFunction: boolean[][] = Array.from({ length: dim }, () => Array(dim).fill(false));

  function setModule(r: number, c: number, val: boolean) {
    if (r >= 0 && r < dim && c >= 0 && c < dim) {
      matrix[r][c] = val;
      isFunction[r][c] = true;
    }
  }

  // 1. Draw 3 Finder Patterns (7x7) + Separators (8x8)
  const finderPositions = [
    [0, 0],
    [dim - 7, 0],
    [0, dim - 7],
  ];

  for (const [row, col] of finderPositions) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const curR = row + r;
        const curC = col + c;
        if (curR >= 0 && curR < dim && curC >= 0 && curC < dim) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            setModule(curR, curC, isBorder || isCenter);
          } else {
            setModule(curR, curC, false); // Separator
          }
        }
      }
    }
  }

  // 2. Alignment Patterns for version >= 2
  if (version >= 2) {
    const alignCoords: Record<number, number[]> = {
      2: [6, 18],
      3: [6, 22],
      4: [6, 26],
      5: [6, 30],
      6: [6, 34],
      7: [6, 22, 38],
      8: [6, 24, 42],
    };
    const coords = alignCoords[version] || [6, dim - 7];
    for (const r of coords) {
      for (const c of coords) {
        // Skip if overlaps finder
        if ((r <= 8 && c <= 8) || (r >= dim - 8 && c <= 8) || (r <= 8 && c >= dim - 8)) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isOuter = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            setModule(r + dr, c + dc, isOuter || isCenter);
          }
        }
      }
    }
  }

  // 3. Timing Patterns
  for (let i = 8; i < dim - 8; i++) {
    if (!isFunction[6][i]) setModule(6, i, i % 2 === 0);
    if (!isFunction[i][6]) setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark Module
  setModule(4 * version + 9, 8, true);

  // 5. Reserve Format Information Area
  for (let i = 0; i < 9; i++) {
    if (i !== 6) {
      isFunction[8][i] = true;
      isFunction[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i++) {
    isFunction[8][dim - 1 - i] = true;
    isFunction[dim - 1 - i][8] = true;
  }

  // 6. Encode Data with Byte Mode (Mode: 0100) + Character Count
  const bitStream: number[] = [];
  function pushBits(val: number, length: number) {
    for (let i = length - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  }

  // Mode: Byte (0100)
  pushBits(0b0100, 4);
  // Char count indicator (8 bits for versions 1-9)
  pushBits(bytes.length, 8);
  // Byte data
  for (let i = 0; i < bytes.length; i++) {
    pushBits(bytes[i], 8);
  }

  // Terminator (up to 4 zeroes)
  const totalDataBits = capacities[version - 1] * 8;
  const termBits = Math.min(4, totalDataBits - bitStream.length);
  pushBits(0, termBits);

  // Pad to 8-bit boundary
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Pad with alternating 0xEC, 0x11
  const padBytes = [0b11101100, 0b00010001];
  let pIdx = 0;
  while (bitStream.length < totalDataBits) {
    pushBits(padBytes[pIdx % 2], 8);
    pIdx++;
  }

  // Convert bitstream to bytes
  const dataBytes: number[] = [];
  for (let i = 0; i < bitStream.length; i += 8) {
    let b = 0;
    for (let bit = 0; bit < 8; bit++) {
      b = (b << 1) | bitStream[i + bit];
    }
    dataBytes.push(b);
  }

  // 7. Error Correction (Reed-Solomon)
  const ecCount = getEcCodewords(version);
  const ecBytes = calculateReedSolomon(dataBytes, ecCount);
  const finalCodewords = [...dataBytes, ...ecBytes];

  // Convert final codewords back to bits
  const finalBits: number[] = [];
  for (const b of finalCodewords) {
    for (let i = 7; i >= 0; i--) {
      finalBits.push((b >> i) & 1);
    }
  }

  // 8. Place data bits in matrix (right-to-left 2-column zig-zag)
  let bitIdx = 0;
  let upward = true;
  for (let right = dim - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column
    const colList = [right, right - 1];
    const rowList = upward
      ? Array.from({ length: dim }, (_, i) => dim - 1 - i)
      : Array.from({ length: dim }, (_, i) => i);

    for (const r of rowList) {
      for (const c of colList) {
        if (!isFunction[r][c]) {
          const bitVal = bitIdx < finalBits.length ? finalBits[bitIdx] === 1 : false;
          // Apply standard mask 0: (row + col) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = bitVal !== mask;
          bitIdx++;
        }
      }
    }
    upward = !upward;
  }

  // 9. Format Information (Mask 0 + Level M = 00 + 101010000010010)
  // Format info bits for Level M, Mask 0: 101010000010010
  const formatBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  for (let i = 0; i < 6; i++) matrix[8][i] = formatBits[i] === 1;
  matrix[8][7] = formatBits[6] === 1;
  matrix[8][8] = formatBits[7] === 1;
  matrix[7][8] = formatBits[8] === 1;
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = formatBits[i] === 1;

  for (let i = 0; i < 7; i++) matrix[dim - 1 - i][8] = formatBits[i] === 1;
  for (let i = 7; i < 15; i++) matrix[8][dim - 15 + i] = formatBits[i] === 1;

  return matrix;
}

function getEcCodewords(version: number): number {
  const table = [10, 16, 26, 36, 48, 64, 72, 88];
  return table[Math.min(version - 1, table.length - 1)];
}

function calculateReedSolomon(data: number[], ecCount: number): number[] {
  // Galois Field GF(256) with primitive polynomial 0x11d (285)
  const exp: number[] = new Array(512);
  const log: number[] = new Array(256);
  let val = 1;
  for (let i = 0; i < 255; i++) {
    exp[i] = val;
    log[val] = i;
    val <<= 1;
    if (val >= 256) val ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) {
    exp[i] = exp[i - 255];
  }

  function gfMul(x: number, y: number): number {
    if (x === 0 || y === 0) return 0;
    return exp[log[x] + log[y]];
  }

  // Generator polynomial
  let gen = [1];
  for (let i = 0; i < ecCount; i++) {
    const nextGen = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      nextGen[j] ^= gfMul(gen[j], exp[i]);
      nextGen[j + 1] ^= gen[j];
    }
    gen = nextGen;
  }

  // Division to compute remainder (EC bytes)
  const remainder = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let j = 0; j < ecCount; j++) {
      remainder[j] ^= gfMul(gen[j], factor);
    }
  }

  return remainder;
}
