'use client';

import { useEffect, useState } from 'react';

export default function ConfigListPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://voting-api-wnlq.onrender.com/utils/get-all-configs', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('evm.token')
      }
    })
      .then(res => res.json())
      .then(data => {
        setConfigs(data.configs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const theme = {
    bg: '#F3F4F6',
    cardBg: '#FFFFFF',
    headerBg: 'linear-gradient(90deg, #1E3A8A, #3B82F6)',
    borderColor: '#E5E7EB',
    fontFamily: "'Inter', sans-serif",
    textPrimary: '#111827',
    textSecondary: '#4B5563'
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: theme.fontFamily, padding: '2rem' }}>
      <div style={{ maxWidth: '5xl', margin: '0 auto', background: theme.cardBg, borderRadius: '1rem', boxShadow: '0 6px 20px rgba(0,0,0,0.08)', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: theme.textPrimary, textAlign: 'center' }}>
          Saved EVM Configs
        </h1>

        {loading ? (
          <p style={{ textAlign: 'center', color: theme.textSecondary }}>Loading configs...</p>
        ) : configs.length === 0 ? (
          <p style={{ textAlign: 'center', color: theme.textSecondary }}>No configs found.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#EFF6FF' }}>
              <tr>
                <th style={{ border: `1px solid ${theme.borderColor}`, padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Config ID</th>
                <th style={{ border: `1px solid ${theme.borderColor}`, padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Pin Bits</th>
                <th style={{ border: `1px solid ${theme.borderColor}`, padding: '0.75rem', textAlign: 'left', fontWeight: 600 }}>Group Pins</th>
              </tr>
            </thead>
            <tbody>
              {configs.map(cfg => (
                <tr key={cfg.config_id} style={{ transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = '#F3F4F6'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ border: `1px solid ${theme.borderColor}`, padding: '0.5rem', color: theme.textPrimary }}>{cfg.config_name}</td>
                  <td style={{ border: `1px solid ${theme.borderColor}`, padding: '0.5rem', color: theme.textSecondary }}>{JSON.parse(cfg.pin_bits).join(', ')}</td>
                  <td style={{ border: `1px solid ${theme.borderColor}`, padding: '0.5rem', color: theme.textSecondary }}>{JSON.parse(cfg.group_pins).map(g => g ?? '-').join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
