import coursesRaw from '@/data/courses.json';
import certificatesRaw from '@/data/certificates.json';
import studentsRaw from '@/data/students.json';
import salesRaw from '@/data/sales.json';
import examsRaw from '@/data/exams.json';
import type { Course, Certificate, Student, Sale, Exam } from './types';

export const baseCourses = coursesRaw as Course[];
export const certificates = certificatesRaw as Certificate[];
export const students = studentsRaw as Student[];
export const sales = salesRaw as Sale[];
export const exams = examsRaw as Exam[];

export const money = (value:number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(value);
export const allLessons = (course:Course) => course.modules.flatMap(m=>m.lessons);
export const courseBySlug = (slug:string, extra:Course[] = []) => [...baseCourses, ...extra].find(c=>c.slug===slug);
