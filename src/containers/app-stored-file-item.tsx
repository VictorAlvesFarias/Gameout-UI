import { Clock } from 'lucide-react';
import React from 'react'

function AppStoredFileItem(x: {
    name: string;
    createDate: string;
    updateDate: string;
    processing: boolean;
    status?: number;
    message?: string;
    version?: string;
}) {
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

    function getProcessingStatusColor(status?: number): string {
        if (status == 1) {
            return 'text-yellow-400'; // Pending
        }

        if (status == 2) {
            return 'text-cyan-400'; // Processing
        }

        if (status == 3) {
            return 'text-green-400'; // Complete
        }

        if (status == 4) {
            return 'text-red-400'; // Error
        }

        if (status == 5) {
            return 'text-purple-400'; // PathNotFounded
        }

        if (status == 6) {
            return 'text-orange-400'; // LockedFiles
        }

        return ""
    }

    function getStatusMessage(message?: string, status?: number): string {
        // Se a mensagem vier do backend e não for um número, usa ela
        if (message && isNaN(Number(message))) {
            return message;
        }

        // Caso contrário, gera a mensagem baseada no status
        switch (status) {
            case 1: return 'Pending';
            case 2: return 'Items in processing';
            case 3: return 'Synced';
            case 4: return 'Error during processing';
            case 5: return 'Path not founded';
            case 6: return 'Locked files';
            default: return message || '';
        }
    }

    return (
        <div className='flex flex-col gap-1'>
            <div className='flex items-center gap-3'>
                {x.processing &&
                    <Clock className='h-4 w-4 text-gray-400' />
                }
                <p className='font-semibold'>{x.name}</p>
                {(x.message || x.status) &&
                    <span className={`text-xs py-1 rounded ${getProcessingStatusColor(x.status)} bg-opacity-20`}>
                        {getStatusMessage(x.message, x.status)}
                    </span>
                }
            </div>
            <div className='flex gap-4 text-xs text-gray-400'>
                <span>Created: {formatDate(x.createDate)}</span>
                <span>Updated: {formatDate(x.updateDate)}</span>
            </div>
        </div>
    )
}

export default AppStoredFileItem