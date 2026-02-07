import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, LogOut, Info } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Separator } from '@/components/ui/separator';

interface StartupErrorScreenProps {
  title: string;
  message: string;
  error: Error | null;
  onRetry: () => void;
  isAuthenticated?: boolean;
  principalId?: string;
}

export default function StartupErrorScreen({
  title,
  message,
  error,
  onRetry,
  isAuthenticated = false,
  principalId,
}: StartupErrorScreenProps) {
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleRetry = () => {
    onRetry();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 p-4">
      <Card className="w-full max-w-md border-red-200 bg-white shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">{title}</CardTitle>
          <CardDescription className="text-base text-gray-600">
            {message}
          </CardDescription>
        </CardHeader>

        {error && (
          <CardContent className="space-y-4">
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-900 mb-1">Error Details:</p>
              <p className="text-xs text-red-800 font-mono break-words">
                {error.message || 'Unknown error occurred'}
              </p>
            </div>

            <Separator />

            <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-blue-900">Diagnostics:</p>
                  <div className="space-y-1 text-xs text-blue-800">
                    <div className="flex justify-between">
                      <span className="font-medium">Authenticated:</span>
                      <span className={isAuthenticated ? 'text-green-700' : 'text-orange-700'}>
                        {isAuthenticated ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {isAuthenticated && principalId && (
                      <div className="flex flex-col gap-1 mt-2">
                        <span className="font-medium">Principal ID:</span>
                        <span className="font-mono text-[10px] break-all bg-white px-2 py-1 rounded border border-blue-200">
                          {principalId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}

        <CardFooter className="flex flex-col gap-3 pt-6">
          <Button
            onClick={handleRetry}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            size="lg"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
            size="lg"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>

          <p className="text-xs text-center text-gray-500 mt-2">
            If the problem persists, please contact your system administrator.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
