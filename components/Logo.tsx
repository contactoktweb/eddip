import Image from 'next/image';
import Link from 'next/link';

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
    <Link href="/" className={`brand ${light ? 'brand-light' : ''} ${className}`.trim()}>
      <span className="brand-mark">
        <Image src="/eddip-logo.png" alt="EDDIP" width={42} height={42} />
      </span>
      {!compact && <span className="brand-word">EDDIP</span>}
    </Link>
  );
}
