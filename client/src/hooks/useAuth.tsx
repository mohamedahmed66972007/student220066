import { createContext, useState, useContext, useEffect, ReactNode } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  userName: string;
  adminNumber: number;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserName: (name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_UIDS = {
  "oSonmcTdxwSeWsKBf7lXqtA1pLf2": 1
  // يمكن إضافة المزيد من المشرفين هنا مع أرقامهم
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");
  const [adminNumber, setAdminNumber] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // التحقق من كون المستخدم مشرف
        const adminNum = ADMIN_UIDS[user.uid as keyof typeof ADMIN_UIDS];
        setIsAdmin(!!adminNum);
        setAdminNumber(adminNum || 0);

        // جلب اسم المستخدم من Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().name || user.displayName || "");
          } else {
            setUserName(user.displayName || "");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserName(user.displayName || "");
        }
      } else {
        setIsAdmin(false);
        setUserName("");
        setAdminNumber(0);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // التحقق من كون المستخدم مشرف
      const adminNum = ADMIN_UIDS[userCredential.user.uid as keyof typeof ADMIN_UIDS];
      const isUserAdmin = !!adminNum;

      // عدم طلب التحقق من الإيميل إذا كان المستخدم مشرف
      if (!isUserAdmin && !userCredential.user.emailVerified) {
        await signOut(auth);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // تحديث الملف الشخصي
      await updateProfile(userCredential.user, { displayName: name });

      // حفظ بيانات المستخدم في Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: name,
        email: email,
        createdAt: new Date()
      });

      // إرسال رابط التحقق من البريد الإلكتروني
      await sendEmailVerification(userCredential.user);

      // تسجيل الخروج حتى يتم التحقق من البريد
      await signOut(auth);

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
  };

  const updateUserName = async (name: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await updateProfile(user, { displayName: name });
      await updateDoc(doc(db, "users", user.uid), { name });
      setUserName(name);
      return true;
    } catch (error) {
      console.error("Error updating name:", error);
      return false;
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin, 
      userName, 
      adminNumber,
      login, 
      register, 
      logout, 
      updateUserName,
      resetPassword,
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};