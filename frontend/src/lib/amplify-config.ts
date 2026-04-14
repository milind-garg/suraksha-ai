import { Amplify } from 'aws-amplify'

export function configureAmplify() {
  const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID
  const userPoolClientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID

  if (!userPoolId || !userPoolClientId) {
    console.warn(
      'Amplify configuration is incomplete. ' +
      'Set NEXT_PUBLIC_USER_POOL_ID and NEXT_PUBLIC_USER_POOL_CLIENT_ID to enable authentication.'
    )
    return
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        signUpVerificationMethod: 'code',
        loginWith: {
          email: true,
        }
      }
    }
  })
}