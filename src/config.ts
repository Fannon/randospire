/**
 * Interface for the config files
 */
export type Config = {
    name: string;
    amount: number;
    inputFolders: string[]
    fileExtensionRestrictions?: string[]
}[]
