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
            return null;
        }

        const svgString = Array.from(svg).map(byte => String.fromCharCode(byte)).join('');

        if (!unicodeMap[name].unitRight) {
            return null;
        }

        const unicode = unicodeMap[name].unitRight.replace('&#x', '').replace(';', '');

        return {
            name,
            unicode,
            svg: svgString
        };
    } catch (error) {
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