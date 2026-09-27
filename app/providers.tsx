'use client';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { baseCourses, certificates } from '@/lib/data';
import type { Course, Certificate } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { studentService } from '@/lib/supabase/studentService';
import { adminService } from '@/lib/supabase/adminService';
import { contentService } from '@/lib/supabase/contentService';
import type { StudentProfile } from '@/lib/supabase/types';

type Role = 'guest' | 'student' | 'admin' | 'designer';
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
  login: (r: Exclude<Role, 'guest'>) => void;
  logout: () => Promise<void>;
  purchase: (slug: string) => void;
  toggleLesson: (slug: string, lessonId: string) => Promise<void>;
  saveResult: (slug: string, result: Result) => Promise<void>;
  addCourse: (course: Course) => void;
  updateCourse: (course: Course) => void;
  deleteCourse: (slug: string) => void;
  resetDemo: () => void;
  updateProfile: (data: Partial<StudentProfile>) => Promise<boolean>;
  saveNote: (courseSlug: string, lessonId: string, text: string) => Promise<void>;
  signUpStudent: (params: { email: string; password: string; fullName: string; documentId?: string; phone?: string; city?: string }) => Promise<{ success: boolean; error: string | null }>;
  signInStudent: (email: string, pass: string) => Promise<{ success: boolean; error: string | null; role?: 'student' | 'admin' | 'designer' }>;
};

const C = createContext<StudentContextType | null>(null);
const KEY = 'eddip-demo-v2';

const isDemoStudent = (email?: string) => {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    clean === 'estudiante@eddip.edu.co' ||
    clean === 'sebastian@demo.eddip.com' ||
    clean === 'estudiante@demo.eddip.com'
  );
};

