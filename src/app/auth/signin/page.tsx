'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Logo from '../../../../public/logo.png';
import Image from 'next/image';
import { adminLogin } from '@/lib/api';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-300 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <Image src={Logo.src} alt="Logo" width={48} height={48} className="mx-auto mb-6" />

        {/* Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-8">
            Sign In
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Your email
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900"
                placeholder="Enter your email or phone"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-left">
              <a
                href="#"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                Forgot Password
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"

              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}