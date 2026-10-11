/** A version of a group: only uploads the driver confirmed are listed. */
export interface IAppStoredFileResponse {
    id: number;
    appFileId: number;
    storedFileId?: number;
    createDate: string;
    updateDate: string;
    sizeInBytes?: number;
}
