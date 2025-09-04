'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface RedeemedPhotoDisplayProps {
  redeemedPhotoPath: string;
}

export function RedeemedPhotoDisplay({
  redeemedPhotoPath,
}: RedeemedPhotoDisplayProps) {
  const t = useTranslations('PrizePage');

  return (
    <div className="bg-blue-50 border border-blue-200 text-blue-700 p-6 rounded-lg w-full shadow-md text-center">
      <h2 className="text-2xl font-bold mb-3">{t('prizeAlreadyRedeemed')}</h2>
      <p className="text-gray-700 mb-4">{t('prizeAlreadyRedeemedDescription')}</p>
      <Image
        src={redeemedPhotoPath}
        alt={t('redeemedPrizePhotoAlt')}
        width={300}
        height={200}
        objectFit="contain"
        className="rounded-md mx-auto border border-gray-300 shadow-sm"
      />
    </div>
  )
}
