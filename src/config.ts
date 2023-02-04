/**
 * Interface for the config files
 */
export type Config = {
    /**
     * Name of result, will also result in a subfolder name
     */
    name: string;
    /**
     * How many files to pick randomly
     */
    amount: number;
    /**
     * List of folders to search for files and randomly pick some
     */
    inputFolders: string[];
    /**
     * If not given, no file extension restriction is made (searching *.*)
     */
    fileExtensions?: string[];
}[]

/**
 * Stores the results of the operation, so it is possible to understand what was done in retrospect
 */
export type Report = {
    config: Config[];
    inputFiles: any;
    outputFiles: any;
}[]