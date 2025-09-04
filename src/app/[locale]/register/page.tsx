'use client'

import { useState, useRef, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import { checkInParticipant, getInitialSession } from './actions'
import { QrCode } from 'lucide-react'
import { LoadingOverlay } from '@/components/loading-overlay'

interface RegisteredData {
  employee_id: string;
  full_name?: string;
  department?: string;
}

interface ScanResult {
  rawValue: string;
}

export default function RegisterPage() {
  const [registeredData, setRegisteredData] = useState<RegisteredData | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const initialSession = await getInitialSession();
      setSession(initialSession);
    };

    fetchSession();
  }, []);

  const handleScanAgain = () => {
    window.location.reload();
  }

  const handleScanSuccess = async (result: ScanResult[]) => {
    if (result && result.length > 0) {
      console.log('Full result object:', result);
      const scannedData = result[0].rawValue;
      setRegisteredData(null);
      setIsLoading(true);
      setError('');
      setSession(null); // Clear previous session

      // Play sound on successful scan
      if (audioRef.current) {
        audioRef.current.play();
      }

      const response = await checkInParticipant(scannedData);

      if (response.success) {
        setRegisteredData(JSON.parse(scannedData));
        setSession(response.session || null);
        setError(''); // Explicitly clear error on success
      } else {
        setError(response.message);
      }
      setIsLoading(false);
    }
  }

  const handleScanError = (err: unknown) => {
     console.info(err);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-purple-200 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md flex flex-col items-center text-center border border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center justify-center space-x-3">
          <QrCode className="w-8 h-8 text-blue-600" />
          <span>Scan QR Code เพื่อลงทะเบียนงาน <span className="font-normal">{session}</span></span>
        </h1>

        <div className="w-full max-w-xs bg-gray-50 border border-gray-300 rounded-lg overflow-hidden shadow-inner mb-6 aspect-square flex items-center justify-center">
          <Scanner
            onScan={handleScanSuccess}
            onError={handleScanError}
            sound={true}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg w-full mb-6 shadow-md">
            <p className="font-medium mb-3">Error: {error}</p>
            <button
              onClick={handleScanAgain}
              className="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              Scan Again
            </button>
          </div>
        )}

        {registeredData && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg w-full mb-6 shadow-md">
            <h2 className="text-2xl font-bold text-green-800 mb-3">Registration Successful!</h2>
            <div className="text-left space-y-2 mb-4">
              <p><strong>Employee ID:</strong> {registeredData.employee_id}</p>
              <p><strong>Full Name:</strong> {registeredData.full_name}</p>
              <p><strong>Department:</strong> {registeredData.department}</p>
              {session && <p><strong>Session:</strong> {session}</p>}
            </div>
            <button
              onClick={handleScanAgain}
              className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
            >
              Scan Next
            </button>
          </div>
        )}
      </div>
      <LoadingOverlay show={isLoading} message="Processing scan..." />
    </div>
  )
}