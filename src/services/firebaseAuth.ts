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

// Standard Google Auth Provider (basic profile & email - never blocked by unverified app checks)
const baseGoogleProvider = new GoogleAuthProvider();
baseGoogleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Workspace Gmail Provider (includes gmail.readonly for automatic inbox parsing)
const gmailGoogleProvider = new GoogleAuthProvider();
gmailGoogleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
gmailGoogleProvider.setCustomParameters({
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

export interface ParsedAuthError {
  code: string;
  messageEn: string;
  messageId: string;
  domain?: string;
  actionableStepEn: string;
  actionableStepId: string;
  isDomainError: boolean;
  isPopupBlocked: boolean;
  isProviderDisabled: boolean;
  isVerificationError?: boolean;
}

export function parseAuthError(error: any): ParsedAuthError {
  const code = error?.code || '';
  const rawMsg = error?.message || String(error || '');
  const currentHost =
    typeof window !== 'undefined' ? window.location.hostname : 'preview domain';

  const activeProjectId =
    (firebaseConfig as any)?.projectId || 'expensivemail-391e7';

  // Check for Google OAuth verification / restricted scope blocks
  if (
    rawMsg.includes('verifikasi Google') ||
    rawMsg.includes('verification') ||
    rawMsg.includes('Akses diblokir') ||
    rawMsg.includes('Access blocked') ||
    rawMsg.includes('has not completed the Google verification process') ||
    rawMsg.includes('access_denied') ||
    code === 'auth/access-denied'
  ) {
    return {
      code: 'auth/oauth-unverified-app',
      messageEn: 'Google App Verification / Test User Required for Gmail Scope',
      messageId:
        'Verifikasi Aplikasi Google / Pengguna Uji Coba Diperlukan untuk Gmail',
      domain: currentHost,
      actionableStepEn: `Add your Google email to Google Cloud Console -> APIs & Services -> OAuth consent screen -> Test users for project '${activeProjectId}', or sign in with Standard mode.`,
      actionableStepId: `Tambahkan email Google Anda ke Google Cloud Console -> APIs & Services -> Layar izin OAuth -> Pengguna uji coba pada project '${activeProjectId}', atau masuk dengan mode Standar.`,
      isDomainError: false,
      isPopupBlocked: false,
      isProviderDisabled: false,
      isVerificationError: true,
    };
  }

  if (
    code === 'auth/unauthorized-domain' ||
    rawMsg.includes('unauthorized-domain') ||
    rawMsg.includes('not authorized to run this operation')
  ) {
    return {
      code: 'auth/unauthorized-domain',
      messageEn: `Unauthorized Domain (${currentHost})`,
      messageId: `Domain Belum Diizinkan (${currentHost})`,
      domain: currentHost,
      actionableStepEn: `Add '${currentHost}' to Firebase Console -> Authentication -> Settings -> Authorized Domains for project '${activeProjectId}'.`,
      actionableStepId: `Tambahkan '${currentHost}' di Firebase Console -> Authentication -> Settings -> Authorized Domains pada project '${activeProjectId}'.`,
      isDomainError: true,
      isPopupBlocked: false,
      isProviderDisabled: false,
      isVerificationError: false,
    };
  }

  if (code === 'auth/popup-blocked' || rawMsg.includes('popup-blocked')) {
    return {
      code: 'auth/popup-blocked',
      messageEn: 'Popup Blocked by Browser or Iframe',
      messageId: 'Popup Diblokir oleh Browser atau Iframe',
      domain: currentHost,
      actionableStepEn:
        'Allow popups for this site or open the preview in a new browser tab.',
      actionableStepId:
        'Izinkan popup di browser Anda atau buka pratinjau ini di tab browser baru.',
      isDomainError: false,
      isPopupBlocked: true,
      isProviderDisabled: false,
      isVerificationError: false,
    };
  }

  if (
    code === 'auth/operation-not-allowed' ||
    rawMsg.includes('operation-not-allowed')
  ) {
    return {
      code: 'auth/operation-not-allowed',
      messageEn: 'Google Sign-in Provider Not Enabled',
      messageId: 'Metode Masuk Google Belum Diaktifkan',
      domain: currentHost,
      actionableStepEn:
        "Enable 'Google' sign-in provider in Firebase Console -> Authentication -> Sign-in method.",
      actionableStepId:
        "Aktifkan provider 'Google' di Firebase Console -> Authentication -> Sign-in method.",
      isDomainError: false,
      isPopupBlocked: false,
      isProviderDisabled: true,
      isVerificationError: false,
    };
  }

  if (
    code === 'auth/popup-closed-by-user' ||
    rawMsg.includes('popup-closed-by-user')
  ) {
    return {
      code: 'auth/popup-closed-by-user',
      messageEn: 'Sign-in window closed before completing authentication.',
      messageId: 'Jendela login ditutup sebelum proses selesai.',
      domain: currentHost,
      actionableStepEn:
        'Click the Google Sign-in button again to complete authentication.',
      actionableStepId:
        'Klik tombol Masuk dengan Google lagi untuk menyelesaikan proses.',
      isDomainError: false,
      isPopupBlocked: false,
      isProviderDisabled: false,
      isVerificationError: false,
    };
  }

  return {
    code: code || 'auth/unknown-error',
    messageEn: rawMsg || 'Failed to authenticate with Google.',
    messageId: rawMsg || 'Gagal melakukan autentikasi dengan akun Google.',
    domain: currentHost,
    actionableStepEn:
      'Verify your internet connection or use Quick Demo Sign-in.',
    actionableStepId:
      'Periksa koneksi internet Anda atau gunakan Masuk Cepat Demo.',
    isDomainError: false,
    isPopupBlocked: false,
    isProviderDisabled: false,
    isVerificationError: false,
  };
}

export const googleSignIn = async (
  options: { includeGmailScope?: boolean } = {}
): Promise<{
  user: User;
  accessToken: string;
  hasGmailScope: boolean;
} | null> => {
  if (!auth) {
    throw new Error(
      'Firebase Auth is not initialized. Please verify configuration.'
    );
  }
  try {
    isSigningIn = true;
    const providerToUse = options.includeGmailScope
      ? gmailGoogleProvider
      : baseGoogleProvider;

    const result = await signInWithPopup(auth, providerToUse);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';

    if (accessToken) {
      persistTokenSafely(accessToken);
    }

    return {
      user: result.user,
      accessToken,
      hasGmailScope: Boolean(options.includeGmailScope && accessToken),
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const requestGmailPermission = async (): Promise<string | null> => {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }
  try {
    const result = await signInWithPopup(auth, gmailGoogleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || '';
    if (accessToken) {
      persistTokenSafely(accessToken);
      return accessToken;
    }
    return null;
  } catch (error) {
    console.error('Request Gmail Permission error:', error);
    throw error;
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
