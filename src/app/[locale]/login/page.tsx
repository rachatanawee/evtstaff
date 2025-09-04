'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState<string | null>(null); // New state for login error
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()
  const locale = pathname.split('/')[1];

  const handleLogin = async () => {
    setLoginError(null); // Clear previous errors
    setIsLoading(true); // Set loading to true
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Login error:', error.message);
      setLoginError(error.message); // Set the error message
      setIsLoading(false); // Set loading to false on error
    } else {
      router.push(`/${locale}/home`);
      // Loading will remain true until the new page loads
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative"> {/* Added relative */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
          <p className="text-gray-800 text-lg">Loading...</p> {/* Simple loading text */}
        </div>
      )}
      <main className="flex flex-col items-center justify-center w-full flex-1 text-center">
        <h1 className="text-4xl font-bold">
          Login
        </h1>
        <div className="w-full max-w-xs">
          <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-3 px-4 text-lg text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading} // Disable input during loading
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                className="shadow appearance-none border rounded w-full py-3 px-4 text-lg text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                id="password"
                type="password"
                placeholder="******************"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading} // Disable input during loading
              />
            </div>
            {loginError && (
              <p className="text-red-500 text-xs italic mb-4">{loginError}</p>
            )}
            <div className="flex items-center justify-center">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-3 px-6 text-lg rounded focus:outline-none focus:shadow-outline"
                type="button"
                onClick={handleLogin}
                disabled={isLoading} // Disable button during loading
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
