import React from 'react'
import { usePageContext } from '../contexts/page-context';
import Span from '../components/span';
import { LoaderCircle } from 'lucide-react';

function LoadingContainer() {
  const { loading } = usePageContext();

  return (
    loading &&
    <div className='absolute inset-0 justify-center items-center flex text-white bg-zinc-900 bg-opacity-50 z-40'>
      <LoaderCircle className='animate-spin ' />
    </div>
  )
}

export default LoadingContainer