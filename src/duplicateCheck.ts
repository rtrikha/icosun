export interface DuplicateInfo {
    name: string;
    count: number;
}

export interface NameTracker {
    nameCount: { [key: string]: number };
    duplicates: DuplicateInfo[];
}

export function checkForDuplicates(name: string, tracker: NameTracker): void {
    if (name in tracker.nameCount) {
        tracker.nameCount[name]++;
        tracker.duplicates.push({
            name,
            count: tracker.nameCount[name] + 1
        });
    } else {
        tracker.nameCount[name] = 0;
    }
}

export function createNameTracker(): NameTracker {
    return {
        nameCount: {},
        duplicates: []
    };
} 