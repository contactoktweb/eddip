'use client';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { baseCourses, certificates } from '@/lib/data';
import type { Course, Certificate } from '@/lib/types';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { studentService } from '@/lib/supabase/studentService';
import { adminService } from '@/lib/supabase/adminService';
import { contentService } from '@/lib/supabase/contentService';
import type { StudentProfile } from '@/lib/supabase/types';
import { normalizeRole, type AppRole } from '@/lib/auth/roles';

type Role = 'guest' | AppRole;
type Result = { score: number; passed: boolean; correct?: number; total?: number; code?: string };

export type StudentContextType = {
  role: Role;
  user: { name: string; email: string; id?: string; documentId?: string; phone?: string; city?: string };
  courses: Course[];
  purchased: string[];
  completed: Record<string, string[]>;
  results: Record<string, Result>;
  certs: Certificate[];
  notes: Record<string, string>; // key: courseSlug_lessonId -> noteText
  authLoading: boolean;
  /** true cuando ya se restauró la sesión de Supabase y el rol (leído de public.profiles) es definitivo. */
  sessionReady: boolean;
  logout: () => Promise<void>;
  purchase: (slug: string) => void;
  toggleLesson: (slug: string, lessonId: string) => Promise<void>;
  saveResult: (slug: string, result: Result) => Promise<void>;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (slug: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<StudentProfile>) => Promise<boolean>;
  saveNote: (courseSlug: string, lessonId: string, text: string) => Promise<void>;
  signUpStudent: (params: { email: string; password: string; fullName: string; documentId?: string; phone?: string; city?: string }) => Promise<{ success: boolean; error: string | null; role?: AppRole }>;
  signInStudent: (email: string, pass: string) => Promise<{ success: boolean; error: string | null; role?: AppRole }>;
};

const C = createContext<StudentContextType | null>(null);
const KEY = 'eddip-demo-v2';

const emptyProfile = { name: '', email: '', documentId: '', phone: '', city: '' };

type ProfileRow = { role: string | null; full_name: string | null; document_id: string | null; phone: string | null; city: string | null };

