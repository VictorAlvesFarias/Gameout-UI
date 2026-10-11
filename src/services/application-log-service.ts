import { BaseHttpService, catchErrors, IBaseHttpResponseApi } from "typescript-toolkit";
import { env } from "../environment";
import { AUTH } from "../config/auth-config";

interface IApplicationLog {
    id: number;
    message: string;
    details?: string;
    traceId: number;
    type: string; // Code, Exception, Json, Message, etc
    action: string; // Error, Warning, Success, Info, etc
    createDate: string;
    updateDate: string;
    userId: string;
}

export interface IPage<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
}

interface ITrace {
    id: number;
    name: string;
    description: string;
    createDate: string;
    updateDate: string;
    userId: string;
    logsCount: number;
}

interface ITraceWithLogs extends ITrace {
    logs: IApplicationLog[];
}

interface IContextTrace {
    id: number;
    traceId: number;
    entityName: string;
    entityId: string;
}

class ApplicationLogService extends BaseHttpService {
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

    public async getLogsByTraceId(traceId: number) {
        try {
            const response = await this.get<IBaseHttpResponseApi<IApplicationLog[]>>({
                api: env,
                href: `/api/application-log/trace/${traceId}`
            });
            console.log('getLogsByTraceId raw response:', response);
            return response;
        } catch (error) {
            console.error('getLogsByTraceId error:', error);
            throw error;
        }
    }

    public async getTracesByEntity(entityName: string, entityId: string) {
        try {
            const response = await this.get<IBaseHttpResponseApi<ITrace[]>>({
                api: env,
                href: `/api/application-log/entity/${entityName}/${entityId}`
            });
            console.log('getTracesByEntity raw response:', response);
            return response;
        } catch (error) {
            console.error('getTracesByEntity error:', error);
            throw error;
        }
    }

    /** One page of the application log; the search runs on the server (message, details or trace id). */
    public async getLogs(page: number = 1, pageSize: number = 50, searchInput: string = '') {
        const response = await this.get<IBaseHttpResponseApi<IPage<IApplicationLog>>>({
            api: env,
            href: `/api/application-log/traces`,
            params: { page, pageSize, searchInput }
        });
        return response;
    }

    public async clearAllLogs() {
        const response = this.delete<IBaseHttpResponseApi<any>>({
            api: env,
            href: `/api/application-log/clear`
        });
        return response;
    }
}

const applicationLogService = new ApplicationLogService();

export {
    ApplicationLogService,
    applicationLogService,
    IApplicationLog,
    ITrace,
    ITraceWithLogs,
    IContextTrace
};

