import JSZip from 'jszip';
import { UnicodeMap } from './generateUnicode';
import { SVGExportData } from './exportSvg';
import { FontFormats } from './fontUtils';

const SVG_FOLDER_NAME = 'SVGs';
const FONTS_FOLDER_NAME = 'fonts';

interface ExportedUnicodeMap {
    [key: string]: {
        unit: string;
    };
}

function generateTypeScriptMap(map: UnicodeMap): string {
    const lines = ['export const IconUnicode = {'];

    for (const [key, value] of Object.entries(map)) {
        const constName = key.toUpperCase().replace(/-/g, '_');
        lines.push(`  ${constName}: '"\\\\${value.unit}"',`);
    }

    lines.push('} as const;');
    lines.push('');
    return lines.join('\n');
}

function simplifyUnicodeMap(map: UnicodeMap): ExportedUnicodeMap {
    const simplified: ExportedUnicodeMap = {};
    for (const [key, value] of Object.entries(map)) {
        simplified[key] = {
            unit: value.unit
        };
    }
    return simplified;
}

export async function createIconsZip(
    svgFont: string,
    unicodeMap: UnicodeMap,
    glyphsData: SVGExportData[],
    fonts: FontFormats
): Promise<string> {
    const zip = new JSZip();

    glyphsData.forEach(data => {
        zip.file(`${SVG_FOLDER_NAME}/${data.name}.svg`, data.svg);
    });

    zip.file('iconsMaster.svg', svgFont);

    zip.file(`${FONTS_FOLDER_NAME}/iconsMaster.ttf`, fonts.ttf);
    zip.file(`${FONTS_FOLDER_NAME}/iconsMaster.otf`, fonts.otf);
    zip.file(`${FONTS_FOLDER_NAME}/iconsMaster.woff`, fonts.woff);
    zip.file(`${FONTS_FOLDER_NAME}/iconsMaster.woff2`, fonts.woff2);
    zip.file(`${FONTS_FOLDER_NAME}/iconsMaster.eot`, fonts.eot);

    zip.file('iconMap.json', JSON.stringify(simplifyUnicodeMap(unicodeMap), null, 2));
    zip.file('iconUnicode.ts', generateTypeScriptMap(unicodeMap));

    const zipContent = await zip.generateAsync({
        type: 'base64',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    });

    return zipContent;
} 