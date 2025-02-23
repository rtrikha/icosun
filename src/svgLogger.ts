function processName(str: string): string {
    return str
        .split(/[\s-_]+/)  // Split on one or more spaces, hyphens, or underscores
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('_');
}

/**
 * Converts SVG path data to Figma vector path format
 * @param pathData SVG path data string
 * @returns Processed path data for Figma
 */
function convertPathToFigmaFormat(pathData: string): string {
    // Scale factor to fit in 24x24 (font coordinates are typically 1000x1000)
    const scale = 24 / 1000;
    // Center offset to align in frame
    const offset = (24 - (scale * 1000)) / 2;

    // Split into commands
    const commands = pathData.match(/[a-zA-Z][^a-zA-Z]*/g) || [];
    let figmaPath = '';
    let x = 0, y = 0;
    let startX = 0, startY = 0;

    // Variables for path commands
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

    // Variables for command history
    let prevCmd: string[];
    let prevQCmd: string[];

    for (const cmd of commands) {
        const type = cmd[0];
        const isRelative = type === type.toLowerCase();
        const coords = cmd.slice(1).trim().split(/[\s,]+/).map(Number);

        switch (type.toUpperCase()) {
            case 'M':
                // Move command
                x = isRelative ? x + coords[0] : coords[0];
                y = isRelative ? y + coords[1] : coords[1];
                startX = x;
                startY = y;
                // Apply scaling and Y-axis flip
                mx = (x * scale) + offset;
                my = 24 - (y * scale) + offset;
                figmaPath += `M ${mx} ${my} `;
                break;

            case 'L':
                // Line command
                x = isRelative ? x + coords[0] : coords[0];
                y = isRelative ? y + coords[1] : coords[1];
                lx = (x * scale) + offset;
                ly = 24 - (y * scale) + offset;
                figmaPath += `L ${lx} ${ly} `;
                break;

            case 'H':
                // Horizontal line
                x = isRelative ? x + coords[0] : coords[0];
                hx = (x * scale) + offset;
                hy = 24 - (y * scale) + offset;
                figmaPath += `L ${hx} ${hy} `;
                break;

            case 'V':
                // Vertical line
                y = isRelative ? y + coords[0] : coords[0];
                vx = (x * scale) + offset;
                vy = 24 - (y * scale) + offset;
                figmaPath += `L ${vx} ${vy} `;
                break;

            case 'C':
                // Cubic bezier curve
                cx1 = isRelative ? x + coords[0] : coords[0];
                cy1 = isRelative ? y + coords[1] : coords[1];
                cx2 = isRelative ? x + coords[2] : coords[2];
                cy2 = isRelative ? y + coords[3] : coords[3];
                x = isRelative ? x + coords[4] : coords[4];
                y = isRelative ? y + coords[5] : coords[5];

                // Apply scaling and Y-axis flip to all control points
                cp1x = (cx1 * scale) + offset;
                cp1y = 24 - (cy1 * scale) + offset;
                cp2x = (cx2 * scale) + offset;
                cp2y = 24 - (cy2 * scale) + offset;
                cx = (x * scale) + offset;
                cy = 24 - (y * scale) + offset;

                figmaPath += `C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${cx} ${cy} `;
                break;

            case 'S':
                // Smooth cubic bezier curve
                // Reflect previous control point
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
                // Quadratic bezier curve - convert to cubic
                qx1 = isRelative ? x + coords[0] : coords[0];
                qy1 = isRelative ? y + coords[1] : coords[1];
                qx = isRelative ? x + coords[2] : coords[2];
                qy = isRelative ? y + coords[3] : coords[3];

                // Convert quadratic control point to cubic control points
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
                // Smooth quadratic bezier - convert to cubic
                // Reflect previous control point
                prevQCmd = figmaPath.trim().split(' ').slice(-6);
                rqx = x;
                rqy = y;
                if (prevQCmd[0] === 'Q') {
                    rqx = 2 * x - parseFloat(prevQCmd[1]);
                    rqy = 2 * y - parseFloat(prevQCmd[2]);
                }

                tx = isRelative ? x + coords[0] : coords[0];
                ty = isRelative ? y + coords[1] : coords[1];

                // Convert to cubic
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
                // Arc command - convert to cubic bezier approximation
                // For now, we'll just draw a line to the endpoint as a fallback
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

/**
 * Creates a compound path from multiple subpaths with proper boolean operations
 * @param paths Array of path data and their directions
 * @param name Name for the vector node
 * @returns VectorNode
 */
function createCompoundPath(paths: PathInfo[], name: string): VectorNode {
    const vector = figma.createVector();

    // Convert all paths and combine them into a single vectorPaths array
    const vectorPaths = paths.map(path => ({
        windingRule: "NONZERO" as const,
        data: convertPathToFigmaFormat(path.data)
    }));

    vector.vectorPaths = vectorPaths;

    // Set fill only, no stroke
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

/**
 * Calculates if a path is clockwise (positive) or counterclockwise (negative)
 * @param path SVG path commands
 * @returns number positive for clockwise, negative for counterclockwise
 */
function getPathDirection(path: string): number {
    // Split the path into commands
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

/**
 * Extracts path data for a specific glyph from the combined SVG font and creates a Figma vector
 * @param svgFontData The complete SVG font string
 * @param targetName Name of the glyph to find and log
 * @returns void
 */
export const logGlyphSvg = (svgFontData: string, targetName: string): void => {
    try {
        const processedName = processName(targetName);

        // Find the glyph using regex
        const glyphRegex = new RegExp(`<glyph[^>]*?glyph-name="${processedName}"[^>]*?>`, 'i');
        const glyphMatch = svgFontData.match(glyphRegex);

        if (!glyphMatch) {
            console.log(`No glyph found with name: ${processedName} (original: ${targetName})`);

            // Extract all glyph names
            const glyphNameRegex = /glyph-name="([^"]+)"/g;
            const allGlyphNames = Array.from(svgFontData.matchAll(glyphNameRegex))
                .map(match => match[1])
                .join(', ');

            console.log('Available glyph names:', allGlyphNames);
            return;
        }

        const glyphElement = glyphMatch[0];

        // Extract path data and unicode
        const pathMatch = glyphElement.match(/d="([^"]+)"/);
        const unicodeMatch = glyphElement.match(/unicode="([^"]+)"/);

        const pathData = pathMatch ? pathMatch[1] : 'No path data found';
        const unicode = unicodeMatch ? unicodeMatch[1] : 'No unicode found';

        // Split the path into separate subpaths
        const subpaths = pathData.split(/(?=[Mm])/).filter(Boolean);

        console.log('Glyph found:', processedName);
        console.log('Unicode:', unicode);
        console.log('\nPath Analysis:');
        console.log('Number of subpaths:', subpaths.length);

        // Create a frame to hold all vectors
        const frame = figma.createFrame();
        frame.name = `${processedName}_Analysis`;
        frame.resize(24, 24);
        frame.x = figma.viewport.center.x;
        frame.y = figma.viewport.center.y;
        frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];

        // Collect all paths with their direction information
        const pathsInfo: PathInfo[] = subpaths.map((subpath, index) => {
            const direction = getPathDirection(subpath);
            const isClockwise = direction > 0;

            console.log(`\nSubpath ${index + 1}:`);
            console.log(`Direction: ${isClockwise ? 'Clockwise (Additive)' : 'Counter-clockwise (Subtractive)'}`);
            console.log(`Path: ${subpath.trim()}`);

            return {
                data: subpath.trim(),
                isClockwise
            };
        });

        // Create a single compound path with all subpaths
        const compoundVector = createCompoundPath(
            pathsInfo,
            `${processedName}_Compound`
        );
        frame.appendChild(compoundVector);

        // Select the frame
        figma.currentPage.selection = [frame];
        figma.viewport.scrollAndZoomIntoView([frame]);

    } catch (error) {
        console.error('Error extracting glyph data from SVG font:', error);
    }
}; 