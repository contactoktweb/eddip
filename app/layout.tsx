import type { Metadata } from 'next'; import './globals.css'; import {DemoProvider} from './providers';
export const metadata:Metadata={title:'EDDIP · Plataforma Educativa',description:'Demo visual funcional de la nueva plataforma educativa EDDIP'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><DemoProvider>{children}</DemoProvider></body></html>}
