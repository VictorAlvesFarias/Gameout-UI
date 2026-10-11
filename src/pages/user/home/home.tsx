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
import { IAppFileRequest } from '../../../interfaces/IAppFileRequest'
import { IAppFileResponse } from '../../../interfaces/IAppFileResponse'
import { usePageContext } from '../../../contexts/page-context'

// A group only has a name and its versioning here: the folder that feeds it, and when it is sent,
// are set in the Gameout Driver of each PC.
function AppFileForm({ data }: {
  data: {
    values: IAppFileResponse
    setQuery: Function
    action: Function
    onVersions: () => void
  }
}) {
  const [changed, setChanged] = useState(false)

  const initialState = useRef({
    name: data.values.name,
    versionControl: data.values.versionControl,
    id: data.values.id
  })

  const appFileSchema = z.object({
    name: z.string().min(1),
    versionControl: z.string()
  })

  const { register, handleSubmit, watch, reset } = useForm<z.infer<typeof appFileSchema>>({
    resolver: zodResolver(appFileSchema),
    defaultValues: {
      name: data.values.name,
      versionControl: data.values.versionControl.toString()
    }
  })

  function onSubmit(formData: z.infer<typeof appFileSchema>) {
    const request: IAppFileRequest = {
      name: formData.name,
      versionControl: formData.versionControl == "true"
    }

    data.setQuery(() => data.action(request, data.values.id).then(() => {
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
      versionControl: initialState.current.versionControl.toString()
    })

    setChanged(false)
  }

  useEffect(() => {
    if (
      initialState.current.name !== watch('name') ||
      initialState.current.versionControl.toString() !== watch('versionControl')
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
          <Label>Name</Label>
          <InputText className='w-full' {...register('name')} />
        </InputRoot>
      </div>
      <div className='flex gap-3'>
        <InputRoot variation='checkbox'>
          <Checkbox data={"true"} {...register('versionControl')}>
            <Check />
          </Checkbox>
          <Label>Keep every version</Label>
        </InputRoot>
      </div>
      <p className='text-xs text-zinc-400'>
        Off, each new upload replaces the previous version.
      </p>
      <div className='flex gap-3 mt-4'>
        <Button className='w-28' type='button' onClick={data.onVersions}>Versions</Button>
        <Button className='w-28' disabled={!changed} type='submit'>Save</Button>
        {changed &&
          <Button className='w-28' variation='red' disabled={!changed} type='button' onClick={cancelChanges}>Cancel</Button>
        }
      </div>
    </form>
  )
}

// Same format as the dates of AppFileItem, right above.
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatSize(bytes?: number | null) {
  if (bytes == null) {
    return ''
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }

  return `${(bytes / 1024 / 1024).toLocaleString('en-US', { maximumFractionDigits: 1 })} MB`
}

function Home() {
  const pageContext = usePageContext()
  const navigate = useNavigate()
  const [appFiles, setAppFiles] = useState<IAppFileResponse[]>([])
  const [filter, setFilter] = useState('')
  const [allRequestsResolved, setQuery] = useQuery(false)

  const modalRefs = useRef<{ [key: number]: any }>({})
  const addModalRef = useRef<any>(null)

  const addFormSchema = z.object({
    name: z.string().nonempty("Campo obrigatório"),
    versionControl: z.string().optional()
  })

  const { handleSubmit: handleAddSubmit, formState: { errors: addErrors }, register: addRegister, reset: resetAddForm } = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
  })

  function handleAddSave(data: z.infer<typeof addFormSchema>) {
    const saveItem: IAppFileRequest = {
      name: data.name,
      versionControl: data.versionControl == "true"
    }

    setQuery(() => saveService.add(saveItem)
      .then(() => {
        toast.success('Group added. Pick its folder in the Gameout Driver.')
        resetAddForm()
        addModalRef.current?.close()
        handleGetSaves()
      })
      .catch(() => {
        toast.error('Failed to add group')
      }))
  }

  function handleGetSaves() {
    return saveService.getAll().then(e => {
      setAppFiles(e.data)
    })
  }

  function handleUpdate(data: IAppFileRequest, id: number) {
    return saveService.update(data, id).then(() => {
      toast.success('Group updated')
      handleGetSaves()
    })
  }

  function handleDeleteSave(id: number) {
    return saveService.remove({ id }).then(() => {
      toast.success('Group deleted successfully')
      handleGetSaves()
    }).catch(() => {
      toast.error('Failed to delete group')
    })
  }

  function handleNavigateToVersions(id: number) {
    navigate(`/versions/${id}`)
  }

  function handleAppFileFilter() {
    return appFiles.filter(e => e.name.toLowerCase().includes(filter.toLowerCase()))
  }

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
        <Button className='min-w-11 min-h-11' onClick={() => setQuery(() => handleGetSaves())}>
          <RefreshCcw className='h-4 w-4' />
        </Button>
        <Button className='min-w-11 min-h-11' onClick={() => addModalRef.current?.open()}>
          <Plus className='h-4 w-4' />
        </Button>
      </div>
      <ModalContext ref={addModalRef}>
        <ModalRoot>
          <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white'>
            <h3 className='text-lg font-semibold'>Add New Group</h3>
            <Form onSubmit={handleAddSubmit(handleAddSave)}>
              <InputRoot>
                <Label>Name</Label>
                <InputText {...addRegister("name")} className='w-full' placeholder='Save name' />
                <Span variation='error'>{addErrors.name?.message}</Span>
              </InputRoot>
              <InputRoot variation='checkbox'>
                <Checkbox data={"true"} {...addRegister('versionControl')}>
                  <Check />
                </Checkbox>
                <Label>Keep every version</Label>
              </InputRoot>
              <p className='text-xs text-zinc-400'>
                The folder is chosen in the Gameout Driver of each PC.
              </p>
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
                      <div className='flex flex-col gap-1'>
                        <AppFileItem
                          name={x.name}
                          createDate={x.createDate}
                          updateDate={x.updateDate}
                          processing={x.status == 2}
                          message={x.statusMessage}
                          status={x.status}
                        />
                        <span className='text-xs text-gray-400'>
                          {x.lastSyncedAt
                            ? `Last version: ${formatDate(x.lastSyncedAt)} · ${formatSize(x.lastSyncedSize)}`
                            : 'No versions yet'}
                          {x.versionControl && ' · keeps every version'}
                        </span>
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
                        Are you sure you want to delete this group and its versions?
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
                      <AppFileForm data={{
                        values: x,
                        action: handleUpdate,
                        setQuery: setQuery,
                        onVersions: () => handleNavigateToVersions(x.id)
                      }} />
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
