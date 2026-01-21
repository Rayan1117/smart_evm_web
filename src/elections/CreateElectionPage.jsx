import { Modal, Input, Button } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigPresetModal from './components/ConfigPresetModal';

export default function ElectionForm() {
  const navigator = useNavigate();

  const [tab, setTab] = useState('manual');
  const [electionName, setElectionName] = useState('');
  const [candidates, setCandidates] = useState([
    { name: '', groupId: 1 },
    { name: '', groupId: 1 },
  ]);

  const [pinBits, setPinBits] = useState([1, 1, 0, 0, 0, 0, 0, 0]);
  const [presetConfigs, setPresetConfigs] = useState([]);
  const [configName, setConfigName] = useState('');
  const [configLocked, setConfigLocked] = useState(false);
  const [originalPreset, setOriginalPreset] = useState(null);

  /* Group/Category state */
  const [groupMap, setGroupMap] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetch("http://localhost:5000/utils/get-all-configs", {
      headers: { Authorization: "Bearer " + localStorage.getItem("evm.token") }
    })
      .then(res => res.json())
      .then(data => {
        const parsed = data.configs.map(cfg => ({
          id: cfg.config_id,
          name: cfg.config_name,
          pinBits: JSON.parse(cfg.pin_bits),
          groupPins: JSON.parse(cfg.group_pins),
          groupNames: cfg.group_names ? JSON.parse(cfg.group_names) : {}
        }));
        setPresetConfigs(parsed);
      })
      .catch(err => console.error(err));
  }, []);

  const activeButtons = pinBits.filter(b => b === 1).length;
  const maxGroupsAllowed = Math.floor(activeButtons / 2);
  const existingGroupIds = Object.keys(groupMap).map(Number);

  /* ------------------- Group Management ------------------- */
