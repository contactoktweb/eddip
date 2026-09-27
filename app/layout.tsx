import type { Metadata } from 'next'; import './globals.css'; import {DemoProvider} from './providers';
export const metadata: Metadata = {
  title: 'EDDIP · Educación Superior y Continua',
  description:
    'Plataforma oficial de formación jurídica, seguridad ciudadana, convivencia y educación continua con certificaciones verificables mediante código QR criptográfico.',
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><DemoProvider>{children}</DemoProvider></body></html>}
