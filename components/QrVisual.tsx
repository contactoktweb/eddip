'use client';
import { useState, useEffect } from 'react';
import QRCode from 'qrcode';

type Props = {
  code: string;
  size?: number;
  url?: string;
};

export function QrVisual({ code, size = 140, url }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const targetUrl =
      url ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}/certificados/${encodeURIComponent(code)}`
        : `https://eddip.com/certificados/${code}`);

    QRCode.toDataURL(targetUrl, {
      width: size * 2, // 2x para resolución retina ultra nítida
      margin: 1,
      color: {
        dark: '#071F49',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'M',
    })
      .then(result => {
        if (active) setDataUrl(result);
      })
      .catch(err => {
        console.warn('Error generating QR code:', err);
      });

    return () => {
      active = false;
    };
  }, [code, size, url]);

  const targetUrl =
    url ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/certificados/${encodeURIComponent(code)}`
      : `/certificados/${code}`);

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#fff',
        padding: '8px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {dataUrl ? (
        <a
          href={targetUrl}
          title={`Escanear o abrir verificación oficial de: ${code}`}
          style={{ display: 'block', lineHeight: 0 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt={`Código QR oficial escaneable para validar certificado ${code}`}
            width={size}
            height={size}
            style={{
              display: 'block',
              borderRadius: '6px',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </a>
      ) : (
        <div
          style={{
            width: size,
            height: size,
            display: 'grid',
            placeItems: 'center',
            background: '#f8fafc',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          Generando QR...
        </div>
      )}

      <span
        style={{
          fontSize: '9px',
          fontFamily: 'monospace',
          color: '#64748b',
          marginTop: '6px',
          letterSpacing: '0.5px',
          fontWeight: 600,
        }}
      >
        QR ESCANEABLE
      </span>
    </div>
  );
}