const handleAddGroup = () => {
  const currentGroupIds = Object.keys(groupMap).map(Number); // compute fresh
  const maxGroups = Math.floor(pinBits.filter(b => b === 1).length / 2); // recompute fresh

  if (!newGroupName.trim()) {
    alert('Group name cannot be empty.');
    return;
  }
  if (currentGroupIds.length >= maxGroups) {
    alert(`You can create only ${maxGroups} groups.`);
    return;
  }

  const nextId = currentGroupIds.length ? Math.max(...currentGroupIds) + 1 : 1;

  setGroupMap(prev => ({
    ...prev,
    [nextId]: newGroupName.trim()
  }));

  setNewGroupName('');
  setShowGroupModal(false);
};

  /* ------------------- Candidate Management ------------------- */
  const handleAddCandidate = () => {
    if (candidates.length >= 8) return;

    const nextGroup = existingGroupIds[0] || 1;
    setCandidates([...candidates, { name: '', groupId: nextGroup }]);

    const updatedPinBits = [...pinBits];
    const idx = updatedPinBits.indexOf(0);
    if (idx !== -1) updatedPinBits[idx] = 1;
    setPinBits(updatedPinBits);

    setConfigLocked(false);
    setOriginalPreset(null);
    setConfigName('');
  };

  const handleRemoveCandidate = () => {
    if (candidates.length <= 2) return;

    setCandidates(candidates.slice(0, -1));

    const updatedPinBits = [...pinBits];
    for (let i = 7; i >= 0; i--) {
      if (updatedPinBits[i] === 1) {
        updatedPinBits[i] = 0;
        break;
      }
    }
    setPinBits(updatedPinBits);

    setConfigLocked(false);
    setOriginalPreset(null);
    setConfigName('');
  };

  const updateCandidateName = (index, value) => {
    const updated = [...candidates];
    updated[index].name = value;
    setCandidates(updated);
  };

  const updateCandidateGroup = (index, groupId) => {
    const updated = [...candidates];
    updated[index].groupId = groupId;
    setCandidates(updated);
    setConfigLocked(false);
    setOriginalPreset(null);
    setConfigName('');
  };

  /* ------------------- Preset Handling ------------------- */
  const loadPreset = (preset) => {
    const activeCount = preset.pinBits.filter(b => b === 1).length;
    setCandidates(
      Array(activeCount).fill(0).map((_, i) => ({
        name: candidates[i]?.name || '',
        groupId: preset.groupPins[i] || 1
      }))
    );
    setPinBits(preset.pinBits);
    setGroupMap(preset.groupNames || {});
    setConfigName(preset.name);
    setConfigLocked(true);
    setOriginalPreset(preset);
    setTab('manual');
  };

  const isSameConfig = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  /* ------------------- Submit Logic ------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("clicked");
    

    const names = candidates.map(c => c.name.trim()).filter(Boolean);
    const groupIds = candidates.map(c => c.groupId);

    // Max groups
    const maxGroupId = Math.max(...groupIds);
    if (maxGroupId > 4) {
      alert('You can only assign candidates to 4 groups (1–4).');
      return;
    }

    // Each group must have at least 2 candidates
    const groupCount = {};
    groupIds.forEach(g => groupCount[g] = (groupCount[g] || 0) + 1);
    if (!Object.values(groupCount).every(c => c >= 2)) {
      alert('Each group with candidates must have at least 2 candidates.');
      return;
    }

    // Active buttons validation
    if (activeButtons !== candidates.length) {
      alert('Active buttons must match number of candidates.');
      return;
    }

    const sparseGroups = Array(8).fill(null);
    let ci = 0;
    pinBits.forEach((b, i) => {
      if (b === 1) sparseGroups[i] = candidates[ci++].groupId;
    });

    let configId = null;
    if (originalPreset && configLocked &&
        isSameConfig(pinBits, originalPreset.pinBits) &&
        isSameConfig(sparseGroups, originalPreset.groupPins)) {
      configId = originalPreset.id;
    } else {
      if (!configName.trim()) {
        alert('Please provide a config name for custom configuration.');
        return;
      }
      const res = await fetch('http://localhost:5000/config/create-config', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + localStorage.getItem("evm.token"), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: configName, pins: pinBits, grouppins: sparseGroups, groupNames: groupMap })
      });
      const data = await res.json();
      configId = data.config_id;
    }

    await fetch('http://localhost:5000/election/create-election', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + localStorage.getItem("evm.token"), 'Content-Type': 'application/json' },
      body: JSON.stringify({ electionName, candidates: JSON.stringify(names), configId })
    });

    navigator('/');
  };

  /* ------------------- UI ------------------- */
  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Create Election</h1>

      {/* Use Preset */}
      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setTab('preset')}
          className={`px-4 py-2 rounded ${tab === 'preset' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Use Preset
        </button>
      </div>

      <ConfigPresetModal
        tab={tab}
        presetConfigs={presetConfigs}
        setTab={setTab}
        loadPreset={loadPreset}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={electionName}
          onChange={e => setElectionName(e.target.value)}
          placeholder="Election Name"
          className="w-full border p-2 rounded"
          required
        />
        <input
          value={configName}
          onChange={e => setConfigName(e.target.value)}
          placeholder="Config Name"
          className="w-full border p-2 rounded"
          disabled={configLocked}
        />

        {/* Candidates */}
        <div>
          {candidates.map((c, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                value={c.name}
                onChange={e => updateCandidateName(i, e.target.value)}
                placeholder={`Candidate ${i+1}`}
                className="flex-1 border p-2 rounded"
                required
              />

              {existingGroupIds.length === 0 ? (
                <Button type="button" onClick={() => setShowGroupModal(true)}>+ Add Group</Button>
              ) : (
                <select
                  value={c.groupId}
                  onChange={e => {
                    if (e.target.value === 'add') setShowGroupModal(true);
                    else updateCandidateGroup(i, Number(e.target.value));
                  }}
                  className="border p-2 rounded"
                >
                  {Object.entries(groupMap).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                  {existingGroupIds.length < maxGroupsAllowed && <option value="add">+ Add new group</option>}
                </select>
              )}
            </div>
          ))}

          {/* Candidate Add/Remove */}
          <div className="flex gap-2 mt-2">
            {candidates.length < 8 && <Button type="button" onClick={handleAddCandidate}>+ Add</Button>}
            {candidates.length > 2 && <Button type="button" onClick={handleRemoveCandidate}>− Remove</Button>}
          </div>
        </div>

        {/* Pin Buttons */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {pinBits.map((b, i) => (
            <button
              type="button"
              key={i}
              className={`w-12 h-12 rounded-full font-bold text-white ${b ? 'bg-green-600' : 'bg-red-600'}`}
              onClick={() => {
                const updated = [...pinBits];
                updated[i] = updated[i] ? 0 : 1;
                setPinBits(updated);
              }}
            >
              {i+1}
            </button>
          ))}
        </div>

        <button type="submit" className="w-full bg-green-600 text-white py-2 mt-4">Create Election</button>
      </form>

      {/* Modal for Adding Group */}
      <Modal
        title="Add New Group"
        open={showGroupModal}
        onOk={handleAddGroup}
        onCancel={() => setShowGroupModal(false)}
        okText="Add"
      >
        <Input
          placeholder="Group name"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
        />
        <p className="text-sm text-gray-500 mt-2">
          Max groups allowed: {maxGroupsAllowed}
        </p>
      </Modal>
    </div>
  );
}
