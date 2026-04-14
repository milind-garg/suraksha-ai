import {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
  type SignUpOutput,
  type SignInOutput
} from 'aws-amplify/auth'

// ─── Sign Up ───────────────────────────────────────────
export async function registerUser(
  email: string,
  password: string,
  name: string,
  phone?: string
): Promise<SignUpOutput> {
  const result = await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name,
        ...(phone && { phone_number: phone })
      }
    }
  })
  return result
}

// ─── Confirm OTP ───────────────────────────────────────
export async function confirmOTP(
  email: string,
  code: string
): Promise<void> {
  await confirmSignUp({
    username: email,
    confirmationCode: code
  })
}

// ─── Resend OTP ────────────────────────────────────────
export async function resendOTP(email: string): Promise<void> {
  await resendSignUpCode({ username: email })
}

// ─── Login ─────────────────────────────────────────────
export async function loginUser(
  email: string,
  password: string
): Promise<SignInOutput> {
  const result = await signIn({
    username: email,
    password
  })
  return result
}

// ─── Logout ────────────────────────────────────────────
export async function logoutUser(): Promise<void> {
  await signOut()
}

// ─── Get Current User ──────────────────────────────────
export async function getCurrentUserInfo() {
  try {
    const user = await getCurrentUser()
    const session = await fetchAuthSession()
    const token = session.tokens?.idToken?.toString()

    // Extract user attributes from ID token claims
    const claims = session.tokens?.idToken?.payload
    const emailClaim = claims?.email as string | undefined
    const email = emailClaim ?? user.username
    const name = (claims?.name as string | undefined) ?? emailClaim?.split('@')[0] ?? user.username
    const phone = claims?.phone_number as string | undefined

    return {
      user: {
        userId: user.userId,
        username: user.username,
        email,
        name,
        phone
      },
      token
    }
  } catch {
    return null
  }
}

// ─── Get Auth Token ────────────────────────────────────
export async function getAuthToken(): Promise<string | null> {
  try {
    const session = await fetchAuthSession()
    return session.tokens?.idToken?.toString() || null
  } catch {
    return null
  }
}

// ─── Update User Profile ───────────────────────────────
export async function updateUserProfile(userData: {
  name?: string
  phone?: string
}): Promise<any> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const token = localStorage.getItem('auth_token')

    // If demo token, just return success
    if (token === 'demo-token') {
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
      const updated = { ...user, ...userData }
      localStorage.setItem('auth_user', JSON.stringify(updated))
      return updated
    }

    // Update via API
    const response = await fetch(`${apiUrl}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `Failed to update profile (${response.status})`)
    }

    return await response.json()
  } catch (err: any) {
    throw new Error(err.message || 'Failed to update profile')
  }
}