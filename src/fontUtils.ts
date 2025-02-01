import svg2ttf from 'svg2ttf';

export function generateTTF(svgFont: string): Uint8Array {
    const ttf = svg2ttf(svgFont, {});
    return new Uint8Array(ttf.buffer);
} 