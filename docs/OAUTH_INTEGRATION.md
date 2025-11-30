# OAuth Integration Guide

This guide explains how to integrate with the Better-auth OAuth system from your frontend applications (React/Next.js) and React Native mobile apps.

## Table of Contents

- [Overview](#overview)
- [Backend Endpoints](#backend-endpoints)
- [Web Integration (React/Next.js)](#web-integration-reactnextjs)
- [React Native Integration](#react-native-integration)
- [OAuth Flow Explained](#oauth-flow-explained)
- [Configuration](#configuration)
- [TypeScript Types](#typescript-types)
- [Security Best Practices](#security-best-practices)

---

## Overview

This backend uses **Better-auth** for authentication, which provides:

- **Google OAuth** - Social login with Google
- **Email/Password** - Traditional authentication with email verification
- **Session Management** - Secure, httpOnly cookie-based sessions
- **Type Safety** - Full TypeScript support

The authentication system is already configured on the backend. You just need to integrate the client-side code.

---

## Backend Endpoints

The following endpoints are automatically available at `/api/v1/auth`:

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/auth/sign-in/google` | Initiate Google OAuth flow |
| `GET` | `/api/v1/auth/callback/google` | OAuth callback (handled automatically) |
| `POST` | `/api/v1/auth/sign-up/email` | Email/password registration |
| `POST` | `/api/v1/auth/sign-in/email` | Email/password login |
| `POST` | `/api/v1/auth/sign-out` | Sign out and clear session |
| `GET` | `/api/v1/auth/session` | Get current session |
| `POST` | `/api/v1/auth/verify-email` | Verify email address |

### Environment Variables Required

Ensure these are set in your backend `.env`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
BETTER_AUTH_SECRET=your_32_character_secret
BETTER_AUTH_URL=http://localhost:3000
```

---

## Web Integration (React/Next.js)

### Installation

```bash
npm install better-auth
# or
yarn add better-auth
# or
pnpm add better-auth
```

### 1. Create Auth Client

Create a centralized auth client configuration:

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

// Export hooks and methods
export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
```

### 2. Google OAuth Login

```typescript
// components/GoogleLoginButton.tsx
import { signIn } from "@/lib/auth-client";

export function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: "google",
      callbackURL: "/dashboard", // Where to redirect after login
    });
  };

  return (
    <button
      onClick={handleGoogleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
    >
      <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
      Sign in with Google
    </button>
  );
}
```

### 3. Email/Password Login

```typescript
// components/EmailLoginForm.tsx
import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message || "Login failed");
        return;
      }

      // Redirect or update UI
      window.location.href = "/dashboard";
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
```

### 4. Email/Password Registration

```typescript
// components/EmailSignupForm.tsx
import { useState } from "react";
import { signUp } from "@/lib/auth-client";

export function EmailSignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await signUp.email({
        email,
        password,
        name,
      });

      if (error) {
        setError(error.message || "Registration failed");
        return;
      }

      // Show email verification message
      alert("Please check your email to verify your account");
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign up"}
      </button>
    </form>
  );
}
```

### 5. Session Management

```typescript
// components/Profile.tsx
import { useSession } from "@/lib/auth-client";
import { signOut } from "@/lib/auth-client";

export function Profile() {
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
  };

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not logged in</div>;
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        {session.user.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <h2 className="font-semibold">{session.user.name}</h2>
          <p className="text-sm text-gray-600">{session.user.email}</p>
          <p className="text-xs text-gray-500">Role: {session.user.role}</p>
        </div>
      </div>

      <button
        onClick={handleSignOut}
        className="mt-4 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
      >
        Sign out
      </button>
    </div>
  );
}
```

### 6. Protected Routes

```typescript
// components/ProtectedRoute.tsx
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}

// Usage in a page
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div>Protected Dashboard Content</div>
    </ProtectedRoute>
  );
}
```

---

## React Native Integration

### Installation

```bash
# For Expo
npm install better-auth expo-auth-session expo-web-browser

# For bare React Native
npm install better-auth react-native-inappbrowser-reborn
```

### 1. Auth Client Setup

```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import * as WebBrowser from "expo-web-browser"; // For Expo

// Required for Expo
WebBrowser.maybeCompleteAuthSession();

