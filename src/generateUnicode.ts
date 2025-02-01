export interface UnicodeMap {
    [key: string]: {
        unit: string;
        unitRight: string;
    };
}

export function generateUnicodeMap(nodeNames: string[]): UnicodeMap {
    const startCode = 0xECCD;
    const map: UnicodeMap = {};

    nodeNames.forEach((name, index) => {
        const code = startCode + index;
        const hex = code.toString(16).toLowerCase();
        const sanitizedName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase();

        map[sanitizedName] = {
            unit: hex,
            unitRight: `&#x${hex};`
        };
    });
    return map;
}
