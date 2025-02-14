import * as svg2ttf from 'svg2ttf';
import { parse, Font } from 'opentype.js';

export function generateTTF(svgFont: string): Uint8Array {
    const ttf = svg2ttf.default(svgFont, {});
    return new Uint8Array(ttf.buffer);
}

export function generateWOFF2(ttfBuffer: Uint8Array): Uint8Array {
    try {
        const arrayBuffer = ttfBuffer.buffer;
        const font = parse(arrayBuffer) as Font;

        const woff2ArrayBuffer = font.toArrayBuffer();

        return new Uint8Array(woff2ArrayBuffer);
    } catch (error) {
        console.error('WOFF2 conversion failed:', error);
        throw error;
    }
}

export interface FontFormats {
    ttf: Uint8Array;
    woff2: Uint8Array;
} 