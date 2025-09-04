'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Prize } from '@/app/[locale]/prize/actions'

interface PrizeDetailsDisplayProps {
  prize: Prize;
}

export function PrizeDetailsDisplay({
  prize,
}: PrizeDetailsDisplayProps) {
  const t = useTranslations('PrizePage');

  return (
    <Card className="border-yellow-300 bg-yellow-50 shadow-lg hover:scale-102 transition-transform duration-300 animate-zoom-in">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-bold text-yellow-800 flex items-center justify-center space-x-2">
          <Trophy className="w-6 h-6 text-green-600" />
          <span>{t('prizeDetails')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <h4 className="text-2xl font-semibold text-yellow-700">{prize.name}</h4>
        
      </CardContent>
    </Card>
  )
}
