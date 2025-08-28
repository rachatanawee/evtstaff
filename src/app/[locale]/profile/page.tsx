'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation' // Added usePathname
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from '@supabase/supabase-js'
import LanguageSwitcher from '@/components/language-switcher/language-switcher'; // Import LanguageSwitcher

import { User as UserIcon, Mail, Fingerprint, Clock } from 'lucide-react'; // Import User icon and alias it, plus new icons

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname(); // Added usePathname

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const locale = pathname.split('/')[1]; // Use pathname directly
    router.push(`/${locale}/login`);
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!user) {
    return (
        <div className="p-4 text-center min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100"> {/* Added background */}
            <Card className="w-full max-w-md p-6 shadow-lg rounded-lg text-center"> {/* Added Card styling */}
                <p className="text-lg text-gray-600 mb-4">You are not logged in.</p>
                <Button onClick={() => router.push('/login')} className="mt-2">Go to Login</Button>
            </Card>
        </div>
    )
  }

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
                <CardContent className="space-y-4"> {/* Added space-y for vertical spacing */}
          <div className="flex items-center text-left"> {/* Flex container for each detail */}
            <Mail className="h-5 w-5 text-gray-500 mr-3" /> {/* Icon for Email */}
            <div>
              <p className="text-sm font-semibold text-gray-700">Email:</p>
              <p className="text-md text-gray-800">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center text-left">
            <Fingerprint className="h-5 w-5 text-gray-500 mr-3" /> {/* Icon for User ID */}
            <div>
              <p className="text-sm font-semibold text-gray-700">User ID:</p>
              <p className="text-md text-gray-800">{user.id}</p>
            </div>
          </div>
          <div className="flex items-center text-left">
            <Clock className="h-5 w-5 text-gray-500 mr-3" /> {/* Icon for Last Signed In */}
            <div>
              <p className="text-sm font-semibold text-gray-700">Last Signed In:</p>
              <p className="text-md text-gray-800">{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={handleLogout} className="w-full mt-4" variant="destructive">
        Logout
      </Button>
      <div className="mt-4 flex justify-center"> {/* Added div for spacing and centering */}
        <LanguageSwitcher />
      </div>
    </div>
  )
}
