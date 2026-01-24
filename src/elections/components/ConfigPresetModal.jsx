import Modal from 'antd/es/modal/Modal';

export default function ConfigPresetModal({ tab, presetConfigs, setTab, loadPreset }) {
  return (
    <Modal
      open={tab === 'preset'}
      onCancel={() => setTab('manual')}
      footer={null}
      centered
      width={420}
      getContainer={() => document.body}
      zIndex={2000}
      maskStyle={{ zIndex: 1999 }}
    >
      <div className="space-y-3 max-h-[70vh] overflow-y-auto">
        <h2 className="text-lg font-semibold">Select a Preset</h2>

        {presetConfigs.length === 0 ? (
          <div className="text-gray-500">No presets available.</div>
        ) : (
          presetConfigs.map(preset => (
            <div
              key={preset.id}
              className="border rounded p-3 flex justify-between items-start shadow"
            >
              <div className="space-y-1">
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-gray-500">
                  Pins: {preset.pinBits.map((b, i) => (
                    <span key={i}>{b ? '🟢' : '❌'}</span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => loadPreset(preset)}
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Load
              </button>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
