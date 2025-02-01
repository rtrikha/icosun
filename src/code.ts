import { generateSVGFont } from './generateFont';
import { generateUnicodeMap, UnicodeMap } from './generateUnicode';
import { exportSVGsToZip, SVGExportData } from './exportSvg';
import { createIconsZip } from './zipUtils';
import { generateTTF } from './fontUtils';

figma.showUI(__html__, { width: 400, height: 200 });

interface PluginMessage {
  type: 'export-children-as-svg' | 'update-count' | 'download-ready' | 'initial-count';
  count?: number;
  content?: string;
  unicodeMap?: UnicodeMap;
}

function getDirectChildren(node: BaseNode): SceneNode[] {
  if ('children' in node) {
    if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
      return [...node.children];
    }
  }
  return [];
}

async function generateFontFromGlyphs(glyphsData: SVGExportData[]): Promise<{ svg: string; ttf: Uint8Array }> {
  const svgFont = await generateSVGFont(glyphsData);

  const ttfFont = generateTTF(svgFont);

  return {
    svg: svgFont,
    ttf: ttfFont
  };
}

function updateSelectedNodeCount() {
  const selectedNode = figma.currentPage.selection[0];
  const children = selectedNode ? getDirectChildren(selectedNode) : [];
  const count = children.length;

  if (count > 0) {
    const nodeNames = children.map(node => node.name);
    const unicodeMap = generateUnicodeMap(nodeNames);

    figma.ui.postMessage({
      type: 'initial-count',
      count: count,
      unicodeMap: unicodeMap
    });
  } else {
    figma.ui.postMessage({
      type: 'initial-count',
      count: 0
    });
  }
}

figma.on('selectionchange', updateSelectedNodeCount);

updateSelectedNodeCount();

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'export-children-as-svg') {
    const selectedNode = figma.currentPage.selection[0];

    if (!selectedNode) {
      figma.notify('Please select a node first');
      return;
    }

    try {
      const children = getDirectChildren(selectedNode);
      const nodeNames = children.map(node => node.name);
      const unicodeMap = generateUnicodeMap(nodeNames);

      figma.ui.postMessage({
        type: 'update-count',
        count: children.length
      });

      figma.notify('Preparing font file...');

      const glyphsData = await exportSVGsToZip(children, unicodeMap);

      const { svg, ttf } = await generateFontFromGlyphs(glyphsData);

      const zipContent = await createIconsZip(svg, unicodeMap, glyphsData, ttf);

      figma.ui.postMessage({
        type: 'download-ready',
        content: zipContent
      });

      figma.notify(`Successfully generated font with ${children.length} glyphs`);
    } catch (error) {
      console.error('Export failed:', error);
      figma.notify('Export failed. Check console for details.');
    }
  }
};
