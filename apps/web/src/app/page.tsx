'use client';

export default function Home() {
  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a' }}>
      <div style={{
        width: 260,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        padding: 20,
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#60a5fa', letterSpacing: 2 }}>
          ORBIT
        </div>
        <div style={{ fontSize: 12, color: '#64748b', marginTop: 'auto' }}>
          Phase 1 - Block Editor
        </div>
      </div>
      <iframe
        src="/blocksuite.html"
        style={{ flex: 1, border: 'none', background: '#ffffff' }}
        title="Orbit Block Editor"
      />
    </div>
  );
}