export const authClient = createAuthClient({
  baseURL: "https://your-api.com", // Your backend URL
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

### 2. Google OAuth with Expo

```typescript
// components/GoogleLoginButton.tsx
import { TouchableOpacity, Text } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useState } from "react";

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `https://your-api.com/api/v1/auth/sign-in/google`,
        "myapp://callback" // Your app's deep link
      );

      if (result.type === "success") {
        // Session cookie is automatically set
        // Refresh your app state or navigate
        console.log("Login successful");
      }
    } catch (error) {
      console.error("OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleGoogleLogin}
      disabled={loading}
      style={{
        backgroundColor: "#4285F4",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "600" }}>
        {loading ? "Loading..." : "Sign in with Google"}
      </Text>
    </TouchableOpacity>
  );
}
```

### 3. Google OAuth with react-native-inappbrowser-reborn

```typescript
// components/GoogleLoginButton.tsx
import { TouchableOpacity, Text } from "react-native";
import InAppBrowser from "react-native-inappbrowser-reborn";
import { useState } from "react";

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      if (await InAppBrowser.isAvailable()) {
        const result = await InAppBrowser.openAuth(
          `https://your-api.com/api/v1/auth/sign-in/google`,
          "myapp://callback",
          {
            ephemeralWebSession: false,
            showTitle: false,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
          }
        );

        if (result.type === "success") {
          console.log("Login successful");
          // Navigate to authenticated screen
        }
      }
    } catch (error) {
      console.error("OAuth error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleGoogleLogin}
      disabled={loading}
      style={{
        backgroundColor: "#4285F4",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "white", fontWeight: "600" }}>
        {loading ? "Loading..." : "Sign in with Google"}
      </Text>
    </TouchableOpacity>
  );
}
```

### 4. Deep Link Configuration (Expo)

```json
// app.json
{
  "expo": {
    "scheme": "myapp",
    "name": "My App",
    "slug": "my-app",
    "ios": {
      "bundleIdentifier": "com.yourcompany.myapp"
    },
    "android": {
      "package": "com.yourcompany.myapp"
    }
  }
}
```

### 5. Deep Link Configuration (Bare React Native)

**iOS (Info.plist):**

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
  </dict>
</array>
```

**Android (AndroidManifest.xml):**

```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="myapp" />
</intent-filter>
```

### 6. Session Management in React Native

```typescript
// components/Profile.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { useSession, signOut } from "@/lib/auth-client";

export function Profile() {
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    // Navigate to login screen
  };

  if (isPending) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View>
        <Text>Not logged in</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600" }}>
        {session.user.name}
      </Text>
      <Text style={{ color: "#666" }}>{session.user.email}</Text>
      <Text style={{ color: "#999", fontSize: 12 }}>
        Role: {session.user.role}
      </Text>

      <TouchableOpacity
        onPress={handleSignOut}
        style={{
          marginTop: 16,
          backgroundColor: "#EF4444",
          padding: 12,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## OAuth Flow Explained

### Step-by-Step Process

1. **User clicks "Sign in with Google"**
   - Frontend calls `signIn.social({ provider: "google" })`
   - Opens browser/in-app browser to `/api/v1/auth/sign-in/google`

2. **Backend redirects to Google**
   - Better-auth redirects user to Google OAuth consent screen
   - User sees "Allow [Your App] to access your Google account?"

3. **User grants permission**
   - Google redirects back to your backend at `/api/v1/auth/callback/google`
   - Sends authorization code to your backend

4. **Backend processes OAuth callback**
   - Exchanges authorization code for user info from Google
   - Checks if user exists in database:
     - **If exists:** Retrieve user
     - **If new:** Create new user with role = USER
   - Creates session in database
   - Sets httpOnly session cookie

5. **Frontend receives authentication**
   - Browser/app receives cookie (automatic)
   - Redirects to `callbackURL` (e.g., `/dashboard`)
   - All subsequent requests include session cookie

6. **Session validation on requests**
   - Every API request includes session cookie
   - Backend validates session on protected routes
   - Returns user data or 401 Unauthorized

### Visual Flow

```
┌─────────┐                ┌─────────┐                ┌────────┐
│ Frontend│                │ Backend │                │ Google │
└────┬────┘                └────┬────┘                └───┬────┘
     │                          │                         │
     │ 1. Click "Sign in"       │                         │
     ├─────────────────────────>│                         │
     │                          │ 2. Redirect to Google   │
     │                          ├────────────────────────>│
     │                          │                         │
     │                          │ 3. User grants access   │
     │                          │<────────────────────────┤
     │                          │                         │
     │                          │ 4. Exchange code        │
     │                          │    Get user info        │
     │                          │    Create session       │
     │                          │                         │
     │ 5. Redirect with cookie  │                         │
     │<─────────────────────────┤                         │
     │                          │                         │
     │ 6. Make API requests     │                         │
     │    (cookie included)     │                         │
     ├─────────────────────────>│                         │
     │                          │                         │
