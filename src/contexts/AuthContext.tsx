import { auth } from "@/lib/firebase";
import {
  deleteSecureItem,
  getSecureItem,
  setSecureItem,
} from "@/lib/secureStorage";
import * as LocalAuthentication from "expo-local-authentication";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

// Ključevi za SecureStore (enkriptovano spremište na uređaju)
const SK_EMAIL = "biometric_email";
const SK_PASSWORD = "biometric_password";
const SK_ENABLED = "biometric_enabled";

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  authReady: boolean;

  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Biometrijska prijava (hardverska funkcionalnost)
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  enableBiometric: (email: string, password: string) => Promise<void>;
  disableBiometric: () => Promise<void>;
  loginWithBiometric: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Pretvara Firebase auth greške u čitljive poruke na našem jeziku. */
function friendlyAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: string }).code)
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Neispravna email adresa.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Pogrešna lozinka.";
    case "auth/invalid-credential":
      return "Pogrešan email ili lozinka.";
    case "auth/email-already-in-use":
      return "Email adresa je već registrovana.";
    case "auth/weak-password":
      return "Lozinka mora imati najmanje 6 znakova.";
    case "auth/network-request-failed":
      return "Greška mreže. Provjerite internet vezu.";
    case "auth/too-many-requests":
      return "Previše pokušaja. Pokušajte ponovo kasnije.";
    default:
      return "Došlo je do greške. Pokušajte ponovo.";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // Prati stanje prijave kroz Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Provjeri da li uređaj podržava biometriju i da li je korisnik omogućio.
  // Biometrija i sigurno spremište rade samo na native platformama (ne na webu).
  useEffect(() => {
    (async () => {
      if (Platform.OS === "web") {
        setBiometricAvailable(false);
        return;
      }
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);

      const enabled = await getSecureItem(SK_ENABLED);
      setBiometricEnabled(enabled === "true");
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  /** Verifikuje lozinku kroz Firebase, pa je sprema u SecureStore i uključuje
   * biometriju. Ako je lozinka pogrešna, baca grešku i NE sprema ništa. */
  const enableBiometric = useCallback(
    async (email: string, password: string) => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Niste prijavljeni.");
      }

      // Provjeri da je lozinka tačna prije nego je spremimo (re-autentikacija).
      // Email je ovdje fiksiran (trenutni korisnik), pa je svaka credential
      // greška zapravo pogrešna lozinka.
      const credential = EmailAuthProvider.credential(email.trim(), password);
      try {
        await reauthenticateWithCredential(currentUser, credential);
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code: string }).code)
            : "";
        if (
          code === "auth/invalid-credential" ||
          code === "auth/wrong-password"
        ) {
          throw new Error("Pogrešna lozinka.");
        }
        throw new Error(friendlyAuthError(error));
      }

      await setSecureItem(SK_EMAIL, email.trim());
      await setSecureItem(SK_PASSWORD, password);
      await setSecureItem(SK_ENABLED, "true");
      setBiometricEnabled(true);
    },
    []
  );

  const disableBiometric = useCallback(async () => {
    await deleteSecureItem(SK_EMAIL);
    await deleteSecureItem(SK_PASSWORD);
    await deleteSecureItem(SK_ENABLED);
    setBiometricEnabled(false);
  }, []);

  /** Traži biometriju, čita kredencijale iz SecureStore-a i prijavljuje. */
  const loginWithBiometric = useCallback(async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Prijava biometrijom",
      cancelLabel: "Otkaži",
      disableDeviceFallback: false,
    });
    if (!result.success) {
      throw new Error("Biometrijska prijava nije uspjela.");
    }

    const email = await getSecureItem(SK_EMAIL);
    const password = await getSecureItem(SK_PASSWORD);
    if (!email || !password) {
      throw new Error("Nema spremljenih podataka za biometrijsku prijavu.");
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(friendlyAuthError(error));
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      authReady,
      login,
      register,
      logout,
      biometricAvailable,
      biometricEnabled,
      enableBiometric,
      disableBiometric,
      loginWithBiometric,
    }),
    [
      user,
      authReady,
      login,
      register,
      logout,
      biometricAvailable,
      biometricEnabled,
      enableBiometric,
      disableBiometric,
      loginWithBiometric,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth mora biti korišten unutar AuthProvider-a.");
  }
  return context;
}
