'use client'

import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { useTranslations } from 'next-intl'

interface PhotoConfirmationProps {
  photo: string;
  handleSubmit: () => void;
  setPhoto: (photo: string | null) => void;
  isSubmitting: boolean;
}

export function PhotoConfirmation({
  photo,
  handleSubmit,
  setPhoto,
  isSubmitting,
}: PhotoConfirmationProps) {
  const t = useTranslations('PrizePage');

  return (
    <div className="text-center bg-gray-50 p-4 rounded-lg shadow-inner border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('confirmPhoto')}</h3>
      <Image src={photo} alt={t('prizeConfirmationAlt')} width={300} height={200} objectFit="contain" className="rounded-md mb-4 mx-auto border border-gray-300 shadow-sm" />
      <div className="flex justify-center gap-3">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          {isSubmitting ? t('submitting') : t('submitClaim')}
        </Button>
        <Button
          onClick={() => setPhoto(null)}
          variant="outline"
          className="px-6 py-3 border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 shadow-md"
        >
          {t('retake')}
        </Button>
      </div>
    </div>
  )
}
