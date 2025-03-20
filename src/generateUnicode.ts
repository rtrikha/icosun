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

function stableNameHash(name: string): number {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

export function generateUnicodeMap(nodeNames: string[]): UnicodeMap {
    const unicodeMap: UnicodeMap = {};
    const unicodeStart = 0xE000;
    const unicodeEnd = 0xF8FF;
    const usedUnicodes = new Set<string>();

    nodeNames.forEach(name => {
        const processedName = processName(name.replace(/[^a-z0-9_]/gi, '_'));

        const nameHash = stableNameHash(processedName);

        const range = unicodeEnd - unicodeStart;
        let unicodeValue = unicodeStart + (nameHash % range);
        let unicode = unicodeValue.toString(16);

        while (usedUnicodes.has(unicode)) {
            unicodeValue = (unicodeValue + 17) % range + unicodeStart;
            unicode = unicodeValue.toString(16);
        }

        usedUnicodes.add(unicode);
        unicodeMap[processedName] = {
            unit: unicode,
            unitRight: `&#x${unicode};`
        };
    });

    return unicodeMap;
}
