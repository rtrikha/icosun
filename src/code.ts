import { generateSVGFont } from './generateFont';
import { generateUnicodeMap, UnicodeMap } from './generateUnicode';
import { exportSVGsToZip, SVGExportData, ExportNodeInfo } from './exportSvg';
import { createIconsZip } from './zipUtils';
import { generateTTF, generateWOFF2, generateOTF, generateWOFF, generateEOT, FontFormats } from './fontUtils';
import { checkForDuplicates, createNameTracker, DuplicateInfo } from './duplicateCheck';
import { logGlyphSvg } from './svgLogger';

figma.showUI(__html__, { width: 440, height: 200 });

interface PluginMessage {
  type: 'export-children-as-svg' | 'update-count' | 'download-ready' | 'initial-count' | 'export-error' | 'analyze-svg';
  count?: number;
  content?: string;
  unicodeMap?: UnicodeMap;
  message?: string;
  targetName?: string;
}

type NodeWithExportName = ExportNodeInfo;

function formatVariantName(str: string): string {
  return str.replace(/[=\s]+/g, '_').replace(/[^\w_]/g, '');
}

function getDirectChildren(node: BaseNode): { children: NodeWithExportName[], duplicates: DuplicateInfo[] } {
  if ('children' in node) {
    if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'PAGE') {
      const expandedChildren: NodeWithExportName[] = [];
      const nameTracker = createNameTracker();

      node.children.forEach(child => {
        if (child.type === 'COMPONENT_SET') {
          const baseComponentName = formatVariantName(child.name);
          checkForDuplicates(baseComponentName, nameTracker);

          child.children.forEach(variant => {
            if (variant.type === 'COMPONENT' && variant.visible) {
              let variantSuffix = '';

              try {
                const variantProperties = variant.variantProperties;
                if (variantProperties) {
                  variantSuffix = Object.entries(variantProperties)
                    .map(([_key, value]) => formatVariantName(value))
                    .join('_');
                }
              } catch (variantError) {
                variantSuffix = `variant_${child.children.indexOf(variant)}`;
              }

              const exportName = variantSuffix ? `${baseComponentName}_${variantSuffix}` : baseComponentName;
              expandedChildren.push({ node: variant, exportName });
            }
          });
        } else if (child.visible) {
          const exportName = formatVariantName(child.name);
          checkForDuplicates(exportName, nameTracker);
          expandedChildren.push({ node: child, exportName });
        }
      });

      return {
        children: expandedChildren,
        duplicates: nameTracker.duplicates
      };
    } else if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET' || node.type === 'INSTANCE') {
      if (node.type === 'COMPONENT_SET') {
        const children: NodeWithExportName[] = [];
        const baseComponentName = formatVariantName(node.name);

        node.children.forEach(variant => {
          if (variant.type === 'COMPONENT' && variant.visible) {
            let variantSuffix = '';

            try {
              const variantProperties = variant.variantProperties;
              if (variantProperties) {
                variantSuffix = Object.entries(variantProperties)
                  .map(([_key, value]) => formatVariantName(value))
                  .join('_');
              }
            } catch (variantError) {
              variantSuffix = `variant_${node.children.indexOf(variant)}`;
            }

            const exportName = variantSuffix ? `${baseComponentName}_${variantSuffix}` : baseComponentName;
            children.push({ node: variant, exportName });
          }
        });

        return {
          children,
          duplicates: []
        };
      } else {
        return {
          children: [{ node: node as SceneNode, exportName: formatVariantName(node.name) }],
          duplicates: []
        };
      }
    }
  }
  return {
    children: [],
    duplicates: []
  };
}

export { getDirectChildren };

async function generateFontFromGlyphs(glyphsData: SVGExportData[]): Promise<{ svg: string; fonts: FontFormats }> {
  const svgFont = await generateSVGFont(glyphsData);
  const ttf = await generateTTF(svgFont);

  const [otf, woff, woff2, eot] = await Promise.all([
    generateOTF(ttf),
    generateWOFF(ttf),
    generateWOFF2(ttf),
    generateEOT(ttf)
  ]);

  const fonts: FontFormats = {
    ttf,
    otf,
    woff,
    woff2,
    eot
  };

  return {
    svg: svgFont,
    fonts
  };
}

