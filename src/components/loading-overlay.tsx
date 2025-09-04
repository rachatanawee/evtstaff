'use client'

import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export function LoadingOverlay({ show, message = 'Loading...' }: LoadingOverlayProps) {
  const [visible, setVisible] = useState(show);
  const [opacity, setOpacity] = useState(show ? 'opacity-100' : 'opacity-0');

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setOpacity('opacity-100'), 10); // Small delay to allow DOM render
      return () => clearTimeout(timer);
    } else {
      setOpacity('opacity-0');
      const timer = setTimeout(() => setVisible(false), 300); // Match transition duration
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50 transition-opacity duration-300 ${opacity}`}
    >
      <p className="text-white text-xl">{message}</p>
    </div>
  );
}
