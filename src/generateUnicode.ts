export interface UnicodeMap {
    [key: string]: {
        unit: string;
        unitRight: string;
    };
}

function processName(str: string): string {
    return str
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('_');
}

export function generateUnicodeMap(nodeNames: string[]): UnicodeMap {
    const unicodeMap: UnicodeMap = {};
    const unicodeStart = 0xECCD;

    nodeNames.forEach((name, index) => {
        const processedName = processName(name.replace(/[^a-z0-9_]/gi, '_'));
        const unicode = (unicodeStart + index).toString(16);

        unicodeMap[processedName] = {
            unit: unicode,
            unitRight: `&#x${unicode};`
        };
    });

    return unicodeMap;
}
