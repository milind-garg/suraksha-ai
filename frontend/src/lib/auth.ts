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
    const email = claims?.email || user.username
    const name = claims?.name || claims?.email?.split('@')[0] || user.username
    const phone = claims?.phone_number

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