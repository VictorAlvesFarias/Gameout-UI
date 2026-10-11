import React, { useContext, useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate } from 'react-router-dom'
import { LoaderCircle, LockOpen, LucideCheck } from 'lucide-react'
import { AuthContext } from 'react-toolkit'
import Form from '../../../components/form';
import Button from '../../../components/button';
import InputRoot from '../../../components/input-root'
import Span from '../../../components/span'
import Label from '../../../components/label'
import InputText from '../../../components/input-text'
import Section from '../../../components/section'
import Checkbox from '../../../components/checkbox'
import { useQuery } from 'react-toolkit'
import { loginService } from '../../../services/login-service'
import Div from '../../../components/div'

interface LoginSchema {
  accessKey: string
  password: string
}

function Login() {
  const [rememberMe, setRemeberMe] = useState(localStorage.getItem("remember-me") == "true")
  const [finished, setQueries] = useQuery(true)
  const navigation = useNavigate()

  const [loading, setLoading] = useState({
    login: false
  })

  const loginSchema = z.object({
    accessKey: z.string().nonempty("Campo Obrigatório").email("E-Mail Inválido"),
    password: z.string().nonempty("Campo Obrigatório"),
  })

  const { register, control, formState, handleSubmit, watch } = useForm<LoginSchema>(
    {
      resolver: zodResolver(loginSchema),
    }
  );

  function handleSingIn(data: any) {
    setLoading({ ...loading, login: true })

    return loginService.loginPost(data)
      .then((res) => {
        navigation('/home')
      })
      .finally(() => {
        setLoading({ ...loading, login: false })
      })
  }

  function handleSetRememberMe() {
    setRemeberMe(!rememberMe)
    localStorage.setItem("remember-me", String(!rememberMe))
  }

  return (
    <Div variation='router-root'>
      <Div variation='in-center'>
        <Div variation='in-center-content'>
          <Div variation='limiter'>
            <Div variation='in-center'>
              <Div variation='in-center-content'>
                <div className='flex flex-col gap-6 items-center justify-items-center'>
                  <div className='flex gap-3 items-center mb-3'>
                    <LockOpen className='w-9 h-9 text-main-violet-500' />
                    <h1 className='font-semibold text-3xl '>Gameoutd</h1>
                  </div>
                  <div className='flex flex-col bg-main-black-800 shadow-sm rounded sm:px-9 px-6 py-9 sm:w-fit w-full'>
                    <Form onSubmit={handleSubmit((data) => setQueries(() => handleSingIn(data)))}>
                      <h1 className='font-semibold text-2xl'>Welcome</h1>
                      <InputRoot>
                        <Label>E-Mail</Label>
                        <InputText placeholder='E-Mail' {...register('accessKey')} />
                        <Span variation='error'>{formState.errors.accessKey?.message}</Span>
                      </InputRoot>
                      <InputRoot>
                        <Label>Password</Label>
                        <InputText placeholder='Password' {...register('password')} />
                        <Span variation='error'>{formState.errors.password?.message}</Span>
                      </InputRoot>
                      <div className='mt-5 w-full'>
                        <Button loadingComponent={<LoaderCircle className={"rotating-div"} />} className='w-full' loading={!finished}>
                          Login
                        </Button>
                      </div>
                      <InputRoot variation='checkbox'>
                        <Checkbox data={""} value={rememberMe.toString()} onChange={handleSetRememberMe}>
                          <LucideCheck className='w-3 h-3' />
                        </Checkbox>
                        <Label variation='row'>Keep me logged in</Label>
                      </InputRoot>
                    </Form>
                  </div>
                  <div className='flex gap-1 text-sm flex-wrap text-zinc-500 font-semibold'>
                    <p>Don't have an account?</p>
                    <Link className='text-main-violet-500 font-semibold' to={"/signup"}>Sign up here</Link>
                  </div>
                </div>
              </Div>
            </Div>
          </Div>
        </Div>
      </Div>
    </Div>
  )
}

export default Login

export {
  LoginSchema
}
