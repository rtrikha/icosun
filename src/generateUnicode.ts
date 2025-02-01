export interface UnicodeMap {
    [key: string]: {
        unit: string;      // e.g. "eccd"
        unitRight: string; // e.g. "&#xeccd;"
    };
}

export function generateUnicodeMap(nodeNames: string[]): UnicodeMap {
    const startCode = 0xECCD; // Starting from the same value as demo.html
    const map: UnicodeMap = {};

    nodeNames.forEach((name, index) => {
        const code = startCode + index;
        const hex = code.toString(16).toLowerCase(); // Convert to lowercase hex
        const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        map[sanitizedName] = {
            unit: hex,
            unitRight: `&#x${hex};`
        };
    });
    return map;
}
