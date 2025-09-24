'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { searchEmployeePrize, submitPrizeClaim, Prize, EmployeeDetails } from './actions'
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"

import { EmployeeSearchForm } from '@/components/prize/employee-search-form'
import { ErrorDisplay } from '@/components/prize/error-display'
import { RedeemedPhotoDisplay } from '@/components/prize/redeemed-photo-display'
import { PrizeDetailsDisplay } from '@/components/prize/prize-details-display'
import { CameraCapture } from '@/components/prize/camera-capture'
import { PhotoConfirmation } from '@/components/prize/photo-confirmation'

export default function PrizePage() {
  const t = useTranslations('PrizePage');
  const [employeeId, setEmployeeId] = useState('');
  const [prize, setPrize] = useState<Prize | null>(null);
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null); // New state for employee details
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [redeemedPhotoPath, setRedeemedPhotoPath] = useState<string | null>(null); // New state
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null); // New ref for input

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const startCamera = async (mode: 'user' | 'environment') => {
    setPhoto(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      // Stop any existing stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (e) {
        setError('Could not start camera. Please grant permission.');
      }
    }
  };

  useEffect(() => {
    if (prize && !photo) {
      startCamera(facingMode);
    }
  }, [prize, photo, facingMode]);

  const switchCamera = () => {
    setFacingMode(prevMode => (prevMode === 'user' ? 'environment' : 'user'));
  };

  const handleSearch = async () => {
    if (!employeeId) return;
    setIsLoading(true);
    setError('');
    setPrize(null);
    setEmployee(null); // Clear previous employee details
    setRedeemedPhotoPath(null); // Clear previous photo path

    const { prize: fetchedPrize, error: searchError, redeemedPhotoPath: fetchedRedeemedPhotoPath, employee: fetchedEmployee } = await searchEmployeePrize(employeeId); // Destructure new field

    if (searchError) {
      setError(searchError);
      if (searchError === 'รับของไปแล้ว') { // Check for the specific message
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const bucketName = 'claim_prize';
        const fullImageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fetchedRedeemedPhotoPath}`;
        setRedeemedPhotoPath(fullImageUrl); // Set full URL
      }
    } else if (fetchedPrize && fetchedEmployee) {
      setPrize(fetchedPrize as Prize);
      setEmployee(fetchedEmployee as EmployeeDetails);
    }
    setIsLoading(false);
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
      alert(t('submitSuccess'));
      setEmployeeId('');
      setPrize(null);
      setEmployee(null); // Clear employee details on successful submission
      setPhoto(null);
    } else {
      setError(submitError || t('submitError'));
    }
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setEmployeeId('');
    setPrize(null);
    setEmployee(null); // Clear employee details on reset
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
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-3xl font-extrabold text-gray-800">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {!prize && !redeemedPhotoPath && (
              <EmployeeSearchForm
                employeeId={employeeId}
                setEmployeeId={setEmployeeId}
                handleSearch={handleSearch}
                isLoading={isLoading}
                isSubmitting={isSubmitting}
                inputRef={inputRef}
              />
            )}

            {employee && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg w-full shadow-md text-center">
                <h2 className="text-2xl font-bold mb-3">{t('employeeDetails')}</h2>
                <p className="text-gray-700">
                  {employee.employee_id} - {employee.full_name}
                  {employee.department && ` (${employee.department})`}
                </p>
              </div>
            )}

            {error && error !== 'รับของไปแล้ว' && (
              <ErrorDisplay error={error} />
            )}

            {redeemedPhotoPath && (
              <RedeemedPhotoDisplay redeemedPhotoPath={redeemedPhotoPath} />
            )}

            {prize && (
              <PrizeDetailsDisplay prize={prize} />
            )}

            {prize && !photo && (
              <CameraCapture
                videoRef={videoRef}
                canvasRef={canvasRef}
                takePicture={takePicture}
                switchCamera={switchCamera}
              />
            )}

            {photo && (
              <PhotoConfirmation
                photo={photo}
                handleSubmit={handleSubmit}
                setPhoto={setPhoto}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
          {(prize || error || redeemedPhotoPath) && (
            <Button
              onClick={handleReset}
              variant="outline"
              className="w-full mt-4 px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
            >
              {t('reset')}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
