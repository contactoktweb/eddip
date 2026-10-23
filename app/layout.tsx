import type { Metadata } from 'next'; import './globals.css'; import {DemoProvider} from './providers';
import { BRAND_OFFICIAL_NAME } from '@/lib/brand';
export const metadata: Metadata = {
  title: BRAND_OFFICIAL_NAME,
  description:
    'Plataforma oficial de formación jurídica, seguridad ciudadana, convivencia y educación continua con certificaciones verificables mediante código QR criptográfico.',
};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body><DemoProvider>{children}</DemoProvider></body></html>}
