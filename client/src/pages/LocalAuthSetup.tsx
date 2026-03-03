import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LOCAL_TEST_USERS, setLocalAuthUser } from "@/lib/localAuth";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export function LocalAuthSetup() {
  const isLocalAuthEnabled = import.meta.env.VITE_LOCAL_AUTH_MODE === "true";

  if (!isLocalAuthEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Local Auth Mode Disabled
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Local authentication mode is not enabled on the server. To enable it, set the environment variable:
            </p>
            <div className="p-3 bg-gray-100 rounded font-mono text-xs break-all">
              ENABLE_LOCAL_AUTH_MODE=true
            </div>
            <p className="text-sm text-gray-600">
              After setting this variable, restart the development server.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Local Test Authentication
          </CardTitle>
          <CardDescription>
            Select a test user to continue in development mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {LOCAL_TEST_USERS.map((user) => (
            <Button
              key={user.id}
              onClick={() => setLocalAuthUser(user.id)}
              variant="outline"
              className="w-full justify-start text-left h-auto p-4"
            >
              <div className="flex flex-col gap-1">
                <div className="font-semibold">{user.name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </div>
            </Button>
          ))}
          <div className="mt-6 p-3 bg-blue-50 rounded text-xs text-blue-700">
            <p className="font-semibold mb-1">ℹ️ Development Mode</p>
            <p>
              This page only appears when local test authentication is enabled. 
              In production, standard OAuth authentication is used.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