const defaults = {
  role: 'guest' as Role,
  purchased: [] as string[],
  completed: {} as Record<string, string[]>,
  results: {} as Record<string, Result>,
  extraCourses: [] as Course[],
  notes: {} as Record<string, string>,
};

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [role, setRole] = useState<Role>(defaults.role);
  const [userProfile, setUserProfile] = useState<{
    id?: string;
    name: string;
    email: string;
    documentId?: string;
    phone?: string;
    city?: string;
  }>({
    name: '',
    email: '',
    documentId: '',
    phone: '',
    city: '',
  });

  const [purchased, setPurchased] = useState<string[]>(defaults.purchased);
  const [completed, setCompleted] = useState<Record<string, string[]>>(defaults.completed);
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

  // 1. Cargar estado local inicial y sincronizar con adminService
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      let loadedExtra: Course[] = [];
      if (raw) {
        const s = JSON.parse(raw);
        if (s.role) setRole(s.role);
        if (s.userProfile) setUserProfile(s.userProfile);
        if (Array.isArray(s.purchased)) setPurchased(s.purchased);
        if (s.completed && typeof s.completed === 'object') setCompleted(s.completed);
        if (s.results && typeof s.results === 'object') setResults(s.results);
        if (s.extraCourses && Array.isArray(s.extraCourses)) loadedExtra = s.extraCourses;
        if (s.notes && typeof s.notes === 'object') setNotes(s.notes);
      }

      // Restaurar perfil real del estudiante si fue registrado o actualizado en checkout
      const savedCustomProfile = localStorage.getItem('eddip_student_profile');
      if (savedCustomProfile) {
        try {
          const cp = JSON.parse(savedCustomProfile);
          if (cp.name && cp.name !== 'Sebastián Martínez') {
            setUserProfile(prev => ({
              ...prev,
              name: cp.name,
              email: cp.email || prev.email,
              documentId: cp.documentId || prev.documentId,
              phone: cp.phone || prev.phone,
              city: cp.city || prev.city,
            }));
          }
        } catch {}
      }

      // Sincronizar con los cursos guardados desde el panel de administración
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

  // 2. Escuchar sesión de Supabase Auth
  useEffect(() => {
    let mounted = true;

    async function initSupabaseAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        if (data.session?.user) {
          const u = data.session.user;
          const meta = u.user_metadata || {};
          const role: Role =
            meta.role === 'admin'
              ? 'admin'
              : meta.role === 'designer' || (u.email || '').includes('disenador') || (u.email || '').includes('designer')
              ? 'designer'
              : 'student';

          setRole(role);
          const email = (u.email || '').trim().toLowerCase();
          const profile = {
            id: u.id,
            name: meta.full_name || email.split('@')[0] || 'Estudiante EDDIP',
            email: email,
            documentId: meta.document_id || '',
            phone: meta.phone || '',
            city: meta.city || '',
          };
          setUserProfile(profile);

          if (role === 'student') {
            const isDemo = isDemoStudent(email);
            try {
              const userStored = localStorage.getItem(`eddip_user_${email}`);
              if (userStored) {
                const parsed = JSON.parse(userStored);
                setPurchased(Array.isArray(parsed.purchased) ? parsed.purchased : []);
                setCompleted(parsed.completed || {});
                setResults(parsed.results || {});
                setNotes(parsed.notes || {});
              } else if (!isDemo) {
                // Nuevo estudiante registrado: sin cursos ni progreso cargado
                setPurchased([]);
                setCompleted({});
                setResults({});
                setNotes({});
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Supabase session load error:', err);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    }

    initSupabaseAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};
        const newRole: Role =
          meta.role === 'admin'
            ? 'admin'
            : meta.role === 'designer' || (u.email || '').includes('disenador') || (u.email || '').includes('designer')
            ? 'designer'
            : 'student';
        setRole(newRole);
        const email = (u.email || '').trim().toLowerCase();
        const profile = {
          id: u.id,
          name: meta.full_name || email.split('@')[0] || 'Estudiante EDDIP',
          email: email,
          documentId: meta.document_id || '',
          phone: meta.phone || '',
          city: meta.city || '',
        };
        setUserProfile(profile);

        if (newRole === 'student') {
          const isDemo = isDemoStudent(email);
          try {
            const userStored = localStorage.getItem(`eddip_user_${email}`);
            if (userStored) {
              const parsed = JSON.parse(userStored);
              setPurchased(Array.isArray(parsed.purchased) ? parsed.purchased : []);
              setCompleted(parsed.completed || {});
              setResults(parsed.results || {});
              setNotes(parsed.notes || {});
            } else if (!isDemo) {
              setPurchased([]);
              setCompleted({});
              setResults({});
              setNotes({});
            }
          } catch {}
        }
      } else if (event === 'SIGNED_OUT') {
        // Mantener sesión de estudiante para visualización de demo o reiniciar
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 3. Persistir en localStorage
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({
          role,
          userProfile,
          purchased,
          completed,
          results,
          extraCourses,
          notes,
        })
      );

      if (userProfile?.email) {
        const cleanEmail = userProfile.email.trim().toLowerCase();
        localStorage.setItem(
          `eddip_user_${cleanEmail}`,
          JSON.stringify({
            role,
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
  }, [loaded, role, userProfile, purchased, completed, results, extraCourses, notes]);

  const login = useCallback((r: 'student' | 'admin' | 'designer') => {
    setRole(r);
    if (r === 'admin') {
      setUserProfile(prev => ({
        ...prev,
        name: prev.email?.includes('admin') ? prev.name : 'Administrador EDDIP',
        email: prev.email?.includes('admin') ? prev.email : 'admin@eddip.edu.co',
      }));
    } else if (r === 'designer') {
      setUserProfile(prev => ({
        ...prev,
        name: prev.email?.includes('disenador') || prev.email?.includes('designer') ? prev.name : 'Diseñador Instruccional',
        email: prev.email?.includes('disenador') || prev.email?.includes('designer') ? prev.email : 'disenador@eddip.edu.co',
      }));
    } else {
      setUserProfile(prev => {
        // Preservar nombre y datos reales si ya fueron ingresados
        if (prev.name && prev.name !== 'Sebastián Martínez') {
          return prev;
        }
        if (typeof window !== 'undefined') {
          try {
            const saved = localStorage.getItem('eddip_student_profile') || sessionStorage.getItem('eddip_checkout_customer');
            if (saved) {
              const p = JSON.parse(saved);
              if (p.name && p.name !== 'Sebastián Martínez') {
                return {
                  ...prev,
                  name: p.name,
                  email: p.email || prev.email,
                  documentId: p.documentId || prev.documentId,
                  phone: p.phone || prev.phone,
                  city: p.city || prev.city,
                };
              }
            }
          } catch {}
        }
        return prev;
      });
      setPurchased(prev => (prev.length > 0 ? prev : defaults.purchased));
      setCompleted(prev => (Object.keys(prev).length > 0 ? prev : defaults.completed));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await studentService.signOut();
    } catch {
      // Ignore
    }
    setRole('guest');
    setUserProfile({
      name: '',
      email: '',
    });
    setPurchased([]);
    setCompleted({});
    setResults({});
    setNotes({});
  }, []);

  const purchase = useCallback((slug: string) => {
    setPurchased(v => {
      if (v.includes(slug)) return v;
      if (userProfile.id) {
        studentService.enrollCourse(userProfile.id, slug).catch(() => {});
      }
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
  }, [remoteCourses, userProfile.id]);

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
        documentId: userProfile.documentId || '1.032.456.789',
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
          studentId: userProfile.id || 'demo-student',
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
            documentId: userProfile.documentId || '1.032.456.789',
            courseSlug: slug,
            courseTitle,
            hours: courseHours,
            status: 'Válido',
            issueDate: issueDateStr,
          },
          userProfile.id
        );

        await adminService.issueManualCertificate(certObj);
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

  const deleteCourse = useCallback((slug: string) => {
    setExtraCourses(v => v.filter(c => c.slug !== slug));
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
    if (res.error) {
      return { success: false, error: res.error };
    }
    if (res.user) {
      const cleanEmail = params.email.trim().toLowerCase();
      const newProfile = {
        id: res.user.id,
        name: params.fullName,
        email: cleanEmail,
        documentId: params.documentId || '',
        phone: params.phone || '',
        city: params.city || '',
      };
      setUserProfile(newProfile);
      setRole('student');

      // Un nuevo estudiante registrado inicia totalmente desde cero:
      // Sin ningún curso ni progreso cargado
      setPurchased([]);
      setCompleted({});
      setResults({});
      setNotes({});

      try {
        const cleanState = {
          role: 'student' as Role,
          userProfile: newProfile,
          purchased: [] as string[],
          completed: {} as Record<string, string[]>,
          results: {} as Record<string, Result>,
          extraCourses,
          notes: {} as Record<string, string>,
        };
        localStorage.setItem(KEY, JSON.stringify(cleanState));
        localStorage.setItem(`eddip_user_${cleanEmail}`, JSON.stringify(cleanState));
      } catch {}

      return { success: true, error: null };
    }
    return { success: true, error: null };
  }, [extraCourses]);

  const signInStudent = useCallback(async (email: string, pass: string) => {
    const res = await studentService.signIn(email, pass);
    if (res.error) {
      return { success: false, error: res.error, role: 'student' as const };
    }
    if (res.user) {
      const cleanEmail = email.trim().toLowerCase();
      const meta = res.user.user_metadata || {};
      const isAdmin = meta.role === 'admin' || cleanEmail.includes('admin');
      const isDesigner = meta.role === 'designer' || cleanEmail.includes('disenador') || cleanEmail.includes('designer');
      const assignedRole: Role = isAdmin ? 'admin' : (isDesigner ? 'designer' : 'student');

      const profile = {
        id: res.user.id,
        name: meta.full_name || (isAdmin ? 'Administrador EDDIP' : (isDesigner ? 'Diseñador Instruccional' : cleanEmail.split('@')[0])),
        email: cleanEmail,
        documentId: meta.document_id || '',
        phone: meta.phone || '',
        city: meta.city || '',
      };

      setUserProfile(profile);
      setRole(assignedRole);

      if (assignedRole === 'student') {
        const isDemo = isDemoStudent(cleanEmail);

        try {
          const userStored = localStorage.getItem(`eddip_user_${cleanEmail}`);
          if (userStored) {
            const parsed = JSON.parse(userStored);
            setPurchased(Array.isArray(parsed.purchased) ? parsed.purchased : []);
            setCompleted(parsed.completed || {});
            setResults(parsed.results || {});
            setNotes(parsed.notes || {});
          } else if (isDemo) {
            setPurchased(defaults.purchased);
            setCompleted(defaults.completed);
            setResults({});
            setNotes({});
          } else {
            // Usuario registrado nuevo sin cursos previos ni progreso
            setPurchased([]);
            setCompleted({});
            setResults({});
            setNotes({});
          }
        } catch {
          if (!isDemo) {
            setPurchased([]);
            setCompleted({});
            setResults({});
            setNotes({});
          }
        }
      }

      return { success: true, error: null, role: assignedRole };
    }
    return { success: true, error: null, role: 'student' as const };
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(KEY);
    setRole('student');
    setPurchased(defaults.purchased);
    setCompleted(defaults.completed);
    setResults({});
    setExtraCourses([]);
    setNotes({});
    setUserProfile({
      name: 'Sebastián Martínez',
      email: 'estudiante@eddip.edu.co',
      documentId: '1.032.456.789',
      phone: '300 555 0182',
      city: 'Bogotá D.C.',
    });
  }, []);

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
        login,
        logout,
        purchase,
        toggleLesson,
        saveResult,
        addCourse,
        updateCourse,
        deleteCourse,
        resetDemo,
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
