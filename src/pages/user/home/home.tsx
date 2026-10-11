import React, { useEffect, useRef, useState } from 'react'
import { Check, RefreshCcw, Trash, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import Button from '../../../components/button'
import InputRoot from '../../../components/input-root'
import InputText from '../../../components/input-text'
import Span from '../../../components/span'
import Accordion from '../../../components/accordion'
import AccordionRoot from '../../../components/accordion-root'
import AccordionTitle from '../../../components/accordion-title'
import ModalRoot from '../../../components/modal-root'
import Checkbox from '../../../components/checkbox'
import Label from '../../../components/label'
import Div from '../../../components/div'
import Form from '../../../components/form'

import { AccordionContext, ModalContext, ModalClose, If } from 'react-base-components'
import { useQuery } from 'react-toolkit'

import AppFileItem from '../../../containers/app-file-item'
import { saveService } from '../../../services/save-service'
import { webSocketService } from '../../../services/web-socket-service'
import { IAppFileRequest } from '../../../interfaces/IAppFileRequest'
import { IAppFileResponse } from '../../../interfaces/IAppFileResponse'
import { usePageContext } from '../../../contexts/page-context'

function AppFileForm({ data }: {
  data: {
    values: IAppFileResponse
    setQuery: Function
    action: Function
  }
}) {
  const [changed, setChanged] = useState(false)

  const initialState = useRef({
    name: data.values.name,
    path: data.values.path,
    versionControl: data.values.versionControl,
    observer: data.values.observer,
    autoValidateSync: data.values.autoValidateSync,
    id: data.values.id
  })

  const appFileSchema = z.object({
    name: z.string().min(1),
    path: z.string().min(1),
    versionControl: z.string(),
    observer: z.string(),
    autoValidateSync: z.string()
  })

  const { register, handleSubmit, watch, reset, formState } = useForm<z.infer<typeof appFileSchema>>({
    resolver: zodResolver(appFileSchema),
    defaultValues: {
      name: data.values.name,
      path: data.values.path,
      versionControl: data.values.versionControl.toString(),
      observer: data.values.observer.toString(),
      autoValidateSync: data.values.autoValidateSync.toString()
    }
  })

  function onSubmit(formData: z.infer<typeof appFileSchema>) {
    const request: IAppFileRequest = {
      name: formData.name,
      path: formData.path,
      versionControl: formData.versionControl == "true",
      observer: formData.observer == "true",
      autoValidateSync: formData.autoValidateSync == "true"
    }

    data.setQuery(() => data.action(request, data.values.id).then(() => {
      console.log('Saved successfully')

      setChanged(false)

      initialState.current = {
        ...request,
        id: initialState.current.id
      }
    }))
  }

  function cancelChanges() {
    reset({
      name: initialState.current.name,
      path: initialState.current.path,
      versionControl: initialState.current.versionControl.toString(),
      observer: initialState.current.observer.toString(),
      autoValidateSync: initialState.current.autoValidateSync.toString()
    })

    setChanged(false)
  }

  useEffect(() => {
    console.log(
      initialState.current.name, watch('name'),
      initialState.current.path, watch('path'),
      initialState.current.versionControl.toString(), watch('versionControl'),
      initialState.current.observer.toString(), watch('observer'),
      initialState.current.autoValidateSync.toString(), watch('autoValidateSync')
    )

    if (
      initialState.current.name !== watch('name') ||
      initialState.current.path !== watch('path') ||
      initialState.current.versionControl.toString() !== watch('versionControl') ||
      initialState.current.observer.toString() !== watch('observer') ||
      initialState.current.autoValidateSync.toString() !== watch('autoValidateSync')
    ) {
      setChanged(true)
    }
    else {
      setChanged(false)
    }
  }, [watch()])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-3'>
      <div className='flex gap-3'>
        <InputRoot>
          <Label >Name</Label>
          <InputText className='w-full' {...register('name')} />
        </InputRoot>
        <InputRoot>
          <Label>Path</Label>
          <InputText className='w-full' {...register('path')} />
        </InputRoot>
      </div>
      <div className='flex gap-3'>
        <InputRoot variation='checkbox'>
          <Checkbox data={"true"} {...register('versionControl')}>
            <Check />
          </Checkbox>
          <Label>Versions</Label>
        </InputRoot>
        <InputRoot variation='checkbox'>
          <Checkbox data={"true"} {...register('observer')}>
            <Check />
          </Checkbox>
          <Label>Observer</Label>
        </InputRoot>
        <InputRoot variation='checkbox'>
          <Checkbox data={"true"} {...register('autoValidateSync')}>
            <Check />
          </Checkbox>
          <Label>Auto Check Status</Label>
        </InputRoot>
      </div>
      <div className='grid grid-cols-2 gap-3 mt-4 w-56'>
        <Button className='w-full' disabled={!changed} type='submit' >Save</Button>
        {changed &&
          <Button className='w-full' variation='red' disabled={!changed} type='button' onClick={cancelChanges}>Cancel</Button>
        }
      </div>
    </form>
  )
}

