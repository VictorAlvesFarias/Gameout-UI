import axios from "axios";
import { env } from "../environment";
import { BaseHttpService, catchErrors } from "typescript-toolkit";
import Cookies from "js-cookie";
import { saveSession, signOut } from "./session-service";

class LoginService extends BaseHttpService {
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

  public async loginPost(data: { accessKey: string; password: string; }) {
    const result = this.post<any>({ api: env, href: "/sign-in", params: {} }, {
      accessKey: data.accessKey,
      password: data.password
    }).then(({ data }) => {
      // Cookies last as long as the refresh token: the access token is renewed from it.
      saveSession(data)

      Cookies.set("type", "web")

      return data
    })

    return result;
  }
  public logout() {
    // Revokes the refresh token on the API and clears the cookies.
    void signOut().finally(() => {
      window.location.href = '/login'
    })
  }
}

const loginService = new LoginService()

export {
  LoginService,
  loginService
}
