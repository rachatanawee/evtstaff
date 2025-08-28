'use client'

import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button'; // Assuming Button component is available
import { Globe } from 'lucide-react'; // Import Globe icon

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = pathname.split('/')[1];

  const switchLanguage = (newLocale: string) => {
    const newPath = `/${newLocale}${pathname.substring(currentLocale.length + 1)}`;
    router.push(newPath);
  };

  return (
    <div className="flex space-x-2">
      <Button
        onClick={() => switchLanguage('en')}
        variant={currentLocale === 'en' ? 'default' : 'secondary'} // Changed variant
      >
        <Globe className="h-5 w-5 mr-2" /> {/* Larger icon */}
        English
      </Button>
      <Button
        onClick={() => switchLanguage('th')}
        variant={currentLocale === 'th' ? 'default' : 'secondary'} // Changed variant
      >
        <Globe className="h-5 w-5 mr-2" /> {/* Larger icon */}
        ภาษาไทย
      </Button>
    </div>
  );
}