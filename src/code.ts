import { generateSVGFont, GlyphMetadata } from './generateFont';
import JSZip from 'jszip';
import { UnicodeMap, generateUnicodeMap } from './generateUnicode';

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
      const zip = new JSZip();

      // Export SVGs and collect glyph data
      const glyphsData = await Promise.all(children.map(async (node) => {
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
      }));

      // Generate single SVG font file
      const svgFont = await generateSVGFont(glyphsData.filter(Boolean) as GlyphMetadata[]);

      // Add font and map to zip
      zip.file('iconsMaster.svg', svgFont);
      zip.file('iconMap.json', JSON.stringify(unicodeMap, null, 2));

      const zipContent = await zip.generateAsync({
        type: 'base64',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 9
        }
      });

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
