import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let app: any = null;
let authInstance: any = null;
let dbInstance: Firestore | null = null;

try {
  if (typeof window !== 'undefined') {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    // Ensure auth local persistence so the browser remembers user sessions across reloads
    try {
      setPersistence(authInstance, browserLocalPersistence).catch((err) => {
        console.warn('Set auth persistence notice:', err);
      });
    } catch {}

    dbInstance = (firebaseConfig as any).firestoreDatabaseId
      ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
      : getFirestore(app);
  }
} catch (e) {
  console.warn('Firebase initialization warning (fallback to demo mode):', e);
}

export const auth = authInstance;
export const db = dbInstance;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code || '';

  const isNetworkOrOffline =
    errCode === 'unavailable' ||
    errCode === 'failed-precondition' ||
    errMsg.includes('offline') ||
    errMsg.includes('client is offline') ||
    errMsg.includes('backend') ||
    errMsg.includes('Failed to get document because the client is offline');

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider: any) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };

  // Only throw fatal permissions-related errors so the diagnostics engine can detect security rule issues.
  if (
    errCode === 'permission-denied' ||
    errCode === 'unauthenticated' ||
    errMsg.includes('insufficient permissions') ||
    errMsg.includes('Missing or insufficient permissions')
  ) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  // If it's a standard offline/unavailable state, silence or log discretely without triggering console warning alerts
  if (!isNetworkOrOffline) {
    console.info('Firestore notice:', errMsg);
  }
}

const provider = new GoogleAuthProvider();
// Workspace Gmail scope for reading transaction notices and receipts
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
// Request offline/prompt if needed
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
const TOKEN_STORAGE_KEY = 'app_google_access_token_session';
const TOKEN_EXPIRY_KEY = 'app_google_access_token_exp';

// Clean up any legacy localStorage tokens for security
try {
  localStorage.removeItem('app_google_access_token');
} catch {}

let cachedAccessToken: string | null = (() => {
  try {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
    const expStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (token && expStr) {
      const expiresAt = parseInt(expStr, 10);
      if (Date.now() < expiresAt) {
        return token;
      }
    }
    // Expired or absent
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    return null;
  } catch {
    return null;
  }
})();

function persistTokenSafely(token: string | null) {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
      // Standard Google OAuth token lasts ~3600 seconds, store with safety buffer (55 mins)
      sessionStorage.setItem(
        TOKEN_EXPIRY_KEY,
        String(Date.now() + 55 * 60 * 1000)
      );
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  } catch {}
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  if (!auth) {
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
  try {
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const token = await getAccessToken();
        if (onAuthSuccess) {
          onAuthSuccess(user, token);
        }
      } else {
        persistTokenSafely(null);
        if (onAuthFailure) {
          onAuthFailure();
        }
      }
    });
  } catch (err) {
    console.warn('Auth state change listener error:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  if (!auth) {
    throw new Error(
      'Firebase Auth is not initialized. Please verify configuration.'
    );
  }
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';

    persistTokenSafely(accessToken);

    return { user: result.user, accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) {
    // Check expiration
    try {
      const expStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
      if (expStr && Date.now() > parseInt(expStr, 10)) {
        persistTokenSafely(null);
        return null;
      }
    } catch {}
    return cachedAccessToken;
  }
  try {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || null;
    const expStr = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (token && expStr && Date.now() < parseInt(expStr, 10)) {
      cachedAccessToken = token;
      return token;
    }
    persistTokenSafely(null);
    return null;
  } catch {
    return null;
  }
};

export const setAccessTokenManually = (token: string | null) => {
  persistTokenSafely(token);
};

export const logout = async () => {
  if (auth) {
    await signOut(auth);
  }
  persistTokenSafely(null);
};
