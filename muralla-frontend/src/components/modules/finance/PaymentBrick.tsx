import React, { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

export default function PaymentBrick() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY as string | undefined;

  useEffect(() => {
    if (!publicKey) return;

    const ensureScript = () => new Promise<void>((resolve, reject) => {
      if (window.MercadoPago) return resolve();
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load MercadoPago SDK'));
      document.body.appendChild(script);
    });

    let bricks: any;
    ensureScript()
      .then(() => {
        const mp = new window.MercadoPago(publicKey, { locale: 'es-CL' });
        bricks = mp.bricks();
        setReady(true);
        bricks.create('payment', 'payment-brick-container', {
          initialization: {
            amount: 1500,
            payer: {
              email: 'buyer@example.com',
            },
          },
          customization: {
            visual: { style: { theme: 'default' } },
          },
          callbacks: {
            onReady: () => {},
            onError: (error: any) => { console.error('Payment Brick error', error); },
            onSubmit: async (cardFormData: any) => {
              // For now, just log to prove SDK works; real charge uses backend flows
              console.log('PaymentBrick submit data', cardFormData);
              return Promise.resolve();
            },
          },
        });
      })
      .catch(console.error);

    return () => {
      try { bricks?.destroy?.('payment'); } catch {}
    };
  }, [publicKey]);

  if (!publicKey) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            Set VITE_MP_PUBLIC_KEY in the Frontend service variables to load MercadoPago.js v2.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pago con Mercado Pago (Payment Brick)</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">SDK v2 cargado desde sdk.mercadopago.com. Este bloque demuestra instalación del SDK.</p>
      <div ref={containerRef} id="payment-brick-container" className="bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-soft" />
      {ready ? null : <div className="text-sm text-gray-500">Cargando SDK…</div>}
    </div>
  );
} 