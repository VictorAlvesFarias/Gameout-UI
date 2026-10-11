export interface IAppFileResponse {
    name: string;
    versionControl: boolean;
    id: number;
    createDate: string;
    updateDate: string;
    userId: string;
    status: number;
    statusDetails?: string;
    statusMessage?: string;
    /** Latest confirmed version (UTC). */
    lastSyncedAt?: string | null;
    lastSyncedSize?: number | null;
}
