'use client';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { baseCourses, certificates } from '@/lib/data';
import type { Course, Certificate } from '@/lib/types';
import { supabase } from '@/lib/supabase/client';
import { studentService } from '@/lib/supabase/studentService';
import { contentService } from '@/lib/supabase/contentService';
import type { StudentProfile } from '@/lib/supabase/types';

type Role = 'guest' | 'student' | 'admin';
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
  signInStudent: (email: string, pass: string) => Promise<{ success: boolean; error: string | null; role?: 'student' | 'admin' }>;
};

const C = createContext<StudentContextType | null>(null);
const KEY = 'eddip-demo-v2';

const defaults = {
  role: 'student' as Role,
  purchased: ['derecho-de-policia', 'gestion-documental', 'seguridad-de-instalaciones'],
  completed: {
    'derecho-de-policia': ['dp-l1', 'dp-l2', 'dp-l3', 'dp-l4'],
    'gestion-documental': [],
    'seguridad-de-instalaciones': ['si-l1'],
  },
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
    name: 'Sebastián Martínez',
    email: 'estudiante@eddip.edu.co',
    documentId: '1.032.456.789',
    phone: '300 555 0182',
    city: 'Bogotá D.C.',
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

  // 1. Cargar estado local inicial
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.role) setRole(s.role);
        if (s.userProfile) setUserProfile(s.userProfile);
        if (s.purchased) setPurchased(s.purchased);
        if (s.completed) setCompleted(s.completed);
        if (s.results) setResults(s.results);
        if (s.extraCourses) setExtraCourses(s.extraCourses);
        if (s.notes) setNotes(s.notes);
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
          const role = meta.role === 'admin' ? 'admin' : 'student';

          setRole(role);
          setUserProfile({
            id: u.id,
            name: meta.full_name || u.email?.split('@')[0] || 'Estudiante EDDIP',
            email: u.email || '',
            documentId: meta.document_id || '',
            phone: meta.phone || '',
            city: meta.city || '',
          });
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
        const newRole = meta.role === 'admin' ? 'admin' : 'student';
        setRole(newRole);
        setUserProfile({
          id: u.id,
          name: meta.full_name || u.email?.split('@')[0] || 'Estudiante EDDIP',
          email: u.email || '',
          documentId: meta.document_id || '',
          phone: meta.phone || '',
          city: meta.city || '',
        });
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
    } catch {
      // Ignore quota exceeded
    }
  }, [loaded, role, userProfile, purchased, completed, results, extraCourses, notes]);

  const login = useCallback((r: 'student' | 'admin') => {
    setRole(r);
    if (r === 'admin') {
      setUserProfile(prev => ({
        ...prev,
        name: 'Administrador EDDIP',
        email: 'admin@eddip.edu.co',
      }));
    } else {
      setUserProfile(prev => ({
        ...prev,
        name: prev.name || 'Sebastián Martínez',
        email: prev.email || 'estudiante@eddip.edu.co',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await studentService.signOut();
    } catch {
      // Ignore
    }
    setRole('guest');
  }, []);

  const purchase = useCallback((slug: string) => {
    setPurchased(v => {
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
    const course = [...baseCourses, ...extraCourses].find(c => c.slug === slug);
    const certCode =
      result.code ||
      (result.passed ? `EDDIP-2026-${Math.floor(100000 + Math.random() * 900000)}` : undefined);

    const enrichedResult = { ...result, code: certCode };
    setResults(v => ({ ...v, [slug]: enrichedResult }));

    if (result.passed && course && certCode) {
      try {
        await studentService.saveExamResult({
          studentId: userProfile.id || 'demo-student',
          studentName: userProfile.name,
          courseSlug: slug,
          courseTitle: course.title,
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
            studentName: userProfile.name,
            courseSlug: slug,
            courseTitle: course.title,
            hours: course.durationHours,
            status: 'Válido',
            issueDate: new Intl.DateTimeFormat('es-CO', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }).format(new Date()),
          },
          userProfile.id
        );
      } catch (err) {
        console.warn('Error saving exam/certificate:', err);
      }
    }
  }, [extraCourses, userProfile]);

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
    setUserProfile(prev => ({
      ...prev,
      name: data.fullName || prev.name,
      email: data.email || prev.email,
      documentId: data.documentId || prev.documentId,
      phone: data.phone || prev.phone,
      city: data.city || prev.city,
    }));

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
      setUserProfile({
        id: res.user.id,
        name: params.fullName,
        email: params.email,
        documentId: params.documentId,
        phone: params.phone,
        city: params.city,
      });
      setRole('student');
      return { success: true, error: null };
    }
    return { success: true, error: null };
  }, []);

  const signInStudent = useCallback(async (email: string, pass: string) => {
    const res = await studentService.signIn(email, pass);
    if (res.error) {
      return { success: false, error: res.error, role: 'student' as const };
    }
    if (res.user) {
      const meta = res.user.user_metadata || {};
      const isAdmin = meta.role === 'admin' || email.toLowerCase().includes('admin');
      const assignedRole: Role = isAdmin ? 'admin' : 'student';

      setUserProfile({
        id: res.user.id,
        name: meta.full_name || (isAdmin ? 'Administrador EDDIP' : email.split('@')[0]),
        email: email,
        documentId: meta.document_id || '',
        phone: meta.phone || '',
        city: meta.city || '',
      });
      setRole(assignedRole);
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
    const map = new Map<string, Course>();
    for (const c of extraCourses) {
      map.set(c.slug, c);
    }
    for (const c of baseList) {
      if (!map.has(c.slug)) {
        map.set(c.slug, c);
      }
    }
    return Array.from(map.values());
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

    // Unir con certificados persistidos
    let storedCerts: Certificate[] = [];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('eddip_student_certificates_list');
        if (raw) {
          const parsed = JSON.parse(raw);
          storedCerts = parsed.map((sc: any) => ({
            code: sc.code,
            student: sc.studentName,
            courseSlug: sc.courseSlug,
            course: sc.courseTitle,
            hours: sc.hours,
            date: sc.issueDate,
            status: sc.status || 'Válido',
          }));
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