/** El rol se lee de public.profiles (protegido por RLS y trigger); nunca de user_metadata ni de localStorage. */
async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, document_id, phone, city')
      .eq('id', userId)
      .maybeSingle();
    return (data as ProfileRow | null) ?? null;
  } catch {
    return null;
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState<Role>('guest');
  const [userProfile, setUserProfile] = useState<{
    id?: string;
    name: string;
    email: string;
    documentId?: string;
    phone?: string;
    city?: string;
  }>(emptyProfile);

  const [purchased, setPurchased] = useState<string[]>([]);
  const [completed, setCompleted] = useState<Record<string, string[]>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [extraCourses, setExtraCourses] = useState<Course[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [remoteCourses, setRemoteCourses] = useState<Course[]>([]);
  const [remoteCerts, setRemoteCerts] = useState<Certificate[]>([]);

  // Cargar cursos y certificados en tiempo real desde Supabase
  useEffect(() => {
    let mounted = true;
    contentService.getCourses().then(c => {
      if (mounted && c && c.length > 0) {
        setRemoteCourses(c);
      }
    });
    contentService.getCertificates().then(certs => {
      if (mounted && certs && certs.length > 0) {
        setRemoteCerts(certs);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 1. Cursos creados desde el panel de administración guardados en este navegador
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      let loadedExtra: Course[] = [];
      if (raw) {
        const s = JSON.parse(raw);
        if (Array.isArray(s.extraCourses)) loadedExtra = s.extraCourses;
      }

      const adminRaw = localStorage.getItem('eddip_admin_extra_courses') || localStorage.getItem('extra_courses');
      if (adminRaw) {
        try {
          const adminExtra: Course[] = JSON.parse(adminRaw);
          if (Array.isArray(adminExtra)) {
            const map = new Map<string, Course>();
            for (const c of adminExtra) map.set(c.slug, c);
            for (const c of loadedExtra) {
              if (!map.has(c.slug)) map.set(c.slug, c);
            }
            loadedExtra = Array.from(map.values());
          }
        } catch {}
      }

      if (loadedExtra.length > 0) {
        setExtraCourses(loadedExtra);
      }
    } catch (e) {
      console.warn('LocalStorage error', e);
    } finally {
      setLoaded(true);
    }
  }, []);

  const resetSessionState = useCallback(() => {
    setRole('guest');
    setUserProfile(emptyProfile);
    setPurchased([]);
    setCompleted({});
    setResults({});
    setNotes({});
  }, []);

  /** Aplica la sesión verificada de Supabase: rol desde profiles y progreso guardado de esa cuenta. */
  const applySession = useCallback(async (u: User): Promise<AppRole> => {
    const email = (u.email || '').trim().toLowerCase();
    const meta = u.user_metadata || {};
    const profileRow = await fetchProfileRow(u.id);
    const resolvedRole = normalizeRole(profileRow?.role);

    setRole(resolvedRole);
    setUserProfile({
      id: u.id,
      name: profileRow?.full_name || meta.full_name || email.split('@')[0] || 'Estudiante EDDIP',
      email,
      documentId: profileRow?.document_id || meta.document_id || '',
      phone: profileRow?.phone || meta.phone || '',
      city: profileRow?.city || meta.city || '',
    });

    try {
      const userStored = localStorage.getItem(`eddip_user_${email}`);
      const parsed = userStored ? JSON.parse(userStored) : null;
      setPurchased(Array.isArray(parsed?.purchased) ? parsed.purchased : []);
      setCompleted(parsed?.completed || {});
      setResults(parsed?.results || {});
      setNotes(parsed?.notes || {});
    } catch {
      setPurchased([]);
      setCompleted({});
      setResults({});
      setNotes({});
    }

    return resolvedRole;
  }, []);

  // 2. Escuchar sesión de Supabase Auth
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        if (data.session?.user) await applySession(data.session.user);
      })
      .catch(err => console.warn('Supabase session load error:', err))
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT') {
        resetSessionState();
      } else if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        // Diferido: supabase-js no permite esperar otras consultas dentro de este callback
        const sessionUser = session.user;
        setTimeout(() => {
          if (mounted) applySession(sessionUser).catch(() => {});
        }, 0);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [applySession, resetSessionState]);

  // 3. Persistir progreso local (el rol nunca se guarda en el navegador)
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ extraCourses }));

      if (userProfile?.email) {
        const cleanEmail = userProfile.email.trim().toLowerCase();
        localStorage.setItem(
          `eddip_user_${cleanEmail}`,
          JSON.stringify({
            userProfile,
            purchased,
            completed,
            results,
            notes,
          })
        );
      }
    } catch {
      // Ignore quota exceeded
    }
  }, [loaded, userProfile, purchased, completed, results, extraCourses, notes]);

  const logout = useCallback(async () => {
    try {
      await studentService.signOut();
    } catch {
      // Ignore
    }
    resetSessionState();
  }, [resetSessionState]);

  const purchase = useCallback((slug: string) => {
    setPurchased(v => {
      // La matrícula en base de datos la registra el servidor (/api/checkout/complete)
      if (v.includes(slug)) return v;
      setExtraCourses(prev => {
        const existing = prev.find(c => c.slug === slug);
        if (existing) {
          return prev.map(c => (c.slug === slug ? { ...c, students: (c.students || 0) + 1 } : c));
        }
        const base = (remoteCourses.length > 0 ? remoteCourses : baseCourses).find(c => c.slug === slug);
        if (base) {
          return [{ ...base, students: (base.students || 0) + 1 }, ...prev];
        }
        return prev;
      });
      return [...v, slug];
    });
  }, [remoteCourses]);

  const toggleLesson = useCallback(async (slug: string, id: string) => {
    const isCurrentlyDone = (completed[slug] || []).includes(id);
    setCompleted(v => {
      const arr = v[slug] || [];
      return {
        ...v,
        [slug]: isCurrentlyDone ? arr.filter(x => x !== id) : [...arr, id],
      };
    });

    if (userProfile.id) {
      try {
        await studentService.toggleLesson(userProfile.id, slug, id, isCurrentlyDone);
      } catch (e) {
        console.warn('Sync lesson error:', e);
      }
    }
  }, [completed, userProfile.id]);

  const saveResult = useCallback(async (slug: string, result: Result) => {
    // Buscar curso en todos los cursos conocidos (base, extra y remotos)
    const allKnownCourses = [...baseCourses, ...extraCourses, ...remoteCourses];
    const course = allKnownCourses.find(c => c.slug === slug);

    const courseTitle = course?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const courseHours = course?.durationHours || 80;

    const certCode =
      result.code ||
      (result.passed ? `EDDIP-2026-${Math.floor(100000 + Math.random() * 900000)}` : undefined);

    const enrichedResult = { ...result, code: certCode };
    setResults(v => ({ ...v, [slug]: enrichedResult }));

    if (result.passed && certCode) {
      const issueDateStr = new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(new Date());

      const certObj: Certificate = {
        code: certCode,
        student: userProfile.name || 'Estudiante EDDIP',
        documentId: userProfile.documentId || '',
        courseSlug: slug,
        course: courseTitle,
        hours: courseHours,
        date: issueDateStr,
        status: 'Válido',
      };

      // Agregar inmediatamente a certificados en memoria
      setRemoteCerts(prev => [certObj, ...prev.filter(c => c.code !== certCode)]);

      try {
        await studentService.saveExamResult({
          studentId: userProfile.id || '',
          studentName: userProfile.name,
          courseSlug: slug,
          courseTitle,
          score: result.score,
          passed: result.passed,
          totalQuestions: result.total || 5,
          correctAnswers: result.correct || 4,
          submittedAt: new Date().toISOString(),
          certificateCode: certCode,
        });

        await studentService.issueCertificate(
          {
            code: certCode,
            studentName: userProfile.name || 'Estudiante EDDIP',
            documentId: userProfile.documentId || '',
            courseSlug: slug,
            courseTitle,
            hours: courseHours,
            status: 'Válido',
            issueDate: issueDateStr,
          },
          userProfile.id
        );

      } catch (err) {
        console.warn('Error saving exam/certificate:', err);
      }
    }
  }, [extraCourses, remoteCourses, userProfile]);

  const addCourse = useCallback((course: Course) => {
    setExtraCourses(v => [course, ...v]);
  }, []);

  const updateCourse = useCallback((course: Course) => {
    setExtraCourses(v => {
      const idx = v.findIndex(c => c.slug === course.slug || c.id === course.id);
      if (idx >= 0) {
        const copy = [...v];
        copy[idx] = course;
        return copy;
      }
      return [course, ...v];
    });
  }, []);

  const deleteCourse = useCallback(async (slug: string) => {
    const result = await adminService.deleteCourse(slug);
    if (result.success) {
      setExtraCourses(v => v.filter(c => c.slug !== slug));
      setRemoteCourses(v => v.filter(c => c.slug !== slug));
    }
    return result;
  }, []);

  const updateProfile = useCallback(async (data: Partial<StudentProfile>): Promise<boolean> => {
    setUserProfile(prev => {
      const updated = {
        ...prev,
        name: data.fullName || prev.name,
        email: data.email || prev.email,
        documentId: data.documentId || prev.documentId,
        phone: data.phone || prev.phone,
        city: data.city || prev.city,
      };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('eddip_student_profile', JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    if (userProfile.id) {
      return await studentService.updateProfile(userProfile.id, data);
    }
    return true;
  }, [userProfile.id]);

  const saveNote = useCallback(async (courseSlug: string, lessonId: string, text: string) => {
    const key = `${courseSlug}_${lessonId}`;
    setNotes(prev => ({ ...prev, [key]: text }));

    if (userProfile.id) {
      try {
        await studentService.saveLessonNote(userProfile.id, courseSlug, lessonId, text);
      } catch (err) {
        console.warn('Error saving note to Supabase:', err);
      }
    }
  }, [userProfile.id]);

  const signUpStudent = useCallback(async (params: {
    email: string;
    password: string;
    fullName: string;
    documentId?: string;
    phone?: string;
    city?: string;
  }) => {
    const res = await studentService.signUp(params);
    if (res.error || !res.user) {
      return { success: false, error: res.error || 'No fue posible crear la cuenta.' };
    }
    const resolvedRole = await applySession(res.user);
    return { success: true, error: null, role: resolvedRole };
  }, [applySession]);

  const signInStudent = useCallback(async (email: string, pass: string) => {
    const res = await studentService.signIn(email, pass);
    if (res.error || !res.user) {
      return { success: false, error: res.error || 'No fue posible iniciar sesión.' };
    }
    const resolvedRole = await applySession(res.user);
    return { success: true, error: null, role: resolvedRole };
  }, [applySession]);

  // Lista unificada de cursos (Prioridad: editados por admin localmente > Supabase > base)
  const combinedCourses = useMemo(() => {
    const baseList = remoteCourses.length > 0 ? remoteCourses : baseCourses;
    const list: Course[] = [...extraCourses];
    const existingIds = new Set(extraCourses.map(c => c.id));
    const existingSlugs = new Set(extraCourses.map(c => c.slug));

    for (const c of baseList) {
      if (!existingIds.has(c.id) && !existingSlugs.has(c.slug)) {
        list.push(c);
      }
    }
    return list;
  }, [extraCourses, remoteCourses]);

  // Certificados dinámicos combinados
  const certs = useMemo(() => {
    const dynamic = Object.entries(results)
      .filter(([, r]) => r.passed)
      .map(([slug, r], i) => {
        const c = combinedCourses.find(x => x.slug === slug);
        return c
          ? {
              code: r.code || `EDDIP-2026-${String(200100 + i * 17)}`,
              student: userProfile.name,
              courseSlug: slug,
              course: c.title,
              hours: c.durationHours,
              date: new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()),
              status: 'Válido',
            }
          : null;
      })
      .filter(Boolean) as Certificate[];

    // Unir con certificados persistidos de todas las fuentes locales
    const storedCerts: Certificate[] = [];
    if (typeof window !== 'undefined') {
      try {
        const parseList = (raw: string | null) => {
          if (!raw) return;
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              for (const sc of parsed) {
                if (sc && sc.code) {
                  storedCerts.push({
                    code: sc.code,
                    student: sc.studentName || sc.student || userProfile.name,
                    documentId: sc.documentId,
                    courseSlug: sc.courseSlug,
                    course: sc.courseTitle || sc.course,
                    hours: Number(sc.hours) || 40,
                    date: sc.issueDate || sc.date,
                    status: sc.status || 'Válido',
                  });
                }
              }
            }
          } catch {}
        };

        parseList(localStorage.getItem('eddip_student_certificates_list'));
        parseList(localStorage.getItem('certificates_list'));
        parseList(localStorage.getItem('admin_certs'));

        // Claves atómicas eddip_cert_*
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('eddip_cert_')) {
            try {
              const val = localStorage.getItem(key);
              if (val) {
                const sc = JSON.parse(val);
                if (sc && sc.code) {
                  storedCerts.push({
                    code: sc.code,
                    student: sc.studentName || sc.student || userProfile.name,
                    documentId: sc.documentId,
                    courseSlug: sc.courseSlug,
                    course: sc.courseTitle || sc.course,
                    hours: Number(sc.hours) || 40,
                    date: sc.issueDate || sc.date,
                    status: sc.status || 'Válido',
                  });
                }
              }
            } catch {}
          }
        }
      } catch {
        // ignore
      }
    }

    const baseList = remoteCerts.length > 0 ? remoteCerts : certificates;
    const all = [...dynamic, ...storedCerts, ...baseList];
    const seen = new Set<string>();
    return all.filter(c => {
      const codeKey = (c.code || '').trim().toLowerCase();
      if (!codeKey || seen.has(codeKey)) return false;
      seen.add(codeKey);
      return true;
    });
  }, [results, combinedCourses, remoteCerts, userProfile.name]);

  return (
    <C.Provider
      value={{
        role,
        user: userProfile,
        courses: combinedCourses,
        purchased,
        completed,
        results,
        certs,
        notes,
        authLoading,
        sessionReady: loaded && !authLoading,
        logout,
        purchase,
        toggleLesson,
        saveResult,
        addCourse,
        updateCourse,
        deleteCourse,
        updateProfile,
        saveNote,
        signUpStudent,
        signInStudent,
      }}
    >
      {children}
    </C.Provider>
  );
}

export const useDemo = () => {
  const v = useContext(C);
  if (!v) throw new Error('useDemo must be used inside DemoProvider');
  return v;
};
