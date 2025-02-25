function processName(str: string): string {
    return str
        .split(/[\s-_]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('_');
}

function convertPathToFigmaFormat(pathData: string): string {
    const scale = 24 / 1000;
    const offset = (24 - (scale * 1000)) / 2;

    const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    let figmaPath = '';
    let x = 0, y = 0;
    let startX = 0, startY = 0;

    let mx: number, my: number;
    let lx: number, ly: number;
    let hx: number, hy: number;
    let vx: number, vy: number;
    let cx1: number, cy1: number, cx2: number, cy2: number;
    let cp1x: number, cp1y: number, cp2x: number, cp2y: number;
    let cx: number, cy: number;
    let rcx: number, rcy: number;
    let scpx: number, scpy: number, sx: number, sy: number;
    let qx1: number, qy1: number, qx: number, qy: number;
    let c1x: number, c1y: number, c2x: number, c2y: number;
    let qcp1x: number, qcp1y: number, qcp2x: number, qcp2y: number;
    let qendx: number, qendy: number;
    let rqx: number, rqy: number;
    let tx: number, ty: number;
    let tc1x: number, tc1y: number, tc2x: number, tc2y: number;
    let tcp1x: number, tcp1y: number, tcp2x: number, tcp2y: number;
    let tendx: number, tendy: number;
    let ax: number, ay: number;

    let prevCmd: string[];
    let prevQCmd: string[];

    for (const cmd of commands) {
        const type = cmd[0];
        const isRelative = type === type.toLowerCase();
        const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

        switch (type.toUpperCase()) {
            case 'M':
                x = isRelative ? x + coords[0] : coords[0];
                y = isRelative ? y + coords[1] : coords[1];
                startX = x;
                startY = y;
                mx = (x * scale) + offset;
                my = 24 - (y * scale) + offset;
                figmaPath += `M ${mx} ${my} `;
                break;

            case 'L':
                x = isRelative ? x + coords[0] : coords[0];
                y = isRelative ? y + coords[1] : coords[1];
                lx = (x * scale) + offset;
                ly = 24 - (y * scale) + offset;
                figmaPath += `L ${lx} ${ly} `;
                break;

            case 'H':
                x = isRelative ? x + coords[0] : coords[0];
                hx = (x * scale) + offset;
                hy = 24 - (y * scale) + offset;
                figmaPath += `L ${hx} ${hy} `;
                break;

            case 'V':
                y = isRelative ? y + coords[0] : coords[0];
                vx = (x * scale) + offset;
                vy = 24 - (y * scale) + offset;
                figmaPath += `L ${vx} ${vy} `;
                break;

            case 'C':
                cx1 = isRelative ? x + coords[0] : coords[0];
                cy1 = isRelative ? y + coords[1] : coords[1];
                cx2 = isRelative ? x + coords[2] : coords[2];
                cy2 = isRelative ? y + coords[3] : coords[3];
                x = isRelative ? x + coords[4] : coords[4];
                y = isRelative ? y + coords[5] : coords[5];

                cp1x = (cx1 * scale) + offset;
                cp1y = 24 - (cy1 * scale) + offset;
                cp2x = (cx2 * scale) + offset;
                cp2y = 24 - (cy2 * scale) + offset;
                cx = (x * scale) + offset;
                cy = 24 - (y * scale) + offset;

                figmaPath += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cx} ${cy} `;
                break;

            case 'S':
                prevCmd = figmaPath.trim().split(' ').slice(-6);
                rcx = x;
                rcy = y;
                if (prevCmd[0] === 'C') {
                    rcx = 2 * x - parseFloat(prevCmd[3]);
                    rcy = 2 * y - parseFloat(prevCmd[4]);
                }

                cx2 = isRelative ? x + coords[0] : coords[0];
                cy2 = isRelative ? y + coords[1] : coords[1];
                x = isRelative ? x + coords[2] : coords[2];
                y = isRelative ? y + coords[3] : coords[3];

                scpx = (rcx * scale) + offset;
                scpy = 24 - (rcy * scale) + offset;
                sx = (x * scale) + offset;
                sy = 24 - (y * scale) + offset;

                figmaPath += `C ${scpx} ${scpy} ${sx} ${sy} `;
                break;

            case 'Q':
                qx1 = isRelative ? x + coords[0] : coords[0];
                qy1 = isRelative ? y + coords[1] : coords[1];
                qx = isRelative ? x + coords[2] : coords[2];
                qy = isRelative ? y + coords[3] : coords[3];

                c1x = x + 2 / 3 * (qx1 - x);
                c1y = y + 2 / 3 * (qy1 - y);
                c2x = qx + 2 / 3 * (qx1 - qx);
                c2y = qy + 2 / 3 * (qy1 - qy);

                qcp1x = (c1x * scale) + offset;
                qcp1y = 24 - (c1y * scale) + offset;
                qcp2x = (c2x * scale) + offset;
                qcp2y = 24 - (c2y * scale) + offset;
                qendx = (qx * scale) + offset;
                qendy = 24 - (qy * scale) + offset;

                figmaPath += `C ${qcp1x} ${qcp1y} ${qcp2x} ${qcp2y} ${qendx} ${qendy} `;
                x = qx;
                y = qy;
                break;

            case 'T':
                prevQCmd = figmaPath.trim().split(' ').slice(-6);
                rqx = x;
                rqy = y;
                if (prevQCmd[0] === 'Q') {
                    rqx = 2 * x - parseFloat(prevQCmd[1]);
                    rqy = 2 * y - parseFloat(prevQCmd[2]);
                }

                tx = isRelative ? x + coords[0] : coords[0];
                ty = isRelative ? y + coords[1] : coords[1];

                tc1x = x + 2 / 3 * (rqx - x);
                tc1y = y + 2 / 3 * (rqy - y);
                tc2x = tx + 2 / 3 * (rqx - tx);
                tc2y = ty + 2 / 3 * (rqy - ty);

                tcp1x = (tc1x * scale) + offset;
                tcp1y = 24 - (tc1y * scale) + offset;
                tcp2x = (tc2x * scale) + offset;
                tcp2y = 24 - (tc2y * scale) + offset;
                tendx = (tx * scale) + offset;
                tendy = 24 - (ty * scale) + offset;

                figmaPath += `C ${tcp1x} ${tcp1y} ${tcp2x} ${tcp2y} ${tendx} ${tendy} `;
                x = tx;
                y = ty;
                break;

            case 'A':
                x = isRelative ? x + coords[5] : coords[5];
                y = isRelative ? y + coords[6] : coords[6];
                ax = (x * scale) + offset;
                ay = 24 - (y * scale) + offset;
                figmaPath += `L ${ax} ${ay} `;
                break;

            case 'Z':
                figmaPath += 'Z ';
                x = startX;
                y = startY;
                break;
        }
    }

    return figmaPath.trim();
}

interface PathInfo {
    data: string;
    isClockwise: boolean;
}

function createCompoundPath(paths: PathInfo[], name: string): VectorNode {
    const vector = figma.createVector();

    const vectorPaths = paths.map(path => ({
        windingRule: "NONZERO" as const,
        data: convertPathToFigmaFormat(path.data)
    }));

    vector.vectorPaths = vectorPaths;

    vector.fills = [{
        type: 'SOLID',
        color: { r: 0, g: 0, b: 0 }
    }];
    vector.strokes = [];
    vector.constraints = {
        horizontal: 'SCALE',
        vertical: 'SCALE'
    };
    vector.name = name;

    return vector;
}

function getPathDirection(path: string): number {
    const commands = path.match(/[A-Za-z][^A-Za-z]*/g) || [];
    let area = 0;
    let x = 0, y = 0;
    let startX = 0, startY = 0;
    let newX: number, newY: number;

    for (const cmd of commands) {
        const type = cmd[0];
        const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

        switch (type.toUpperCase()) {
            case 'M':
                startX = type === 'M' ? coords[0] : x + coords[0];
                startY = type === 'M' ? coords[1] : y + coords[1];
                x = startX;
                y = startY;
                break;
            case 'L':
                newX = type === 'L' ? coords[0] : x + coords[0];
                newY = type === 'L' ? coords[1] : y + coords[1];
                area += (x * newY - newX * y);
                x = newX;
                y = newY;
                break;
            case 'Z':
                area += (x * startY - startX * y);
                x = startX;
                y = startY;
                break;
        }
    }

    return area;
}

export const logGlyphSvg = (svgFontData: string, targetName: string, parentName: string): void => {
    try {
        const processedName = processName(targetName);

        const glyphRegex = new RegExp(`<glyph[^>]*?glyph-name="${processedName}"[^>]*?>`, 'i');
        const glyphMatch = svgFontData.match(glyphRegex);

        if (!glyphMatch) {
            console.log(`No glyph found with name: ${processedName} (original: ${targetName})`);

            const glyphNameRegex = /glyph-name="([^"]+)"/g;
            const allGlyphNames = Array.from(svgFontData.matchAll(glyphNameRegex))
                .map(match => match[1])
                .join(', ');

            console.log('Available glyph names:', allGlyphNames);
            return;
        }

        const glyphElement = glyphMatch[0];
        const pathMatch = glyphElement.match(/d="([^"]+)"/);
        const pathData = pathMatch ? pathMatch[1] : 'No path data found';
        const subpaths = pathData.split(/(?=[Mm])/).filter(Boolean);

        const sourceNode = figma.currentPage.selection[0];

        const frame = figma.createFrame();
        frame.name = `${parentName}-Analysis`;
        frame.resizeWithoutConstraints(24, 24);

        if (sourceNode) {
            if (sourceNode.type === 'COMPONENT_SET' || sourceNode.type === 'INSTANCE' || sourceNode.type === 'COMPONENT') {
                const bounds = sourceNode.absoluteBoundingBox;
                if (bounds) {
                    frame.x = bounds.x + bounds.width + 8;
                    frame.y = bounds.y;
                }
            } else {
                frame.x = sourceNode.x + sourceNode.width + 8;
                frame.y = sourceNode.y;
            }
        }

        frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
        frame.layoutMode = 'HORIZONTAL';
        frame.primaryAxisAlignItems = 'CENTER';
        frame.counterAxisAlignItems = 'CENTER';
        frame.layoutSizingHorizontal = 'FIXED';
        frame.layoutSizingVertical = 'FIXED';
        frame.paddingLeft = 0;
        frame.paddingRight = 0;
        frame.paddingTop = 0;
        frame.paddingBottom = 0;
        frame.itemSpacing = 0;

        const pathsInfo: PathInfo[] = subpaths.map((subpath) => {
            const direction = getPathDirection(subpath);
            const isClockwise = direction > 0;

            return {
                data: subpath.trim(),
                isClockwise
            };
        });

        const compoundVector = createCompoundPath(
            pathsInfo,
            `${processedName}_Compound`
        );
        frame.appendChild(compoundVector);

        figma.currentPage.selection = [frame];
        figma.viewport.scrollAndZoomIntoView([frame]);

    } catch (error) {
        console.error('Error extracting glyph data from SVG font:', error);
    }
}; 