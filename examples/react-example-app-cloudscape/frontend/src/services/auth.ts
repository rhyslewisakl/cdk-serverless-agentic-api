import { signIn, signUp, confirmSignUp, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
}

export interface ConfirmSignUpParams {
  email: string;
  confirmationCode: string;
}

export const authService = {
  async signIn({ email, password }: SignInParams) {
    return await signIn({ username: email, password });
  },

  async signUp({ email, password }: SignUpParams) {
    return await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });
  },

  async confirmSignUp({ email, confirmationCode }: ConfirmSignUpParams) {
    return await confirmSignUp({
      username: email,
      confirmationCode,
    });
  },

  async signOut() {
    return await signOut();
  },

  async getCurrentUser() {
    try {
      return await getCurrentUser();
    } catch {
      return null;
    }
  },

  async getAuthToken() {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.idToken?.toString();
    } catch {
      return null;
    }
  },
};