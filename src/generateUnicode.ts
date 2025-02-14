export interface UnicodeMap {
    [key: string]: {
        unit: string;
        unitRight: string;
    };
}

function toTitleCase(str: string): string {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('-');
}

export function generateUnicodeMap(nodeNames: string[]): UnicodeMap {
    const startCode = 0xECCD;
    const map: UnicodeMap = {};

    nodeNames.forEach((name, index) => {
        const code = startCode + index;
        const hex = code.toString(16).toLowerCase();
        const sanitizedName = toTitleCase(name.replace(/[^a-z0-9]/gi, '-'));

        map[sanitizedName] = {
            unit: hex,
            unitRight: `&#x${hex};`
        };
    });
    return map;
}
