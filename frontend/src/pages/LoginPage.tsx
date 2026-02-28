import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Loader2, Heart } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background Image with Fully Opaque Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/assets/moritzcarehome.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-teal-900 opacity-100" style={{ opacity: 1 }} />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md px-4">
        <Card className="border-none bg-white shadow-2xl">
          <CardHeader className="space-y-3 text-center">
            <div className="flex justify-center">
              <BrandLogo size="xl" mode="rectangular" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900">Moritz Care Home</CardTitle>
            <CardDescription className="text-base text-gray-600">
              Assisted Living Management System
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-center text-sm text-gray-600">
                Please log in to access the resident management system
              </p>
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full bg-teal-600 py-6 text-lg font-semibold text-white shadow-lg transition-all hover:bg-teal-700 hover:shadow-xl disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Login with Internet Identity
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-6">
              <p className="text-center text-xs text-gray-500">
                Secure authentication powered by Internet Computer
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-white">
          <p className="flex items-center justify-center gap-1">
            © 2026. Built with <Heart className="h-4 w-4 fill-red-400 text-red-400" /> using{' '}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-white"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
