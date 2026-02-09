import { RegistryItem } from './download';
import chalk from 'chalk';

export interface BundleResolution {
    valid: RegistryItem[];
    missing: string[];
}

export function resolveBundleContents(
    registryItems: RegistryItem[],
    selectedItem: RegistryItem,
    processedBundles: Set<string> = new Set() // Prevent infinite recursion
): BundleResolution {
    if (selectedItem.type !== 'bundle') {
        return {
            valid: [selectedItem],
            missing: []
        };
    }

    if (processedBundles.has(selectedItem.name)) {
        console.warn(chalk.yellow(`Circular dependency detected in bundle: ${selectedItem.name}. Skipping to avoid infinite loop.`));
        return { valid: [], missing: [] };
    }

    processedBundles.add(selectedItem.name);

    if (!selectedItem.includes || selectedItem.includes.length === 0) {
        console.warn(chalk.yellow(`Bundle ${selectedItem.name} has no 'includes' property or is empty.`));
        return { valid: [], missing: [] };
    }

    const validItems: RegistryItem[] = [];
    const missingItems: string[] = [];

    for (const itemName of selectedItem.includes) {
        const foundItem = registryItems.find(i => i.name === itemName);

        if (!foundItem) {
            missingItems.push(itemName);
        } else {
            // Recursively resolve contents (in case a bundle includes another bundle)
            const result = resolveBundleContents(registryItems, foundItem, processedBundles);
            validItems.push(...result.valid);
            missingItems.push(...result.missing);
        }
    }

    // Deduplicate valid items
    const uniqueValidItems = Array.from(new Map(validItems.map(item => [item.name, item])).values());
    const uniqueMissingItems = Array.from(new Set(missingItems));

    return {
        valid: uniqueValidItems,
        missing: uniqueMissingItems
    };
}
