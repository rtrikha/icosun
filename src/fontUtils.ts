import * as svg2ttf from 'svg2ttf';
import { parse, Font } from 'opentype.js';

export async function generateTTF(svgFont: string): Promise<Uint8Array> {
    const ttf = await svg2ttf.default(svgFont, {});
    return new Uint8Array(ttf.buffer);
}

export async function generateOTF(ttfBuffer: Uint8Array): Promise<Uint8Array> {
    try {
        const arrayBuffer = ttfBuffer.buffer;
        const font = parse(arrayBuffer) as Font;
        const otfArrayBuffer = font.toArrayBuffer();

        return new Uint8Array(otfArrayBuffer);
    } catch (error) {
        console.error('OTF conversion failed:', error);
        throw error;
    }
}

export async function generateWOFF(ttfBuffer: Uint8Array): Promise<Uint8Array> {
    try {
        const signature = new Uint8Array([0x77, 0x4F, 0x46, 0x46]);
        const flavor = ttfBuffer.slice(0, 4);
        const length = new Uint8Array(4);
        const numTables = ttfBuffer.slice(4, 6);
        const reserved = new Uint8Array(6);
        const totalSfntSize = ttfBuffer.length;

        const dv = new DataView(new ArrayBuffer(4));
        dv.setUint32(0, totalSfntSize + 44, false);
        length.set(new Uint8Array(dv.buffer));

        const header = new Uint8Array([
            ...signature,
            ...flavor,
            ...length,
            ...numTables,
            ...reserved
        ]);

        const woffData = new Uint8Array(header.length + ttfBuffer.length);
        woffData.set(header);
        woffData.set(ttfBuffer, header.length);

        return woffData;
    } catch (error) {
        console.error('WOFF conversion failed:', error);
        throw error;
    }
}

export async function generateWOFF2(ttfBuffer: Uint8Array): Promise<Uint8Array> {
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

export async function generateEOT(ttfBuffer: Uint8Array): Promise<Uint8Array> {
    try {
        const EOT_HEADER_SIZE = 82;
        const header = new Uint8Array(EOT_HEADER_SIZE);
        const dv = new DataView(header.buffer);

        dv.setUint32(0, EOT_HEADER_SIZE + ttfBuffer.length, true);
        dv.setUint32(4, 0x00010000, true);
        dv.setUint32(8, ttfBuffer.length, true);
        dv.setUint32(12, 0x504c, true);
        dv.setUint16(16, 0x01, true);

        const eotData = new Uint8Array(header.length + ttfBuffer.length);
        eotData.set(header);
        eotData.set(ttfBuffer, header.length);

        return eotData;
    } catch (error) {
        console.error('EOT conversion failed:', error);
        throw error;
    }
}

export interface FontFormats {
    ttf: Uint8Array;
    otf: Uint8Array;
    woff: Uint8Array;
    woff2: Uint8Array;
    eot: Uint8Array;
} 