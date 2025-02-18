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
    const nameCount: { [key: string]: number } = {};
    const duplicateTracker: { original: string, processed: string }[] = [];

    nodeNames.forEach((name, index) => {
        let processedName = processName(name.replace(/[^a-z0-9_]/gi, '_'));

        if (processedName in nameCount) {
            nameCount[processedName]++;
            const originalProcessed = processedName;
            processedName = `${processedName}_${nameCount[processedName]}`;
            duplicateTracker.push({
                original: name,
                processed: originalProcessed
            });
        } else {
            nameCount[processedName] = 0;
        }

        const unicode = (unicodeStart + index).toString(16);

        unicodeMap[processedName] = {
            unit: unicode,
            unitRight: `&#x${unicode};`
        };
    });

    return unicodeMap;
}
