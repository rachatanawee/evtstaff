'use client'

import { useState } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { checkInParticipant } from './actions'

export default function RegisterPage() {
  const [data, setData] = useState('No result');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScanSuccess = async (result: any) => {
    if (result) {
      const scannedData = result;
      setData(scannedData);
      setIsLoading(true);
      setError('');

      const response = await checkInParticipant(scannedData);

      if (response.success) {
        setData(response.message);
      } else {
        setError(response.message);
      }
      setIsLoading(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScanError = (_err: any) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    // console.info(err);
  }

  return (
    <div className="p-4 flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>
      <div className="w-full max-w-sm border-2 border-dashed rounded-lg p-2 mb-4">
        <Scanner
          onScan={handleScanSuccess}
          onError={handleScanError}
          constraints={{ facingMode: 'environment' }}
        />
      </div>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <p className="bg-gray-100 p-2 rounded w-full max-w-sm break-words">Scanned Result: {data}</p>
    </div>
  )
}
