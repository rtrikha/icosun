import { generateSVGFont } from './generateFont';
import { generateUnicodeMap, UnicodeMap } from './generateUnicode';
import { exportSVGsToZip, SVGExportData } from './exportSvg';
import { createIconsZip } from './zipUtils';
import { generateTTF, generateWOFF2, FontFormats } from './fontUtils';

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
      const children = [...node.children];
      const expandedChildren: SceneNode[] = [];

      children.forEach(child => {
        if (child.type === 'COMPONENT_SET') {
          const variants = [...child.children];
          variants.forEach(variant => {
            if (variant.type === 'COMPONENT') {
              const variantClone = variant.clone();
              const baseComponentName = child.name;
              const variantProperties = variant.variantProperties;
              const variantSuffix = Object.entries(variantProperties || {})
                .map(([_key, value]) => `${value}`)
                .join('-');
              variantClone.name = `${baseComponentName}-${variantSuffix}`;
              expandedChildren.push(variantClone);
            }
          });
        } else {
          expandedChildren.push(child);
        }
      });

      const instances = expandedChildren.filter(child => child.type === 'INSTANCE');
      const components = expandedChildren.filter(child => child.type === 'COMPONENT');

      if (instances.length > 0 || components.length > 0) {
        console.log('Found instances:', instances.map(instance => instance.name));
        console.log('Found components:', components.map(component => component.name));
      }

      return expandedChildren;
    } else if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      if (node.type === 'COMPONENT_SET') {
        return [...node.children];
      }
      const children = [...node.children];
      return children;
    }
  }
  return [];
}

async function generateFontFromGlyphs(glyphsData: SVGExportData[]): Promise<{ svg: string; fonts: FontFormats }> {
  const svgFont = await generateSVGFont(glyphsData);
  const ttf = generateTTF(svgFont);
  const woff2 = generateWOFF2(ttf);

  const fonts: FontFormats = {
    ttf,
    woff2
  };

  return {
    svg: svgFont,
    fonts
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

      figma.notify('Preparing font files...');

      const glyphsData = await exportSVGsToZip(children, unicodeMap);
      const { svg, fonts } = await generateFontFromGlyphs(glyphsData);
      const zipContent = await createIconsZip(svg, unicodeMap, glyphsData, fonts);

      figma.ui.postMessage({
        type: 'download-ready',
        content: zipContent
      });

      figma.notify(`Successfully generated fonts with ${children.length} glyphs`);
    } catch (error) {
      console.error('Export failed:', error);
      figma.notify('Export failed. Check console for details.');
    }
  }
};
