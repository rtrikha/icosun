import { UnicodeMap } from './generateUnicode';

export interface SVGExportData {
    name: string;
    unicode: string;
    svg: string;
}

function toTitleCase(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-');
}

export async function exportSVGFromNode(node: SceneNode, unicodeMap: UnicodeMap): Promise<SVGExportData | null> {
    try {
        const svg = await node.exportAsync({
            format: 'SVG',
            svgOutlineText: true,
            svgIdAttribute: true
        });

        const name = toTitleCase(node.name.replace(/[^a-z0-9]/gi, '-'));
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

export async function exportSVGsToZip(nodes: SceneNode[], unicodeMap: UnicodeMap): Promise<SVGExportData[]> {
    const glyphsData = await Promise.all(
        nodes.map(async (node) => {
            const data = await exportSVGFromNode(node, unicodeMap);
            return data;
        })
    );

    return glyphsData.filter(Boolean) as SVGExportData[];
} 