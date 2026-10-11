import { env } from "../environment";
import { BaseHttpService, catchErrors, IBaseHttpResponseApi } from "typescript-toolkit";
import Cookies from "js-cookie";

class DriverService extends BaseHttpService {
  constructor() {
    super(() => ({
      config: () => ({
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Cookies.get('token') ?? ''}`
        },
      }),
      catch: (error) => {
        return error
      }
    }))
  }

  /** When the driver last called the API (UTC); null when it never connected. */
  public async getStatus() {
    const result = this.get<IBaseHttpResponseApi<{ lastSeen: string | null }>>({ api: env, href: "/driver-status", params: {} })

    return result;
  }
}

const driverService = new DriverService()

export {
  DriverService,
  driverService
}
