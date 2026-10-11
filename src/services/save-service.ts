import { env } from "../environment";
import { BaseHttpService, catchErrors, IBaseHttpResponseApi } from "typescript-toolkit";
import { AUTH } from "../config/auth-config";
import { IAppFileRequest } from "../interfaces/IAppFileRequest";
import { IAppFileResponse } from "../interfaces/IAppFileResponse";
import { IAppStoredFileResponse } from "../interfaces/IAppStoredFileResponse";

class SaveService extends BaseHttpService {
    constructor() {
        super(() => ({
            config: () => ({
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': AUTH.DEFAULT_AUTHORIZATION_TOKEN()
                },
            }),
            catch: (error) => {
                return error
            }
        }))
    }

    public async add(data: IAppFileRequest) {
        const result = this.post<IBaseHttpResponseApi<IAppFileResponse>>({ api: env, href: "/upload-file" }, data)
        return result;
    }

    public async update(data: IAppFileRequest, id: number) {
        const result = this.put<IBaseHttpResponseApi<IAppFileResponse>>({ api: env, href: "/update-file", params: { id: id } }, data)

        return result;
    }

    public async remove(params: any) {
        const result = this.delete({ api: env, href: "/delete-file", params: params })
        return result;
    }

    public async removeStoredFile(params: any) {
        const result = this.delete({ api: env, href: "/delete-stored-file", params: params })
        return result;
    }

    public async getAll() {
        const response = await this.get<IBaseHttpResponseApi<IAppFileResponse[]>>({ api: env, href: "/get-files" })

        return response
    }

    public async getFileById(params: any) {
        const response = await this.get<IBaseHttpResponseApi<IAppFileResponse>>({ api: env, href: "/get-file-by-id", params: params })

        return response
    }

    public async getStoredFiles(params: any) {
        const response = await this.get<IBaseHttpResponseApi<IAppStoredFileResponse[]>>({ api: env, href: "/get-stored-files", params: params })

        return response
    }

    public async download(params: any, name: string) {
        console.log("Downloading file with params:", params);

        try {
            // Generate signed URL through authenticated endpoint
            const response = await this.get<IBaseHttpResponseApi<string>>({
                api: env,
                href: "/generate-download-url",
                params: params
            })

            if (!response || !response.data) {
                throw new Error("Failed to generate download URL")
            }

            // Trigger browser native download using signed URL (no auth headers needed)
            window.location.href = response.data
        } catch (error) {
            console.error("Download error:", error)
            throw error
        }
    }

    public async deleteSoftDeletedItems() {
        const response = this.delete<IBaseHttpResponseApi<any>>({ api: env, href: "/delete-soft-deleted-items" })
        return response
    }
}

export const saveService = new SaveService();

