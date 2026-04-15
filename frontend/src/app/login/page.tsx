"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { loginUser, getCurrentUserInfo } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast({
        title: "Error",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const signInResult = await loginUser(form.email, form.password);

      // Amplify returns isSignedIn: false when an additional step is required
      // (e.g. CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED) rather than throwing.
      if (!signInResult.isSignedIn) {
        const step = signInResult.nextStep?.signInStep;
        toast({
          title: "Additional Step Required",
          description:
            step === "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
              ? "You must set a new password before logging in."
              : step
              ? `Sign-in requires an additional step: ${step}`
              : "Sign-in could not be completed. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get user info after login
      const userInfo = await getCurrentUserInfo();
      if (userInfo && userInfo.token) {
        const { user, token } = userInfo;
        setUser(
          {
            userId: user.userId,
            email: user.email,
            name: user.name,
            phone: user.phone,
          },
          token,
        );
        toast({
          title: "Welcome back!",
          description: "Login successful",
        });
        router.push("/dashboard");
      } else {
        // signIn succeeded but we could not retrieve a valid session — show an
        // actionable error rather than leaving the user stuck on the login page.
        toast({
          title: "Login Failed",
          description: "Could not establish a session. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      let message = "Login failed. Please try again.";
      if (error !== null && typeof error === "object" && "name" in error && typeof (error as { name: unknown }).name === "string") {
        const name = (error as { name: string }).name;
        if (name === "NotAuthorizedException") {
          message = "Wrong email or password";
        } else if (name === "UserNotConfirmedException") {
          message = "Please verify your email first";
          router.push("/signup");
        } else if (name === "UserNotFoundException") {
          message = "No account found with this email";
        }
      }
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 text-center border-b">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Suraksha AI</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">Welcome Back</h2>
          <p className="text-blue-600 text-sm hindi-text">वापस स्वागत है</p>
        </div>

        <div className="p-8 space-y-5">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="rahul@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              className="mt-1"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <button
                type="button"
                onClick={() => router.push("/forgot-password")}
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Your password"
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-5"
          >
            {isLoading ? "Logging in..." : "Login to Suraksha AI"}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
              OR
            </div>
          </div>

          {/* Demo Access */}
          <Button
            variant="outline"
            onClick={() => {
              sessionStorage.setItem("auth_token", "demo-token");
              sessionStorage.setItem(
                "auth_user",
                JSON.stringify({
                  userId: "demo-user",
                  email: "demo@suraksha.ai",
                  name: "Demo User",
                }),
              );
              router.push("/dashboard");
            }}
            className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            Try Demo (No Login Required)
          </Button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-blue-600 font-medium hover:underline"
            >
              Sign up free
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
