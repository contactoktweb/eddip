import Image from 'next/image';
import Link from 'next/link';
import { BRAND_OFFICIAL_NAME } from '@/lib/brand';

export function Logo({
  compact = false,
  light = false,
  className = '',
}: {
  compact?: boolean;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={`brand ${light ? 'brand-light' : ''} ${className}`.trim()}
      aria-label={`${BRAND_OFFICIAL_NAME}, ir al inicio`}
    >
      <span className="brand-mark">
        <Image src="/eddip-logo.png" alt={`Logo de ${BRAND_OFFICIAL_NAME}`} width={42} height={42} />
      </span>
      {!compact && <span className="brand-word">EDDIP</span>}
    </Link>
  );
}
