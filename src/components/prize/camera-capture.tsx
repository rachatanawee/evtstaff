'use client'

import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl'
import { RefObject } from 'react'

interface CameraCaptureProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  takePicture: () => void;
}

export function CameraCapture({
  videoRef,
  canvasRef,
  takePicture,
}: CameraCaptureProps) {
  const t = useTranslations('PrizePage');

  return (
    <div className="text-center bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200">
      <video ref={videoRef} className="w-full rounded-md mb-4 border border-gray-300" playsInline />
      <canvas ref={canvasRef} className="hidden" />
      <div className="flex justify-center gap-3">
        <Button
          onClick={takePicture}
          className="px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          {t('takePicture')}
        </Button>
      </div>
    </div>
  )
}
