import Modal from 'antd/es/modal/Modal'
import React from 'react'

export default function ConfigPresetModal({ tab, presetConfigs, setTab, loadPreset }) {
  return (
    <Modal
      open={tab === 'preset'}
      onCancel={() => setTab('manual')}
      footer={null}
      centered
      width={400}
    >
      <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Select a Preset</h2>

        {presetConfigs.length === 0 ? (
          <div style={{ color: '#6B7280' }}>No presets available.</div>
        ) : (
          presetConfigs.map((preset) => (
            <div
              key={preset.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                border: '1px solid #E5E7EB',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{preset.name || preset.id}</div>

                <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                  <div>
                    Pins:&nbsp;
                    {preset.pinBits?.map((bit, i) => (
                      <span key={i} style={{ marginRight: '0.25rem' }}>
                        {bit === 1 ? '🟢' : '❌'}
                      </span>
                    ))}
                  </div>

                  <div>
                    Groups:&nbsp;
                    {preset.groupPins?.map((groupId, i) => (
                      <span key={i} style={{ marginRight: '0.25rem' }}>
                        {groupId ? preset.groupNames?.[groupId] || `Group ${groupId}` : '❌'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '0.375rem',
                  background: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => loadPreset(preset)}
              >
                Load
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  )
}
