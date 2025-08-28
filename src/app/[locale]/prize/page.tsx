'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { searchEmployeePrize, submitPrizeClaim, Prize } from './actions'

export default function PrizePage() {
  const [employeeId, setEmployeeId] = useState('');
  const [prize, setPrize] = useState<Prize | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleSearch = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError('');
    setPrize(null);

    const { prize: fetchedPrize, error: searchError } = await searchEmployeePrize(employeeId);

    if (searchError) {
      setError(searchError);
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-center">Claim Your Prize</h1>
      <div className="flex gap-2 mb-4">
        <Input
          type="text"
          placeholder="Enter Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          disabled={isLoading}
        />
        <Button onClick={handleSearch} disabled={isLoading || !employeeId}>
          {isLoading ? 'Searching...' : 'Search'}
        </Button>
      </div>

      {error && <p className="text-red-500 text-center mb-4">Error: {error}</p>}

      {prize && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Prize Details</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold">{prize.name}</h2>
            <p>{prize.description}</p>
          </CardContent>
        </Card>
      )}

      {prize && !photo && (
        <div className="text-center mb-4">
            <video ref={videoRef} className="w-full rounded-md mb-2" playsInline />
            <canvas ref={canvasRef} className="hidden" />
            <Button onClick={startCamera} className="mr-2">Start Camera</Button>
            <Button onClick={takePicture}>Take Picture</Button>
        </div>
      )}

      {photo && (
          <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2">Confirm Photo</h3>
              <Image src={photo} alt="Prize confirmation" width={300} height={200} objectFit="contain" className="rounded-md mb-2 mx-auto" />
              <Button onClick={handleSubmit} disabled={isSubmitting} className="mr-2">
                  {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
              <Button onClick={() => setPhoto(null)} variant="outline">Retake</Button>
          </div>
      )}
    </div>
  )
}
