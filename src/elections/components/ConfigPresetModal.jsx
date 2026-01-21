import Modal from 'antd/es/modal/Modal'
import React from 'react'

function ConfigPresetModal({ tab, presetConfigs, setTab, loadPreset }) {
  return (
    <Modal
      open={tab === 'preset'}
      onCancel={() => setTab('manual')}
      footer={null}
      centered
      width={400}
    >
      <div className="space-y-3 p-4 max-h-[70vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-2">Select a Preset</h2>

        {presetConfigs.length === 0 ? (
          <div className="text-gray-600">No presets available.</div>
        ) : (
          presetConfigs.map((preset) => (
            <div
              key={preset.id}
              className="flex justify-between items-start p-3 border rounded shadow-sm"
            >
              <div>
                <div className="text-sm font-medium">
                  {preset.name || preset.id}
                </div>

                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div>
                    Pins:&nbsp;
                    {preset.pinBits?.map((bit, i) => (
                      <span key={i} className="inline-block mr-1">
                        {bit === 1 ? '🟢' : '❌'}
                      </span>
                    ))}
                  </div>

                  <div>
                    Groups:&nbsp;
                    {preset.groupPins?.map((groupId, i) => (
                      <span key={i} className="inline-block mr-1">
                        {groupId
                          ? preset.groupNames?.[groupId] || `Group ${groupId}`
                          : '❌'}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
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

export default ConfigPresetModal