function updateSelectedNodeCount() {
  const selectedNode = figma.currentPage.selection[0];
  const result = selectedNode ? getDirectChildren(selectedNode) : { children: [], duplicates: [] };
  const count = result.children.length;

  if (count > 0) {
    const nodeNames = result.children.map(item => item.exportName);
    const unicodeMap = generateUnicodeMap(nodeNames);

    figma.ui.postMessage({
      type: 'initial-count',
      count: count,
      unicodeMap: unicodeMap,
      enableAnalyze: selectedNode.type === 'FRAME' ||
        selectedNode.type === 'GROUP' ||
        selectedNode.type === 'COMPONENT' ||
        selectedNode.type === 'INSTANCE' ||
        count === 1
    });
  } else {
    figma.ui.postMessage({
      type: 'initial-count',
      count: 0,
      enableAnalyze: false
    });
  }
}

figma.on('selectionchange', updateSelectedNodeCount);

updateSelectedNodeCount();

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === 'analyze-svg') {
    const selectedNode = figma.currentPage.selection[0];
    if (!selectedNode) {
      figma.notify('Please select a node first');
      return;
    }

    try {
      let nodeToAnalyze: NodeWithExportName;

      if (selectedNode.type === 'COMPONENT' || selectedNode.type === 'INSTANCE') {
        nodeToAnalyze = {
          node: selectedNode,
          exportName: formatVariantName(selectedNode.name)
        };
      } else {
        const { children } = getDirectChildren(selectedNode);
        if (children.length === 0) {
          figma.notify('No valid children found');
          return;
        }
        nodeToAnalyze = children[0];

        if (selectedNode.type === 'FRAME' || selectedNode.type === 'GROUP') {
          figma.notify('Make sure the shapes are union before analyzing', { timeout: 10000 });
        }
      }

      const nodes = [nodeToAnalyze];
      const nodeNames = nodes.map(item => item.exportName);
      const unicodeMap = generateUnicodeMap(nodeNames);
      const glyphsData = await exportSVGsToZip(nodes, unicodeMap);
      const { svg } = await generateFontFromGlyphs(glyphsData);

      let parentName = selectedNode.name;
      if (selectedNode.type === 'INSTANCE') {
        const mainComponent = await (selectedNode as InstanceNode).getMainComponentAsync();
        if (mainComponent) {
          parentName = mainComponent.name;
        }
      }

      logGlyphSvg(svg, nodeToAnalyze.exportName, parentName);

      figma.notify('SVG analysis complete');
    } catch (error) {
      console.error('SVG analysis error:', error);
      figma.notify('SVG analysis failed');
    }
  } else if (msg.type === 'export-children-as-svg') {
    const selectedNode = figma.currentPage.selection[0];

    if (!selectedNode) {
      figma.notify('Please select a node first');
      return;
    }

    try {
      const { children, duplicates } = getDirectChildren(selectedNode);

      if (duplicates.length > 0) {
        const duplicateList = duplicates
          .map(d => d.name)
          .join(', ');

        figma.notify(` Duplicate names found: ${duplicateList}. Please make sure there are no duplicate names before exporting`, {
          error: true
        });

        figma.ui.postMessage({
          type: 'export-error',
          message: 'Duplicate names found'
        });
        return;
      }

      const nodeNames = children.map(item => item.exportName);
      const unicodeMap = generateUnicodeMap(nodeNames);

      figma.notify('✅ Unicode mapping complete', { timeout: 1000 });

      figma.ui.postMessage({
        type: 'update-count',
        count: children.length
      });

      const glyphsData = await exportSVGsToZip(children, unicodeMap);
      figma.notify('✅ SVG files generated', { timeout: 1000 });

      const { svg, fonts } = await generateFontFromGlyphs(glyphsData);
      figma.notify('✅ Font file generated', { timeout: 1000 });

      const zipContent = await createIconsZip(svg, unicodeMap, glyphsData, fonts);

      figma.ui.postMessage({
        type: 'download-ready',
        content: zipContent
      });

      figma.notify(` 🎊 Successfully generated font files with ${children.length} icons`, {
        timeout: Infinity,
      });
    } catch (error) {
      console.error('Export error:', error);
      figma.notify('Export failed. Please try again.');
    }
  }
};
