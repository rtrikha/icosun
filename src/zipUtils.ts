import JSZip from 'jszip';
import { UnicodeMap } from './generateUnicode';
import { SVGExportData } from './exportSvg';

const SVG_FOLDER_NAME = 'SVGs';

export async function createIconsZip(
    svgFont: string,
    unicodeMap: UnicodeMap,
    glyphsData: SVGExportData[],
    ttfFont: Uint8Array
): Promise<string> {
    const zip = new JSZip();

    glyphsData.forEach(data => {
        zip.file(`${SVG_FOLDER_NAME}/${data.name}.svg`, data.svg);
    });

    zip.file('iconsMaster.svg', svgFont);
    zip.file('iconsMaster.ttf', ttfFont);
    zip.file('iconMap.json', JSON.stringify(unicodeMap, null, 2));

    const zipContent = await zip.generateAsync({
        type: 'base64',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        }
    });

    return zipContent;
} 