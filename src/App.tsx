import './App.css';
import "react-base-components/styles.css";
import Login from './pages/shared/login/login';
import Signup from './pages/shared/signup/signup';
import UserRouter from './routes/user-router';
import { ToastContainer } from 'react-toastify';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { AuthProvider, IAuthContextType, BaseContext, BaseProvider } from 'react-toolkit';
import { loginService } from './services/login-service';
import { AUTH } from './config/auth-config';
import { AuthenticationService } from 'typescript-toolkit'
import { PageProvider } from './contexts/page-context';
import { installSessionInterceptors, refreshSession } from './services/session-service';

function App() {
  const token = Cookies.get('token');
  const permissions = Cookies.get('claims');
  // The session lasts as long as the refresh token; the access token is renewed from it. Capped:
  // setTimeout (used by validateSession) fires at once for delays over 2^31-1 ms (~24.8 days).
  const sessionEnd = Date.parse(Cookies.get("refreshTokenExpirationDateTime") ?? Cookies.get("expectedExpirationTokenDateTime") ?? "")
  const expirationDate: any = isNaN(sessionEnd) ? undefined : new Date(Math.min(sessionEnd, Date.now() + 2147483647))

  installSessionInterceptors(() => {
    window.location.href = '/login'
  })

  function onInit(props: IAuthContextType) {
    AuthenticationService.validateSession(
      token,
      window.location.pathname,
      expirationDate,
      AUTH.DISABLE_AUTH,
      AUTH.AUTHORIZE_NOT_REQUIRED,
      (event: string) => {
        if (AUTH.DISABLE_AUTH) {
          props.setIsAuthenticated?.(true)
        }

        if (event == "logout") {
          if (!Cookies.get("refreshToken")) {
            loginService.logout()

            props.setIsAuthenticated?.(false)
            props.setPermissions?.(null)

            return false
          }

          // Expiry reached: a valid refresh token still keeps the session going.
          refreshSession().then(newToken => {
            if (!newToken) {
              loginService.logout()

              props.setIsAuthenticated?.(false)
              props.setPermissions?.(null)
            }
          })

          return true
        }

        if (event == "not-required") {
          return true
        }

        if (event == "authenticate") {
          return true
        }
      })
  }

  return (
    <Router>
      <BaseProvider>
        <PageProvider>
          <AuthProvider
            claims={JSON.parse(permissions ?? '[]')}
            token={token ?? null}
            onInit={onInit}
          >
            <ToastContainer
              // position="bottom-center"
              autoClose={2000}
              hideProgressBar
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              // limit={3}
              stacked
            />
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route path="/*" element={<UserRouter />} />
            </Routes>
          </AuthProvider>
        </PageProvider>
      </BaseProvider>
    </Router>
  );
}

export default App;
