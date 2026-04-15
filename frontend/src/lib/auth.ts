import {
  signUp,
  signIn,
  signOut,
  confirmSignUp,
  resendSignUpCode,
  getCurrentUser,
  fetchAuthSession,
  updateUserAttributes,
  resetPassword,
  confirmResetPassword,
  type SignUpOutput,
  type SignInOutput,
  type ResetPasswordOutput
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

// ─── Forgot Password (send reset code) ─────────────────
export async function forgotPassword(email: string): Promise<ResetPasswordOutput> {
  return await resetPassword({ username: email })
}

// ─── Confirm Forgot Password ───────────────────────────
export async function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<void> {
  await confirmResetPassword({
    username: email,
    confirmationCode: code,
    newPassword
  })
}

// ─── Update User Profile ───────────────────────────────
export async function updateUserProfile(userData: {
  name?: string
  phone?: string
}): Promise<any> {
  try {
    // Check for demo token via Amplify: if there's no real Cognito session we
    // fall back to updating sessionStorage so the demo flow still works.
    const session = await fetchAuthSession().catch(() => null)
    const hasRealSession = !!(session?.tokens?.idToken)

    if (!hasRealSession) {
      const raw = typeof window !== 'undefined'
        ? sessionStorage.getItem('auth_user')
        : null
      const user = raw ? JSON.parse(raw) : {}
      const updated = { ...user, ...userData }
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('auth_user', JSON.stringify(updated))
      }
      return updated
    }

    // Update user attributes in Cognito directly
    const attributes: Record<string, string> = {}
    if (userData.name !== undefined) attributes['name'] = userData.name
    if (userData.phone !== undefined) attributes['phone_number'] = userData.phone

    await updateUserAttributes({ userAttributes: attributes })

    return userData
  } catch (err: unknown) {
    throw new Error(err instanceof Error ? err.message : 'Failed to update profile')
  }
}