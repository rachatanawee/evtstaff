'use client'

import { useState } from 'react'
import { QrReader } from 'react-qr-reader'
import { checkInParticipant } from './actions'

export default function RegisterPage() {
  const [data, setData] = useState('No result');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleScan = async (result: any, error: Error | null | undefined) => {
    if (!!result) {
      const scannedData = result?.text;
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

    if (!!error) {
      // console.info(error);
    }
  }

  return (
    <div className="p-4 flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4">QR Code Scanner</h1>
      <div className="w-full max-w-sm border-2 border-dashed rounded-lg p-2 mb-4">
        <QrReader
          onResult={handleScan}
          constraints={{ facingMode: 'environment' }}
          containerStyle={{ width: '100%' }}
        />
      </div>
      {isLoading && <p>Loading...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}
      <p className="bg-gray-100 p-2 rounded w-full max-w-sm break-words">Scanned Result: {data}</p>
    </div>
  )
}
