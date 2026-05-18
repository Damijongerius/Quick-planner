'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      padding: '24px', 
      fontFamily: 'system-ui, sans-serif', 
      textAlign: 'center',
      backgroundColor: '#0f172a',
      color: '#f8fafc'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Something went wrong!</h2>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px', maxWidth: '400px' }}>
        {error?.message || "An unexpected global exception occurred."}
      </p>
      <button 
        onClick={() => reset()} 
        style={{ 
          padding: '10px 20px', 
          borderRadius: '8px', 
          border: 'none', 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          fontWeight: 600, 
          cursor: 'pointer'
        }}
      >
        Try again
      </button>
    </div>
  );
}
