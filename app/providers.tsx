'use client';
import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import { baseCourses, certificates } from '@/lib/data';
import type { Course, Certificate } from '@/lib/types';

type Role='guest'|'student'|'admin';
type Result={score:number;passed:boolean};
type DemoState={
 role:Role; user:{name:string;email:string}; courses:Course[]; purchased:string[]; completed:Record<string,string[]>;
 results:Record<string,Result>; certs:Certificate[]; login:(r:Exclude<Role,'guest'>)=>void; logout:()=>void;
 purchase:(slug:string)=>void; toggleLesson:(slug:string,lessonId:string)=>void; saveResult:(slug:string,result:Result)=>void;
 addCourse:(course:Course)=>void; resetDemo:()=>void;
};
const C=createContext<DemoState|null>(null);
const KEY='eddip-demo-v1';
const defaults={role:'guest' as Role,purchased:['derecho-de-policia','gestion-documental','seguridad-de-instalaciones'],completed:{'derecho-de-policia':['dp-l1','dp-l2','dp-l3','dp-l4'],'gestion-documental':[],'seguridad-de-instalaciones':['si-l1']},results:{},extraCourses:[] as Course[]};
export function DemoProvider({children}:{children:React.ReactNode}){
 const [loaded,setLoaded]=useState(false);
 const [role,setRole]=useState<Role>(defaults.role); const [purchased,setPurchased]=useState<string[]>(defaults.purchased);
 const [completed,setCompleted]=useState<Record<string,string[]>>(defaults.completed); const [results,setResults]=useState<Record<string,Result>>({});
 const [extraCourses,setExtraCourses]=useState<Course[]>([]);
 useEffect(()=>{try{const raw=localStorage.getItem(KEY);if(raw){const s=JSON.parse(raw);setRole(s.role||'guest');setPurchased(s.purchased||defaults.purchased);setCompleted(s.completed||defaults.completed);setResults(s.results||{});setExtraCourses(s.extraCourses||[]);} }catch{} finally{setLoaded(true)}},[]);
 useEffect(()=>{if(!loaded)return;localStorage.setItem(KEY,JSON.stringify({role,purchased,completed,results,extraCourses}))},[loaded,role,purchased,completed,results,extraCourses]);
 const login=(r:'student'|'admin')=>setRole(r); const logout=()=>setRole('guest');
 const purchase=(slug:string)=>setPurchased(v=>v.includes(slug)?v:[...v,slug]);
 const toggleLesson=(slug:string,id:string)=>setCompleted(v=>{const arr=v[slug]||[];return {...v,[slug]:arr.includes(id)?arr.filter(x=>x!==id):[...arr,id]}});
 const saveResult=(slug:string,result:Result)=>setResults(v=>({...v,[slug]:result}));
 const addCourse=(course:Course)=>setExtraCourses(v=>[course,...v]);
 const resetDemo=()=>{localStorage.removeItem(KEY);setRole('guest');setPurchased(defaults.purchased);setCompleted(defaults.completed);setResults({});setExtraCourses([])};
 const user={name:'Sebastián Martínez',email:'sebastian@demo.eddip.com'};
 const certs=useMemo(()=>{const dynamic=Object.entries(results).filter(([,r])=>r.passed).map(([slug],i)=>{const c=[...baseCourses,...extraCourses].find(x=>x.slug===slug);return c?{code:`EDDIP-2026-DEMO${String(i+1).padStart(3,'0')}`,student:user.name,courseSlug:slug,course:c.title,hours:c.durationHours,date:'03 de septiembre de 2026',status:'Válido'}:null}).filter(Boolean) as Certificate[]; return [...dynamic,...certificates]},[results,extraCourses]);
 return <C.Provider value={{role,user,courses:[...extraCourses,...baseCourses],purchased,completed,results,certs,login,logout,purchase,toggleLesson,saveResult,addCourse,resetDemo}}>{children}</C.Provider>
}
export const useDemo=()=>{const v=useContext(C);if(!v)throw new Error('useDemo must be used inside DemoProvider');return v};
