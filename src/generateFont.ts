export interface GlyphMetadata {
    name: string;
    unicode: string;
    svg: string;
}

export function generateSVGFont(glyphs: GlyphMetadata[]): string {
    const fontTemplate = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >
<svg xmlns="http://www.w3.org/2000/svg">
<defs>
<font id="iconsMaster" horiz-adv-x="1024">
<font-face units-per-em="1024" ascent="960" descent="-64" />
<missing-glyph horiz-adv-x="1024" />
${glyphs.map(glyph => `
<glyph unicode="&#x${glyph.unicode};" glyph-name="${glyph.name}" 
    d="${normalizePath(extractPathData(glyph.svg))}" />`).join('')}
</font>
</defs>
</svg>`;

    return fontTemplate;
}

function extractPathData(svgString: string): { path: string, width: number, height: number } {
    const viewBoxMatch = svgString.match(/viewBox="([^"]*)"/) || ['', '0 0 24 24'];
    const [, , , width, height] = viewBoxMatch[1].split(' ').map(Number);

    const paths: string[] = [];
    const pathRegex = /<path[^>]*d="([^"]*)"[^>]*>/g;
    let match;

    while ((match = pathRegex.exec(svgString)) !== null) {
        paths.push(match[1]);
    }

    const combinedPath = paths.join(' ');

    return {
        path: combinedPath,
        width: width || 24,
        height: height || 24
    };
}

function normalizePath(pathData: { path: string, width: number, height: number }): string {
    const scale = 1024 / Math.max(pathData.width, pathData.height);

    let normalizedPath = pathData.path.replace(/[\d.]+/g, (match) => {
        const num = parseFloat(match);
        const scaled = num * scale;
        return scaled.toFixed(3);
    });

    normalizedPath = normalizedPath.replace(/([A-Za-z])\s*([\d.-]+(?:\s*,?\s*[\d.-]+)*)/g, (match, command, params) => {
        const numbers = params.split(/[\s,]+/).map(Number);

        if (command === 'V') return `${command}${960 - numbers[0]}`;
        if (command === 'v') return `${command}${-numbers[0]}`;

        for (let i = 1; i < numbers.length; i += 2) {
            numbers[i] = 960 - numbers[i];
        }

        return `${command}${numbers.join(' ')}`;
    });

    return normalizedPath;
} 