import React, { useEffect, useState, useRef } from 'react'
import { Trash } from 'lucide-react';
import Button from '../../../components/button';
import InputText from '../../../components/input-text';
import Span from '../../../components/span';
import Accordion from "../../../components/accordion";
import AccordionRoot from '../../../components/accordion-root';
import AccordionTitle from '../../../components/accordion-title';
import { AccordionContext, ModalContext, ModalClose, If } from "react-base-components";
import ModalRoot from '../../../components/modal-root';
import { useQuery } from "react-toolkit";
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Div from '../../../components/div';
import { saveService } from '../../../services/save-service';
import { IAppStoredFileResponse } from '../../../interfaces/IAppStoredFileResponse';
import { usePageContext } from '../../../contexts/page-context';
import { USER_ROUTES } from '../../../config/routes-config';

function Versions() {
    const { setContextPage } = usePageContext();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [storedFiles, setStoredFiles] = useState<IAppStoredFileResponse[]>([])
    const [filter, setFilter] = useState<string>("")
    const [allRequestsResolved, setQuery] = useQuery(false)
    const [appFileName, setAppFileName] = useState<string>('')
    const [appFile, setAppFile] = useState<any>(null)
    const modalRefs = useRef<{ [key: number]: any }>({});

    function handleFilter(e: any) {
        setFilter(e.target.value)
    }

    function handleStoredFileFilter() {
        if (!filter) return storedFiles ?? [];

        return storedFiles?.filter(e => {
            const dateStr = new Date(e.updateDate).toLocaleString('pt-BR').replace(",", " - ");
            return dateStr.toLowerCase().includes(filter.toLowerCase());
        }) ?? []
    }

    function handleGetStoredFiles() {
        if (!id) {
            return Promise.resolve();
        }

        const idAppFile = parseInt(id);

        return Promise.all([
            saveService.getStoredFiles({ idAppFile }).then(e => {
                setStoredFiles(e.data)
            }),
            saveService.getFileById({ id: idAppFile }).then(e => {
                setAppFile(e.data);
                setAppFileName(e.data.name);
            })
        ]);
    }

    function handleDeleteStoredFile(storedFileId: number) {
        return saveService.removeStoredFile({ id: storedFileId }).then(() => {
            toast.success('Version deleted successfully');
            handleGetStoredFiles();
        }).catch(() => {
            toast.error('Failed to delete version')
        })
    }

    function handleDownload(storedFileId: number) {
        const appStoredFile = storedFiles.find(e => e.id === storedFileId)

        if (!appStoredFile || !appFile) {
            return
        }

        const date = new Date(appStoredFile.updateDate);
        const formattedDate = date.toISOString().split('T')[0].replace(/-/g, '');
        const formattedTime = date.toTimeString().split(' ')[0].replace(/:/g, '');
        const fileName = `${appFile.name}_${formattedDate}_${formattedTime}.zip`;

        saveService.download({ id: storedFileId }, fileName)
            .then(() => {
                toast.success('Download started')
            })
            .catch(() => {
                toast.error('Failed to download file')
            })
    }

    function handleSingleSync() {
        if (!id) {
            return;
        }

        const idAppFile = parseInt(id);

        return saveService.singleSync({ idAppFile }).then(() => {
            toast.success('Sync started successfully');
            navigate(USER_ROUTES.HOME);
        }).catch(() => {
            toast.error('Failed to start sync')
        })
    }

    function handleGoBack() {
        navigate(USER_ROUTES.HOME);
    }

    function getStatusInfo(status: number) {
        switch (status) {
            case 1: // Error
                return { label: 'Error', color: 'text-red-500', bgColor: 'bg-red-500/10' };
            case 2: // Uploading
                return { label: 'Uploading', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' };
            case 3: // Complete
                return { label: 'Complete', color: 'text-green-500', bgColor: 'bg-green-500/10' };
            default:
                return { label: 'Unknown', color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
        }
    }

    useEffect(() => {
        if (appFileName == "" || appFileName == null) {
            setContextPage({ pageTitle: `Versions` });
        }
        else {
            setContextPage({ pageTitle: `Versions - ${appFileName}` });
        }
    }, [setContextPage, appFileName]);

    useEffect(() => {
        setQuery(() => handleGetStoredFiles())
    }, [id])

    useEffect(() => {
        setContextPage({ loading: !allRequestsResolved });
    }, [allRequestsResolved, setContextPage]);

    return (
        <Div variation='in-start' className='bg-zinc-900 bg-opacity-50'>
            <div className='flex gap-3 items-center'>
                <InputText onChange={handleFilter} type="text" placeholder='Filter by date' variation='ultra-rounded' />
                <div className='flex-1 justify-end flex gap-3'>
                    <Button onClick={handleGoBack} variation='default'>
                        Back
                    </Button>
                    <Button onClick={handleSingleSync} variation='default'>
                        Sync
                    </Button>
                </div>
            </div>
            <If conditional={handleStoredFileFilter().length === 0 && allRequestsResolved}>
                <div className='h-full w-full items-center justify-center flex flex-col gap-4 text-white'>
                    <Span className='text-lg'>No versions found</Span>
                    <Span className='text-sm text-gray-400'>This file hasn't been synced yet. Click "Sync" to create the first version.</Span>
                </div>
            </If>
            <If conditional={handleStoredFileFilter().length > 0}>
                {
                    handleStoredFileFilter().map((x, i: any) =>
                        <div key={x.id} className='pt-6 rounded flex flex-col relative gap-3'>
                            <AccordionContext>
                                <AccordionRoot>
                                    <Div variation='accordion-title-root'>
                                        <AccordionTitle>
                                            <Div variation='accordion-content'>
                                                <div className='flex flex-col gap-2'>
                                                    <div className='flex gap-3 items-center'>
                                                        <p className='font-bold'>Status:</p>
                                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusInfo(x.status).bgColor} ${getStatusInfo(x.status).color}`}>
                                                            {getStatusInfo(x.status).label}
                                                        </span>
                                                    </div>
                                                    <div className='flex gap-3'>
                                                        <p className='font-bold'>Version:</p>
                                                        <p>
                                                            {i === 0 ? "Latest" : i.toString()}
                                                        </p>
                                                    </div>
                                                    <div className='flex gap-3'>
                                                        <p className='font-bold'>Date:</p>
                                                        <p>{new Date(x.updateDate).toLocaleString('pt-BR').replace(",", " - ")}</p>
                                                    </div>
                                                    <div className='flex gap-3'>
                                                        <p className='font-bold'>Size:</p>
                                                        <p>{x.sizeInBytes}</p>
                                                    </div>
                                                </div>
                                            </Div>
                                        </AccordionTitle>
                                        <Span variation='default-accordion-button' onClick={() => modalRefs.current[x.id]?.open()}>
                                            <Trash className='h-5 w-5 text-zinc-500 hover:text-red-500 transition-all' />
                                        </Span>
                                    </Div>
                                    <ModalContext ref={(el) => (modalRefs.current[x.id] = el)}>
                                        <ModalRoot>
                                            <div className='shadow-lg p-6 bg-main-black-800 flex flex-col gap-3 rounded text-white'>
                                                <h3 className='text-lg font-semibold'>Confirm Deletion</h3>
                                                <p className='text-sm text-gray-300'>
                                                    Are you sure you want to delete this version? This action cannot be undone.
                                                </p>
                                                <div className='flex justify-between w-full mt-6 gap-3'>
                                                    <ModalClose callback={() => setQuery(() => handleDeleteStoredFile(x.id))} className='flex justify-between flex-1'>
                                                        <Button className='w-full' variation="red">Yes, Delete</Button>
                                                    </ModalClose>
                                                    <ModalClose className='flex justify-between flex-1'>
                                                        <Button className='w-full'>Cancel</Button>
                                                    </ModalClose>
                                                </div>
                                            </div>
                                        </ModalRoot>
                                    </ModalContext>
                                    <Accordion>
                                        <Div variation='accordion-content'>
                                            <div className='w-fit'>
                                                <Button 
                                                    onClick={() => handleDownload(x.id)} 
                                                    disabled={x.status !== 3}
                                                    className={x.status !== 3 ? 'opacity-50 cursor-not-allowed' : ''}
                                                >
                                                    Download
                                                </Button>
                                            </div>
                                        </Div>
                                    </Accordion>
                                </AccordionRoot>
                            </AccordionContext>
                        </div>
                    )
                }
            </If>
        </Div>
    )
}

export default Versions
