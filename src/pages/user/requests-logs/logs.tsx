import React, { useEffect, useState } from 'react';
import { Clock, Trash2, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../../../components/button';
import Span from '../../../components/span';
import Accordion from '../../../components/accordion';
import AccordionRoot from '../../../components/accordion-root';
import AccordionTitle from '../../../components/accordion-title';
import { AccordionContext, If } from 'react-base-components';
import { useQuery } from 'react-toolkit';
import InputText from '../../../components/input-text';
import Div from '../../../components/div';
import { applicationLogService, } from '../../../services/application-log-service';
import { usePageContext } from '../../../contexts/page-context';
import { toast } from 'react-toastify';

const pageSize = 50;

function Logs() {
  const { setContextPage } = usePageContext();
  const [logs, setLogs] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [allRequestsResolved, setQuery] = useQuery(false);
  const [filter, setFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const pages = Math.max(1, Math.ceil(totalCount / pageSize));

  function handleFilter(e: any) {
    setFilter(e.target.value);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(filter.trim());
  }

  function handleGetLogs() {
    return applicationLogService.getLogs(page, pageSize, search).then(response => {
      setLogs(response.data?.items ?? []);
      setTotalCount(response.data?.totalCount ?? 0);
    });
  }

  async function handleClearLogs() {
    setQuery(() =>
      applicationLogService.clearAllLogs().then(() => {
        toast.success('Logs cleared successfully')
        setPage(1)
        return handleGetLogs()
      }).catch(() => {
        toast.error('Failed to clear logs')
      })
    );
  }

  function getActionTypeColor(type: string): string {
    switch (type) {
      case "Success":
        return 'text-green-400';
      case "Error":
        return 'text-red-400';
      case "Info":
        return 'text-blue-400';
      case "Warning":
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  useEffect(() => {
    setQuery(() => handleGetLogs());
  }, [page, search]);

  useEffect(() => {
    setContextPage({ loading: !allRequestsResolved });
  }, [allRequestsResolved]);

  useEffect(() => {
    setContextPage({ pageTitle: 'Logs' });
  }, []);

  return (
    <Div variation='in-start' className=' bg-zinc-900 bg-opacity-50 '>
      <div className='flex gap-3 items-center mb-4'>
        <form onSubmit={handleSearch} className='flex gap-3 items-center'>
          <InputText onChange={handleFilter} type="text" placeholder='Search message, details or trace id' variation='ultra-rounded' />
        </form>
        <span className='text-xs text-zinc-400'>{totalCount} log(s)</span>
        <div className='flex gap-3 flex-1 justify-end'>
          <div className='w-11 h-11'>
            <Button onClick={() => setQuery(() => handleGetLogs())} className='w-full'>
              <RefreshCcw className='h-4 w-4' />
            </Button>
          </div>
          <div className='w-11 h-11'>
            <Button variation='red' onClick={handleClearLogs}>
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      <If conditional={allRequestsResolved}>
        <If conditional={logs.length === 0}>
          <div className='h-full w-full items-center justify-center flex text-white'>
            <div className='h-full w-full items-center justify-center flex text-white'>
              <Span>Results not found</Span>
            </div>
          </div>
        </If>
        <If conditional={logs.length > 0}>
          <div className='space-y-3'>
            {logs.map(log => (
              <div key={log.id} className='pt-3 rounded flex flex-col relative gap-3'>
                <AccordionContext>
                  <AccordionRoot>
                    <Div variation='accordion-title-root'>
                      <AccordionTitle>
                        <div className='py-5 px-6 flex justify-between w-full items-center'>
                          <div className='flex items-center gap-3'>
                            <Clock className='h-4 w-4 text-gray-400' />
                            <span className={`font-semibold ${getActionTypeColor(log.action)}`}>
                              {log.message}
                            </span>
                          </div>
                          <div className='text-xs text-gray-400'>
                            {formatDate(log.createDate)} - Trace ID: {log.traceId}
                          </div>
                        </div>
                      </AccordionTitle>
                    </Div>
                    <Accordion>
                      <Div variation='accordion-content'>
                        <Div variation='accordion-content-grid'>
                          <div>
                            <span className='text-sm font-semibold text-gray-300'>Trace ID:</span>
                            <p className='text-sm text-white mt-1'>{log.traceId}</p>
                          </div>
                          <div>
                            <span className='text-sm font-semibold text-gray-300'>Action:</span>
                            <p className='text-sm text-white mt-1 break-all'>{log.action}</p>
                          </div>
                          <div>
                            <span className='text-sm font-semibold text-gray-300'>Created:</span>
                            <p className='text-sm text-white mt-1'>{formatDate(log.createDate)}</p>
                          </div>
                          <div>
                            <span className='text-sm font-semibold text-gray-300'>Updated:</span>
                            <p className='text-sm text-white mt-1'>{formatDate(log.updateDate)}</p>
                          </div>
                          <div>
                            <span className='text-sm font-semibold text-gray-300'>User ID:</span>
                            <p className='text-sm text-white mt-1'>{log.userId}</p>
                          </div>
                          {
                            log.details &&
                            <div className='col-span-2'>
                              <span className='text-sm font-semibold'>Details:</span>
                              <p className='text-sm text-white mt-1 overflow-auto text-wrap p-3 rounded bg-zinc-900'>{log.details}</p>
                            </div>
                          }
                        </Div>
                      </Div>
                    </Accordion>
                  </AccordionRoot>
                </AccordionContext>
              </div>
            ))}
          </div>
          <If conditional={totalCount > pageSize}>
            <div className='flex gap-3 items-center justify-center mt-6 text-white'>
              <div className='w-11 h-11'>
                <Button className='w-full' disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className='h-4 w-4' />
                </Button>
              </div>
              <span className='text-sm text-zinc-400'>Page {page} of {pages}</span>
              <div className='w-11 h-11'>
                <Button className='w-full' disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </If>
        </If>
      </If>
    </Div>
  );
}

export default Logs;
