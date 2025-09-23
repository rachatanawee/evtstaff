import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Trophy, Scan } from 'lucide-react'; // Changed Ticket to Home, Gift to Trophy

export default function HomePage() {
  const t = useTranslations('HomePage');
  return (
    <div className="p-4 min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
      <Card className="w-full max-w-md p-6 shadow-lg rounded-lg text-center">
        <CardHeader className="flex flex-col items-center mb-4">
          <Home className="h-12 w-12 text-blue-600 mb-2" /> {/* Changed to Home icon */}
          <CardTitle className="text-3xl font-extrabold text-gray-800">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-gray-600 mb-4">{t('description')}</p>
          <div className="flex justify-center space-x-4">
            <Link href="/register" className="flex flex-col items-center">
              <Scan className="h-8 w-8 text-green-600" />
              <span className="text-sm text-gray-500">{t('participantRegistration')}</span>
            </Link>
            <Link href="/prize" className="flex flex-col items-center">
              <Trophy className="h-8 w-8 text-purple-600" /> {/* Changed to Trophy icon */}
              <span className="text-sm text-gray-500">{t('prizeRedemption')}</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}