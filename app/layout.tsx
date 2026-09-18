import type { Metadata } from 'next'; import './globals.css'; import {DemoProvider} from './providers';
export const metadata: Metadata = {
  title: 'EDDIP · Escuela de Desarrollo y Doctrina Policial',
  description:
    'Plataforma oficial de formación jurídica, seguridad ciudadana, convivencia y doctrina policial con certificaciones verificables mediante código QR criptográfico.',
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><DemoProvider>{children}</DemoProvider></body></html>}
