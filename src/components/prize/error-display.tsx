'use client'

import { useTranslations } from 'next-intl'

interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({
  error,
}: ErrorDisplayProps) {
  const t = useTranslations('PrizePage');

  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg w-full shadow-md">
      <p className="font-medium text-center">
        {error === 'No prize found for this employee.' ? t('noPrizeFound') : `${t('error')}: ${error}`}
      </p>
    </div>
  )
}
