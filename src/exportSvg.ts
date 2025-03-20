import { UnicodeMap } from './generateUnicode';

export interface SVGExportData {
    name: string;
    unicode: string;
    svg: string;
}

function processName(str: string): string {
    return str
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('_');
}

export interface ExportNodeInfo {
    node: SceneNode;
    exportName: string;
}

export async function exportSVGFromNode(nodeInfo: ExportNodeInfo, unicodeMap: UnicodeMap): Promise<SVGExportData | null> {
    try {
        const svg = await nodeInfo.node.exportAsync({
            format: 'SVG',
            svgOutlineText: true,
            svgIdAttribute: true
        });

        const name = processName(nodeInfo.exportName.replace(/[^a-z0-9_]/gi, '_'));

        if (!unicodeMap[name]) {
            console.warn(`No unicode mapping found for ${name}`);
            return null;
        }

        const svgString = Array.from(svg).map(byte => String.fromCharCode(byte)).join('');

        // Ensure we're using the exact same unicode value throughout
        const unicode = unicodeMap[name].unit;

        if (!unicode) {
            console.warn(`Invalid unicode for ${name}`);
            return null;
        }

        return {
            name,
            unicode,
            svg: svgString
        };
    } catch (error) {
        console.error('Error in exportSVGFromNode:', error);
        return null;
    }
}

export async function exportSVGsToZip(nodes: ExportNodeInfo[], unicodeMap: UnicodeMap): Promise<SVGExportData[]> {
    const glyphsData = await Promise.all(
        nodes.map(async (nodeInfo) => {
            const data = await exportSVGFromNode(nodeInfo, unicodeMap);
            return data;
        })
    );

    return glyphsData.filter(Boolean) as SVGExportData[];
} 