import { UnicodeMap } from './generateUnicode';
import JSZip from 'jszip';

export interface SVGExportData {
    name: string;
    unicode: string;
    svg: string;
}

export async function exportSVGFromNode(node: SceneNode, unicodeMap: UnicodeMap): Promise<SVGExportData | null> {
    try {
        const svg = await node.exportAsync({
            format: 'SVG',
            svgOutlineText: true,
            svgIdAttribute: true
        });

        const name = node.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const svgString = Array.from(svg).map(byte => String.fromCharCode(byte)).join('');

        return {
            name,
            unicode: unicodeMap[name].unitRight.replace('&#x', '').replace(';', ''),
            svg: svgString
        };
    } catch (error) {
        console.error(`Failed to export ${node.name}:`, error);
        return null;
    }
}

export async function exportSVGsToZip(nodes: SceneNode[], unicodeMap: UnicodeMap, zip: JSZip): Promise<SVGExportData[]> {
    const glyphsData = await Promise.all(
        nodes.map(async (node) => {
            const data = await exportSVGFromNode(node, unicodeMap);
            if (data) {
                zip.file(`svg/${data.name}.svg`, data.svg);
            }
            return data;
        })
    );

    return glyphsData.filter(Boolean) as SVGExportData[];
} 