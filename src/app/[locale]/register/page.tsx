'use client'

import { useState } from 'react'
import { QrReader } from 'react-qr-reader'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [data, setData] = useState('No result');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleScan = async (result: any, error: any) => {
    if (!!result) {
      const scannedData = result?.text;
      setData(scannedData);
      setIsLoading(true);
      setError('');

      try {
        // Assuming the QR code contains the participant's ID
        const { data: updateData, error: updateError } = await supabase
          .from('participants')
          .update({ status: 'checked-in', updated_at: new Date().toISOString() })
          .eq('id', scannedData)
          .select();

        if (updateError) {
          throw new Error(`Supabase error: ${updateError.message}`);
        }

        if (!updateData || updateData.length === 0) {
          throw new Error('Participant not found.');
        }

        setData(`Successfully checked-in participant: ${scannedData}`);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
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
