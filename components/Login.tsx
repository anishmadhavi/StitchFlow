/**
 * components/Login.tsx
 * Purpose: Authentication Component.
 * Description: Renders the Login and Signup forms. Handles dual authentication modes (Email for Admin, Mobile/PIN for Staff).
 * Compatibility: Client-side React.
 */

import React, { useState } from 'react';
import { Lock, User, Loader2, ArrowRight } from 'lucide-react';
import { Button } from './Shared';

interface LoginProps {
  onLogin: (identifier: string, secret: string) => Promise<void>;
  onSignUp?: (name: string, email: string, secret: string) => Promise<void>;
  loading: boolean;
  error?: string | null;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onSignUp, loading, error }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  // Signup specific state
  const [newName, setNewName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'LOGIN') {
        onLogin(identifier, password);
    } else if (onSignUp) {
        onSignUp(newName, identifier, password);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
             <Lock className="text-white w-6 h-6" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            {mode === 'LOGIN' ? 'Sign in to StitchFlow' : 'Create Admin Account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === 'LOGIN' 
                ? 'Enter your Email (Admin) or Mobile Number (Staff)' 
                : 'Setup your factory admin account'
            }
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            
            {mode === 'SIGNUP' && (
               <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Factory / Owner Name</label>
                <div className="mt-1">
                  <input
                    id="name"
                    type="text"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    placeholder="e.g. Rajesh Exports"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                {mode === 'LOGIN' ? 'Email or Mobile Number' : 'Email Address'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type={mode === 'LOGIN' ? "text" : "email"}
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder={mode === 'LOGIN' ? "admin@company.com or 9876543210" : "you@company.com"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                {mode === 'LOGIN' ? 'Password or 6-Digit PIN' : 'Create Password'}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (mode === 'LOGIN' ? 'Sign In' : 'Create Account')}
              </Button>
            </div>
          </form>

          {onSignUp && (
            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                            {mode === 'LOGIN' ? 'New to StitchFlow?' : 'Already have an account?'}
                        </span>
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <button 
                        onClick={() => {
                            setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN');
                            setIdentifier('');
                            setPassword('');
                            setNewName('');
                        }}
                        className="text-blue-600 hover:text-blue-500 font-medium text-sm flex items-center justify-center w-full gap-1"
                    >
                        {mode === 'LOGIN' ? 'Create Admin Account' : 'Back to Login'} <ArrowRight size={14} />
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
