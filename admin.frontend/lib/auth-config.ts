import { Amplify } from 'aws-amplify';

// Inicializáljuk az Amplify Auth modult a Cognito adatokkal
if (typeof window !== 'undefined') {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID!,
        // Mivel public client-et használunk, a flow típusát USER_PASSWORD_AUTH-ra állítjuk
        loginWith: {
          username: true
        }
      }
    }
  });
}