```

---

## Configuration

### Backend Configuration

Ensure your backend has the correct CORS and trusted origins:

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  // ... other config
  trustedOrigins: [
    process.env.BETTER_AUTH_URL,
    "https://your-frontend.com",           // Production web
    "https://your-app.vercel.app",         // Preview deployments
    "myapp://*",                           // React Native deep links
  ],
});
```

```typescript
// src/middleware/cors.ts
const allowedOrigins = [
  "http://localhost:3000",    // Local web
  "http://localhost:8081",    // Expo dev
  "https://your-frontend.com", // Production
];
```

### Environment Variables

**Backend (.env):**

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/myapp

# Better-auth
BETTER_AUTH_SECRET=your_32_character_secret_here
BETTER_AUTH_URL=https://api.yourapp.com

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdef.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@yourapp.com
```

**Frontend (.env.local):**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# or
NEXT_PUBLIC_API_URL=https://api.yourapp.com
```

---

## TypeScript Types

### User Type

```typescript
export type User = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  role: "USER" | "ADMIN" | "MODERATOR";
  createdAt: Date;
  updatedAt: Date;
};
```

### Session Type

```typescript
export type Session = {
  user: User;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  };
};
```

### Usage in Components

```typescript
import type { User, Session } from "@/types/auth";

function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <span>Role: {user.role}</span>
    </div>
  );
}
```

---

## Security Best Practices

### 1. Cookie Security

Better-auth automatically sets secure cookies with:

- `httpOnly: true` - Prevents JavaScript access (XSS protection)
- `secure: true` - HTTPS only (in production)
- `sameSite: 'lax'` - CSRF protection

### 2. CORS Configuration

Only allow trusted origins:

```typescript
trustedOrigins: [
  process.env.BETTER_AUTH_URL,
  "https://your-app.com",
  // DO NOT use "*" in production
]
```

### 3. Environment Variables

Never commit secrets:

```bash
# .gitignore
.env
.env.local
.env.production
```

### 4. HTTPS in Production

Always use HTTPS for:
- Backend API
- Frontend application
- OAuth redirects

### 5. Callback URL Validation

Better-auth validates callback URLs against `trustedOrigins` automatically. Never disable this in production.

### 6. Session Expiration

Sessions expire based on Better-auth configuration. Configure appropriate timeout:

```typescript
// src/lib/auth.ts
export const auth = betterAuth({
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Refresh daily
  },
  // ... other config
});
```

### 7. Rate Limiting

The backend already has rate limiting on auth endpoints to prevent brute force attacks.

---

## Troubleshooting

### Issue: "CORS error" in browser console

**Solution:** Add your frontend URL to `trustedOrigins` in `src/lib/auth.ts`

### Issue: OAuth redirect not working in React Native

**Solution:** Ensure deep linking is configured correctly in `app.json` or native config files

### Issue: Session not persisting

**Solution:**
- Check that cookies are enabled
- Verify `credentials: 'include'` in fetch requests
- Ensure backend CORS allows credentials

### Issue: "Invalid callback URL"

**Solution:** Verify the callback URL matches one of the `trustedOrigins`

---

## Examples Repository

For complete working examples, see:

- **Web Example:** Coming soon
- **React Native Example:** Coming soon

## Support

For issues or questions:
- Check [Better-auth Documentation](https://better-auth.com)
- Open an issue in the repository
- Contact support team

---

**Last Updated:** December 2025
