import { CircleUser, SwatchBook, LucideMenu, FileText, Settings } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import { AuthContext, IAuthContextType } from "react-toolkit";
import SidebarRoot from "../components/sidebar-root";
import SidebarHref from "../components/sidebar-href";
import SidebarMenu from "../components/sidebar-menu";
import SidebarItem from "../components/sidebar-item";
import SidebarContent from "../components/sidebar-content";
import SidebarHamburguer from "../components/sidebar-hamburguer";
import { If } from "react-base-components";
import Cookies from 'js-cookie';
import { SidebarContext } from "react-base-components";
import { USER_ROUTES, ADMIN_ROUTES } from "../config/routes-config";
import { AccordionContext } from "react-base-components";
import { ModalContext } from "react-base-components"
import ModalRoot from '../components/modal-root'
import { ModalOpen } from "react-base-components"
import { ModalClose } from "react-base-components"
import Button from "../components/button";
import Home from "../pages/user/home/home";
import Logs from "../pages/user/requests-logs/logs";
import Profile from "../pages/user/profile/profile";
import Config from "../pages/user/config/config";
import Versions from "../pages/user/versions/versions";
import { AuthenticationService } from "typescript-toolkit";
import { AUTH } from "../config/auth-config";
import { loginService } from "../services/login-service";
import Div from "../components/div";
import { driverService } from "../services/driver-service";
import { usePageContext } from "../contexts/page-context";
import TitlePage from "../containers/title-page";
import LoadingContainer from "../containers/loading-container";

function UserRouters() {
  const cookies = Cookies.get();
  const navigation = useNavigate()
  // The driver reads its groups every minute, so a recent call means it is running.
  const onlineWindowMs = 3 * 60 * 1000
  const [driverLastSeen, setDriverLastSeen] = useState<Date | null | undefined>(undefined)
  const [driverStatusError, setDriverStatusError] = useState(false)

  async function checkDriverStatus() {
    try {
      const response = await driverService.getStatus()

      setDriverStatusError(!response?.data)
      setDriverLastSeen(response?.data?.lastSeen ? new Date(response.data.lastSeen) : null)
    }
    catch (error) {
      setDriverStatusError(true)
    }
  }

  function isDriverOnline() {
    return driverLastSeen != null && Date.now() - driverLastSeen.getTime() < onlineWindowMs
  }

  function getDriverStatusText() {
    if (driverStatusError) {
      return 'Driver status unavailable'
    }
    else if (driverLastSeen === undefined) {
      return 'Checking...'
    }
    else if (driverLastSeen === null) {
      return 'Driver never connected'
    }
    else if (isDriverOnline()) {
      return 'Driver is running'
    }
    else {
      return `Driver last seen ${driverLastSeen.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
    }
  }

  function getDriverStatusColor() {
    if (driverStatusError) {
      return 'text-red-400'
    }
    else if (isDriverOnline()) {
      return 'text-green-400'
    }
    else if (driverLastSeen === undefined) {
      return 'text-gray-400'
    }
    else {
      return 'text-zinc-400'
    }
  }

  useEffect(() => {
    checkDriverStatus()

    const intervalId = setInterval(() => {
      checkDriverStatus()
    }, 60000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  return (
    <SidebarContext>
      <Div variation="router-root">
        <SidebarMenu>
          <SidebarItem redirect={() => {
            navigation(USER_ROUTES.PROFILE)
            return USER_ROUTES.PROFILE
          }}>
            <div className="flex gap-3 items-start flex-col">
              <div className="flex gap-3 items-center">
                <CircleUser className="w-7 h-7"></CircleUser>
                <div>
                  <span className="overflow-auto text-ellipsis">
                    <p>
                      {cookies.name ?? "User not found"}
                    </p>
                  </span>
                  <p className={`text-xs ${getDriverStatusColor()}`}>
                    {getDriverStatusText()}
                  </p>
                </div>
              </div>
            </div>
          </SidebarItem>
          <SidebarItem redirect={() => {
            navigation(USER_ROUTES.HOME)
            return USER_ROUTES.HOME
          }}>
            <SidebarHref>Home</SidebarHref>
          </SidebarItem>
          <SidebarItem redirect={() => {
            navigation(USER_ROUTES.LOGS)
            return USER_ROUTES.LOGS
          }}>
            <SidebarHref>Logs</SidebarHref>
          </SidebarItem>
          <SidebarItem redirect={() => {
            navigation(ADMIN_ROUTES.CONFIG)
            return ADMIN_ROUTES.CONFIG
          }}>
            <SidebarHref>Config</SidebarHref>
          </SidebarItem>
          <ModalContext>
            <div className="flex-1 flex items-end w-full">
              <ModalOpen className="w-full h-fit">
                <SidebarItem unselectable disable href="" >
                  <SidebarHref >Exit </SidebarHref>
                </SidebarItem>
              </ModalOpen>
            </div>
            <ModalRoot>
              <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white'>
                <p>Are you sure you want to leave?</p>
                <div className='flex justify-between w-full mt-6 gap-3'>
                  <ModalClose callback={() => loginService.logout()} className='flex justify-between flex-1'>
                    <Button className='w-full'>Exit</Button>
                  </ModalClose>
                  <ModalClose className='flex justify-between flex-1'>
                    <Button variation='red'>Cancel</Button>
                  </ModalClose>
                </div>
              </div>
            </ModalRoot>
          </ModalContext>
        </SidebarMenu>
        <SidebarHamburguer>
          <div className=" z-30 h-12 justify-end top-0 left-0  flex w-full bg-main-black-900 px-6  items-center ">
            <LucideMenu className="w-7 h-7 text-zinc-400" />
          </div>
        </SidebarHamburguer>
        <SidebarContent>
          <div className="flex flex-col h-full w-full">
            <TitlePage />
            <div className="flex-1 overflow-auto relative">
              <LoadingContainer />
              <Routes>
                <Route path={USER_ROUTES.HOME} element={<Home />} />
                <Route path={USER_ROUTES.LOGS} element={<Logs />} />
                <Route path={USER_ROUTES.PROFILE} element={<Profile />} />
                <Route path={ADMIN_ROUTES.CONFIG} element={<Config />} />
                <Route path={USER_ROUTES.VERSIONS} element={<Versions />} />
              </Routes>
            </div>
          </div>
        </SidebarContent>
      </Div>
    </SidebarContext >
  );
}

export default UserRouters;