function Home() {
  const pageContext = usePageContext()
  const navigate = useNavigate()
  const [appFiles, setAppFiles] = useState<IAppFileResponse[]>([])
  const [filter, setFilter] = useState('')
  const [allRequestsResolved, setQuery] = useQuery(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: number]: number }>({})

  const modalRefs = useRef<{ [key: number]: any }>({})
  const addModalRef = useRef<any>(null)

  const addFormSchema = z.object({
    name: z.string().nonempty("Campo obrigatório"),
    path: z.string().nonempty("Campo obrigatório")
  })

  const { handleSubmit: handleAddSubmit, formState: { errors: addErrors }, register: addRegister, reset: resetAddForm } = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
  })

  function handleAddSave(data: z.infer<typeof addFormSchema>) {
    const saveItem: IAppFileRequest = {
      name: data.name,
      observer: false,
      path: data.path,
      versionControl: false,
      autoValidateSync: false
    }

    setQuery(() => saveService.add(saveItem)
      .then(() => {
        toast.success('File added successfully')
        resetAddForm()
        addModalRef.current?.close()
        handleGetSaves()
      })
      .catch(() => {
        toast.error('Failed to add file')
      }))
  } function handleGetSaves() {
    return saveService.getAll().then(e => {
      setAppFiles(prev =>
        e.data.map(item => {
          const old = prev.find(p => p.id === item.id)
          return old ? { ...old, ...item } : item
        })
      )
    })
  }

  function handleUpdate(data: IAppFileRequest, id: number) {
    return saveService.update(data, id).then(() => {
      toast.success('Save updated')
    })
  }

  function handleDeleteSave(id: number) {
    return saveService.remove({ id }).then(() => {
      toast.success('File deleted successfully')
      handleGetSaves()
    }).catch(() => {
      toast.error('Failed to delete file')
    })
  }

  function handleNavigateToVersions(id: number) {
    navigate(`/versions/${id}`)
  }

  function handleSingleSync(idAppFile: number) {
    return saveService.singleSync({ idAppFile }).then(() => {
      toast.success('Sync started successfully')
      handleGetSaves()
    }).catch(() => {
      toast.error('Failed to start sync')
    })
  }

  function handleValidateStatus(appFileId: number) {
    return saveService.checkAppFileStatus({ appFileId })
      .then(() => {
        toast.success('Status check initiated for file')
      })
      .catch(() => {
        toast.error('Failed to check status')
      })
  }

  function handleAppFileFilter() {
    return appFiles.filter(e => e.name.includes(filter))
  }

  useEffect(() => {
    function refresh() {
      handleGetSaves()
    }

    function handleUploadProgress(data: any) {
      console.log('Upload Progress Event:', data)

      const { AppFileId, ProgressPercentage, IsComplete } = data.Body || {}

      console.log('Parsed values:', { AppFileId, ProgressPercentage, IsComplete })

      if (AppFileId === undefined || ProgressPercentage === undefined) {
        console.warn('Missing required data')

        return
      }

      setUploadProgress(prev => {
        const updated = {
          ...prev,
          [AppFileId]: ProgressPercentage
        }
        console.log('Updated progress state:', updated)
        return updated
      })

      if (IsComplete) {
        console.log('Upload completed for AppFileId:', AppFileId)

        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[AppFileId]
            console.log('Cleared progress for AppFileId:', AppFileId)
            return newProgress
          })
        }, 2000)
      }
    }

    webSocketService.on('NewsFilesRequestPing', refresh)
    webSocketService.on('AppFileUpdatedPing', refresh)
    webSocketService.on('AppFileStatusUpdatePing', refresh)
    webSocketService.on('AppFileUploadProgress', handleUploadProgress)

    return () => {
      webSocketService.off('NewsFilesRequestPing', refresh)
      webSocketService.off('AppFileUpdatedPing', refresh)
      webSocketService.off('AppFileStatusUpdatePing', refresh)
      webSocketService.off('AppFileUploadProgress', handleUploadProgress)
    }
  }, [])

  useEffect(() => {
    pageContext.setContextPage({ pageTitle: 'Home' })
  }, [pageContext.setContextPage])

  useEffect(() => {
    pageContext.setContextPage({ loading: !allRequestsResolved });
  }, [allRequestsResolved, pageContext.setContextPage]);

  useEffect(() => {
    setQuery(() => handleGetSaves())
  }, [])

  return (
    <Div variation='in-start' className='bg-zinc-900 bg-opacity-50'>
      <div className='flex gap-3 items-center'>
        <InputText
          type='text'
          placeholder='Search saves'
          variation='ultra-rounded'
          onChange={e => setFilter(e.target.value)}
        />
        <div className='flex-1'></div>
        <Button className='min-w-11 min-h-11' onClick={handleGetSaves}>
          <RefreshCcw className='h-4 w-4' />
        </Button>
        <Button className='min-w-11 min-h-11' onClick={() => addModalRef.current?.open()}>
          <Plus className='h-4 w-4' />
        </Button>
      </div>
      <ModalContext ref={addModalRef}>
        <ModalRoot>
          <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white'>
            <h3 className='text-lg font-semibold'>Add New Save</h3>
            <Form onSubmit={handleAddSubmit(handleAddSave)}>
              <InputRoot>
                <Label>Name</Label>
                <InputText {...addRegister("name")} className='w-full' placeholder='Save name' />
                <Span variation='error'>{addErrors.name?.message}</Span>
              </InputRoot>
              <InputRoot>
                <Label>Path</Label>
                <InputText {...addRegister("path")} className='w-full' placeholder='Save path' />
                <Span variation='error'>{addErrors.path?.message}</Span>
              </InputRoot>
              <div className='flex justify-between w-full mt-6 gap-3'>
                <Button type='submit' className='flex-1'>Save</Button>
                <ModalClose className='flex-1'>
                  <Button type='button' variation='red' className='w-full'>Cancel</Button>
                </ModalClose>
              </div>
            </Form>
          </div>
        </ModalRoot>
      </ModalContext>
      <If conditional={handleAppFileFilter().length === 0 && allRequestsResolved}>
        <div className='h-full w-full items-center justify-center flex text-white'>
          <Span>Results not found</Span>
        </div>
      </If>
      <If conditional={handleAppFileFilter().length > 0}>
        {handleAppFileFilter().map(x => (
          <div key={x.id} className='pt-6 rounded flex flex-col relative gap-3'>
            <AccordionContext>
              <AccordionRoot>
                <Div variation='accordion-title-root'>
                  <AccordionTitle>
                    <Div variation='accordion-content'>
                      <div className='flex flex-col gap-3'>
                        <AppFileItem
                          name={x.name}
                          createDate={x.createDate}
                          updateDate={x.updateDate}
                          processing={false}
                          message={x.statusMessage}
                          status={x.status}
                        />
                        {x.status == 2 && (
                          <div className='w-full flex flex-col gap-2'>
                            <div className='flex justify-between text-xs text-zinc-400'>
                              {uploadProgress[x.id] > 0 ? <span>Fazendo upload</span> : <span>Buscando informações</span>}
                              {uploadProgress[x.id] > 0 && <span>{uploadProgress[x.id]}%</span>}
                            </div>
                            <div className='w-full bg-zinc-700 rounded-full h-2'>
                              <div
                                aria-busy={uploadProgress[x.id] == null}
                                className='bg-blue-500 h-2 rounded-full transition-all duration-300 aria-busy:animate-pulse aria-busy:bg-gray-300'
                                style={{ width: `${uploadProgress[x.id]}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </Div>
                  </AccordionTitle>
                  <Span
                    variation='default-accordion-button'
                    onClick={() => modalRefs.current[x.id]?.open()}
                  >
                    <Trash className='h-5 w-5 text-zinc-500 hover:text-red-500 transition-all' />
                  </Span>
                </Div>
                <ModalContext ref={el => (modalRefs.current[x.id] = el)}>
                  <ModalRoot>
                    <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white'>
                      <h3 className='text-lg font-semibold'>Confirm Deletion</h3>
                      <p className='text-sm text-gray-300'>
                        Are you sure you want to delete this file?
                      </p>
                      <div className='flex justify-between w-full mt-6 gap-3'>
                        <ModalClose callback={() => setQuery(() => handleDeleteSave(x.id))} className='flex-1'>
                          <Button className='w-full' variation='red'>Yes, Delete</Button>
                        </ModalClose>
                        <ModalClose className='flex-1'>
                          <Button className='w-full'>Cancel</Button>
                        </ModalClose>
                      </div>
                    </div>
                  </ModalRoot>
                </ModalContext>
                <Accordion>
                  <Div variation='accordion-content'>
                    <div className='w-full flex flex-col'>
                      <Span className='w-full' variation='divisor'>Settings</Span>
                      <AppFileForm data={{
                        values: x,
                        action: handleUpdate,
                        setQuery: setQuery
                      }} />
                    </div>
                    <div className='w-full flex flex-col'>
                      <Span className='w-full' variation='divisor'>Actions</Span>
                      <div className='grid grid-cols-3 gap-3 md:grid flex-wrap w-96'>
                        <Button onClick={() => handleValidateStatus(x.id)} >
                          Check status
                        </Button>
                        <Button onClick={() => handleNavigateToVersions(x.id)} >
                          Versions
                        </Button>
                        <Button onClick={() => handleSingleSync(x.id)} >
                          Sync
                        </Button>
                      </div>
                    </div>
                  </Div>
                </Accordion>
              </AccordionRoot>
            </AccordionContext>
          </div>
        ))}
      </If>
    </Div>
  )
}

export default Home
