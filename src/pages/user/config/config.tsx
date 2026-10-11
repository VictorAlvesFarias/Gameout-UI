import React, { useEffect, useState } from 'react'
import { Key, Copy, Check, RefreshCcw, Trash2, Settings } from 'lucide-react'
import Button from '../../../components/button'
import Div from '../../../components/div'
import Span from '../../../components/span'
import { apiKeyService } from '../../../services/api-key-service'
import { saveService } from '../../../services/save-service'
import { useQuery } from 'react-toolkit'
import { toast } from 'react-toastify'
import { ModalContext, ModalOpen, ModalClose, If } from 'react-base-components'
import ModalRoot from '../../../components/modal-root'
import { usePageContext } from '../../../contexts/page-context';

function Config() {
    const pageContext = usePageContext();
    const [apiKey, setApiKey] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [finished, setQuery] = useQuery(false)

    function handleGenerateApiKey() {
        setQuery(() => apiKeyService.generateApiKey().then((response) => {
            if (response.data) {
                setApiKey(response.data)
                toast.info('🔑 New key generated! Remember to update the Driver appsettings.json file')
            }
        }).catch(() => {
            toast.error('Failed to generate API key')
        }))
    }

    function handleGetCurrentApiKey() {
        return apiKeyService.getCurrentApiKey().then((response) => {
            if (response.data) {
                setApiKey(response.data)
            }
        }).catch(() => {
            toast.error('Failed to load API key')
        })
    }

    function handleCopyToClipboard() {
        if (apiKey) {
            navigator.clipboard.writeText(apiKey)
            setCopied(true)
            toast.success('✅ API Key copied to clipboard')
            setTimeout(() => setCopied(false), 2000)
        }
    }

    function handleDeleteSoftDeletedItems() {
        setQuery(() => saveService.deleteSoftDeletedItems().then(() => {
            toast.success('Trash emptied successfully!')
        }).catch(() => {
            toast.error('Failed to empty trash')
        }))
    }

    useEffect(() => {
        setQuery(() => handleGetCurrentApiKey())
    }, [])

    useEffect(() => {
        pageContext.setContextPage({ pageTitle: 'Config' });
    }, [pageContext.setContextPage]);

    useEffect(() => {
        pageContext.setContextPage({ loading: !finished });
    }, [finished, pageContext.setContextPage]);


    return (
        <Div variation="in-center">
            <Div variation='in-center-content' className='bg-zinc-900 bg-opacity-50'>
                <If conditional={finished}>
                    <div className='max-w-xl gap-9 flex flex-col p-6'>
                        <div className='flex items-center gap-3'>
                            <Settings className='h-5 w-5 text-zinc-400' />
                            <h3 className='text-lg font-semibold text-zinc-300'>Settings</h3>
                        </div>
                        <div className='flex border-b border-zinc-700 '></div>
                        <div className="gap-6 flex flex-col">
                            <label className='text-sm font-semibold text-gray-300 block'>
                                Driver API Key
                            </label>
                            <p className='text-sm text-gray-400'>
                                This unique key authenticates your Driver application with the backend system. It ensures secure communication and prevents unauthorized access. Keep this key private and update it in your Driver's configuration file whenever you generate a new one.
                            </p>
                            <div className='flex items-center gap-2'>
                                <div className='flex-1 bg-zinc-800 rounded p-3 items-center flex border border-zinc-700'>
                                    <code className='text-sm text-gray-300 break-all'>
                                        {apiKey || 'No API Key configured'}
                                    </code>
                                </div>
                                <Button
                                    className='min-w-11 min-h-11'
                                    onClick={handleGenerateApiKey}
                                >
                                    <RefreshCcw className='h-4 w-4' />
                                </Button>
                                <Button
                                    className='min-w-11 min-h-11'
                                    onClick={handleCopyToClipboard}
                                >
                                    {copied ? (
                                        <Check className='h-4 w-4' />
                                    ) : (
                                        <Copy className='h-4 w-4' />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className='flex border-b border-zinc-700 '></div>
                        <div className="gap-6 flex flex-col">
                            <label className='text-sm font-semibold text-gray-300 block'>
                                Empty Trash
                            </label>
                            <p className='text-sm text-gray-400'>
                                When you delete files in the system, they aren't immediately removed from the database.
                                Instead, they're marked as "deleted" and remain in the trash.
                                Use this button to empty the trash and permanently free up space.
                            </p>
                            <ModalContext>
                                <ModalOpen>
                                    <Button variation='red'>
                                        <Trash2 className='h-4 w-4 mr-2' />
                                        <Span>Empty Trash</Span>
                                    </Button>
                                </ModalOpen>
                                <ModalRoot>
                                    <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white'>
                                        <h3 className='text-lg font-semibold'>Confirm Permanent Deletion</h3>
                                        <p className='text-sm text-gray-300'>
                                            You are about to empty the trash. All files, versions, and data that were previously deleted will be permanently removed from the database.
                                        </p>
                                        <div className='flex justify-between w-full mt-6 gap-3'>
                                            <ModalClose callback={handleDeleteSoftDeletedItems} className='flex justify-between flex-1'>
                                                <Button variation="red">Yes, Empty Trash</Button>
                                            </ModalClose>
                                            <ModalClose className='flex justify-between flex-1'>
                                                <Button className='w-full'>Cancel</Button>
                                            </ModalClose>
                                        </div>
                                    </div>
                                </ModalRoot>
                            </ModalContext>
                        </div>
                    </div>
                </If>
            </Div>
        </Div>
    )
}

export default Config
