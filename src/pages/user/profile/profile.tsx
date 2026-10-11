import React, { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle, User, Mail, Lock } from 'lucide-react'
import Button from '../../../components/button'
import InputRoot from '../../../components/input-root'
import { useQuery } from 'react-toolkit'
import Label from '../../../components/label'
import InputText from '../../../components/input-text'
import Section from '../../../components/section'
import { userService, IUser, IUpdateUserRequest } from '../../../services/user-service'
import Span from '../../../components/span'
import Form from '../../../components/form'
import { toast } from 'react-toastify'
import { ModalClose, ModalContext, If } from 'react-base-components'
import ModalRoot from '../../../components/modal-root'
import Div from '../../../components/div'
import { usePageContext } from '../../../contexts/page-context';


function Profile() {
  const { setContextPage } = usePageContext();
  const [allRequestsResolved, setQueries] = useQuery(true)
  const [user, setUser] = useState<IUser | null>(null)
  const modalRef = useRef<any>(null)

  const profileSchema = z
    .object({
      name: z.string().nonempty('Required'),
      username: z.string().nonempty('Required'),
      email: z.string().nonempty('Required').email('Invalid E-Mail'),
    })

  const passwordSchema = z
    .object({
      currentPassword: z.string().nonempty('Required'),
      newPassword: z.string().nonempty('Required'),
      confirmPassword: z.string().nonempty('Required'),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    })

  const { register: registerProfile, formState: formStateProfile, handleSubmit: handleSubmitProfile, reset: resetProfile } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  })

  const { register: registerPassword, formState: formStatePassword, handleSubmit: handleSubmitPassword, reset: resetPassword } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })

  function handleGetUser() {
    return userService.getCurrentUser().then((response) => {
      const userData = response.data
      setUser(userData)
      resetProfile({
        name: userData.name,
        username: userData.username,
        email: userData.email,
      })
    })
  }

  function handleUpdateProfile(data: any) {
    const updateData: IUpdateUserRequest = {
      name: data.name,
      username: data.username,
      email: data.email,
    }

    return userService.updateUser(updateData).then(() => {
      toast.success('Profile updated successfully!')
      handleGetUser()
    }).catch(() => {
      toast.error('Failed to update profile')
    })
  }

  function handleChangePassword(data: any) {
    return userService
      .changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      })
      .then(() => {
        toast.success('Password changed successfully!')
        resetPassword()
      })
  }

  useEffect(() => {
    setQueries(() => handleGetUser())
  }, [])

  useEffect(() => {
    setContextPage({ loading: !allRequestsResolved });
  }, [allRequestsResolved, setContextPage]);

  useEffect(() => {
    setContextPage({ pageTitle: 'Profile' });
  }, [setContextPage]);

  return (
    <Div variation="in-center">
      <Div variation='in-center-content' className='bg-zinc-900 bg-opacity-50'>
        <If conditional={user != null && allRequestsResolved}>
          <>
            <div className="flex flex-col items-center text-center p-6 gap-3">
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-zinc-600 to-zinc-400 flex items-center justify-center shadow-md">
                <User className="w-12 h-12 text-main-black-900" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{user?.name}</h2>
                <p className="text-zinc-400 text-sm">@{user?.username}</p>
              </div>
            </div>
            <div className='max-w-xl w-full'>
              <Form variation='default' onSubmit={handleSubmitProfile((data) => setQueries(() => handleUpdateProfile(data)))}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <InputRoot>
                    <Label>Name</Label>
                    <InputText className='w-full' placeholder="Name" {...registerProfile('name')} />
                    <Span variation="error">{formStateProfile.errors.name?.message}</Span>
                  </InputRoot>
                  <InputRoot>
                    <Label>Username</Label>
                    <InputText className='w-full' placeholder="Username" {...registerProfile('username')} />
                    <Span variation="error">{formStateProfile.errors.username?.message}</Span>
                  </InputRoot>
                  <div className='sm:col-span-2'>
                    <InputRoot >
                      <Label>Email</Label>
                      <InputText className='w-full' placeholder="Email" {...registerProfile('email')} />
                      <Span variation="error">{formStateProfile.errors.email?.message}</Span>
                    </InputRoot>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 flex-wrap gap-4">
                  <Button className='w-full' loadingComponent={<LoaderCircle className="rotating-div" />} loading={!allRequestsResolved}>
                    Save Changes
                  </Button>
                  <div onClick={() => modalRef?.current?.open(true)} className="text-sm text-zinc-400 hover:text-white cursor-pointer transition-colors">
                    Change password
                  </div>
                </div>
              </Form>
            </div>
            <ModalContext ref={modalRef}>
              <ModalRoot>
                <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white'>
                  <Form onSubmit={handleSubmitPassword((data) => setQueries(() => handleChangePassword(data)))}>
                    <h3 className="text-lg font-semibold mb-4">Change Password</h3>
                    <InputRoot>
                      <Label>Current Password</Label>
                      <InputText placeholder="Current Password" type="password" {...registerPassword('currentPassword')} />
                      <Span variation="error">{formStatePassword.errors.currentPassword?.message}</Span>
                    </InputRoot>
                    <InputRoot>
                      <Label>New Password</Label>
                      <InputText placeholder="New Password" type="password" {...registerPassword('newPassword')} />
                      <Span variation="error">{formStatePassword.errors.newPassword?.message}</Span>
                      <ul className="text-xs text-zinc-500 list-disc list-inside mt-2">
                        <li>At least one uppercase letter</li>
                        <li>One special character</li>
                        <li>At least one number</li>
                      </ul>
                    </InputRoot>
                    <InputRoot>
                      <Label>Confirm New Password</Label>
                      <InputText placeholder="Confirm Password" type="password" {...registerPassword('confirmPassword')} />
                      <Span variation="error">{formStatePassword.errors.confirmPassword?.message}</Span>
                    </InputRoot>
                    <div className="flex gap-3 mt-3">
                      <Button className='w-full' loadingComponent={<LoaderCircle className="rotating-div" />} loading={!allRequestsResolved} type="submit">
                        Save
                      </Button>
                      <ModalClose className='w-full'>
                        <Button variation="red" type="button" onClick={() => resetPassword()}>
                          Cancel
                        </Button>
                      </ModalClose>
                    </div>
                  </Form>
                </div>
              </ModalRoot>
            </ModalContext>
          </>
        </If>
      </Div>
    </Div>
  )
}

export default Profile
