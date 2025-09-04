'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { searchEmployeePrize, submitPrizeClaim, Prize } from './actions'
import { Trophy } from 'lucide-react'

export default function PrizePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [prize, setPrize] = useState<Prize | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [redeemedPhotoPath, setRedeemedPhotoPath] = useState<string | null>(null); // New state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // New ref for input

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSearch = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError('');
    setPrize(null);
    setRedeemedPhotoPath(null); // Clear previous photo path

    const { prize: fetchedPrize, error: searchError, redeemedPhotoPath: fetchedRedeemedPhotoPath } = await searchEmployeePrize(employeeId); // Destructure new field

    if (searchError) {
      setError(searchError);
      if (searchError === 'รับของไปแล้ว') { // Check for the specific message
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const bucketName = 'claim_prize';
        const fullImageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fetchedRedeemedPhotoPath}`;
        setRedeemedPhotoPath(fullImageUrl); // Set full URL
      }
    } else if (fetchedPrize) {
      setPrize(fetchedPrize as Prize);
    }
    setIsLoading(false);
  };

  const startCamera = async () => {
    setPhoto(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
        setError('Could not start camera. Please grant permission.');
      }
    }
  };

  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPhoto(dataUrl);

      // Stop camera stream
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleSubmit = async () => {
    if (!photo || !prize || !employeeId) return;
    setIsSubmitting(true);
    setError('');

    const { success, error: submitError } = await submitPrizeClaim(employeeId, prize.id, photo);

    if (success) {
      alert('Successfully submitted prize claim!');
      setEmployeeId('');
      setPrize(null);
      setPhoto(null);
    } else {
      setError(submitError || 'Failed to submit prize claim.');
    }
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setEmployeeId('');
    setPrize(null);
    setError('');
    setIsLoading(false);
    setIsSubmitting(false);
    setPhoto(null);
    setRedeemedPhotoPath(null);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    // Add focus to input after reset
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 rounded-xl shadow-2xl border border-gray-200">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-extrabold text-gray-800">Claim Your Prize</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col gap-3">
              <Input
                ref={inputRef} // Attach ref
                type="text"
                placeholder="Enter Employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                disabled={isLoading || isSubmitting}
                className="flex-grow p-3 text-lg border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex gap-3">
                <Button
                  onClick={handleSearch}
                  disabled={isLoading || !employeeId || isSubmitting}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
                {(prize || error || redeemedPhotoPath) && (
                  <Button
                    onClick={handleReset}
                    variant="outline"
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {error && error !== 'รับของไปแล้ว' && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg w-full shadow-md">
                <p className="font-medium text-center">
                  {error === 'No prize found for this employee.' ? 'ไม่พบข้อมูลได้รางวัล' : `Error: ${error}`}
                </p>
              </div>
            )}

            {redeemedPhotoPath && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg w-full shadow-md text-center">
                <h2 className="text-2xl font-bold mb-3">รับของไปแล้ว</h2>
                <p className="text-gray-700 mb-4">This prize has already been redeemed.</p>
                <Image
                  src={redeemedPhotoPath}
                  alt="Redeemed Prize Photo"
                  width={300}
                  height={200}
                  objectFit="contain"
                  className="rounded-md mx-auto border border-gray-300 shadow-sm"
                />
              </div>
            )}

            {prize && (
              <Card className="border-yellow-300 bg-yellow-50 shadow-lg hover:scale-102 transition-transform duration-300 animate-zoom-in">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-bold text-yellow-800 flex items-center justify-center space-x-2">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                    <span>Prize Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <h2 className="text-2xl font-semibold text-yellow-700">{prize.name}</h2>
                  <p className="text-gray-700">{prize.description}</p>
                </CardContent>
              </Card>
            )}

            {prize && !photo && (
              <div className="text-center bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200">
                <video ref={videoRef} className="w-full rounded-md mb-4 border border-gray-300" playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={startCamera}
                    className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  >
                    Start Camera
                  </Button>
                  <Button
                    onClick={takePicture}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  >
                    Take Picture
                  </Button>
                </div>
              </div>
            )}

            {photo && (
              <div className="text-center bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Photo</h3>
                <Image src={photo} alt="Prize confirmation" width={300} height={200} objectFit="contain" className="rounded-md mb-4 mx-auto border border-gray-300 shadow-sm" />
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                  </Button>
                  <Button
                    onClick={() => setPhoto(null)}
                    variant="outline"
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
                  >
                    Retake
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
