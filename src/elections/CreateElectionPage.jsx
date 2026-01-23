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

  const [groupMap, setGroupMap] = useState({});
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  useEffect(() => {
    fetch("https://voting-api-wnlq.onrender.com/utils/get-all-configs", {
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
      });
  }, []);

  const activeButtons = pinBits.filter(b => b === 1).length;
  const maxGroupsAllowed = Math.floor(activeButtons / 2);
  const existingGroupIds = Object.keys(groupMap).map(Number);

  const unlockPreset = () => {
    setConfigLocked(false);
    setOriginalPreset(null);
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return alert('Group name cannot be empty.');
    if (existingGroupIds.length >= maxGroupsAllowed)
      return alert(`Max ${maxGroupsAllowed} groups allowed.`);

    const nextId = existingGroupIds.length ? Math.max(...existingGroupIds) + 1 : 1;
    setGroupMap(prev => ({ ...prev, [nextId]: newGroupName.trim() }));
    setNewGroupName('');
    setShowGroupModal(false);
    unlockPreset();
  };

  const handleAddCandidate = () => {
    if (candidates.length >= 8) return;

    const idx = pinBits.indexOf(0);
    if (idx === -1) return;

    const updatedPins = [...pinBits];
    updatedPins[idx] = 1;

    setPinBits(updatedPins);
    setCandidates([...candidates, { name: '', groupId: existingGroupIds[0] || 1 }]);
    unlockPreset();
  };

  const handleRemoveCandidate = () => {
    if (candidates.length <= 2) return;

    const updatedPins = [...pinBits];
    for (let i = 7; i >= 0; i--) {
      if (updatedPins[i] === 1) {
        updatedPins[i] = 0;
        break;
      }
    }

    setPinBits(updatedPins);
    setCandidates(candidates.slice(0, -1));
    unlockPreset();
  };

  const updateCandidateName = (idx, value) => {
    const updated = [...candidates];
    updated[idx].name = value;
    setCandidates(updated);
  };

  const updateCandidateGroup = (idx, groupId) => {
    const updated = [...candidates];
    updated[idx].groupId = groupId;
    setCandidates(updated);
    unlockPreset();
  };

const loadPreset = preset => {
  const newCandidates = [];
  preset.pinBits.forEach((bit, pinIndex) => {
    if (bit === 1) {
      newCandidates.push({
        name: '',
        groupId: preset.groupPins?.[pinIndex] ?? 1
      });
    }
  });

  setCandidates(newCandidates);
  setPinBits(preset.pinBits);
  setGroupMap(preset.groupNames || {});
  setConfigLocked(true);
  setOriginalPreset(preset);
  setConfigName('');
  setTab('manual');
};


  const isSameConfig = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const handleSubmit = async e => {
    e.preventDefault();

    const names = candidates.map(c => c.name.trim());
    if (names.some(n => !n)) return alert('Candidate name missing');

    if (activeButtons !== candidates.length)
      return alert('Active buttons must match candidates.');

    const groupCount = {};
    candidates.forEach(c => {
      groupCount[c.groupId] = (groupCount[c.groupId] || 0) + 1;
    });

    if (!Object.values(groupCount).every(v => v >= 2))
      return alert('Each group must have at least 2 candidates.');

    const sparseGroups = Array(8).fill(null);
    let ci = 0;
    pinBits.forEach((b, i) => {
      if (b === 1) sparseGroups[i] = candidates[ci++].groupId;
    });

    let configId;

    if (
      configLocked &&
      originalPreset &&
      isSameConfig(pinBits, originalPreset.pinBits) &&
      isSameConfig(sparseGroups, originalPreset.groupPins)
    ) {
      configId = originalPreset.id;
    } else {
      if (!configName.trim()) return alert('Provide a config name.');

      const res = await fetch('https://voting-api-wnlq.onrender.com/config/create-config', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + localStorage.getItem("evm.token"),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: configName,
          pins: pinBits,
          grouppins: sparseGroups,
          groupNames: groupMap
        })
      });

      const data = await res.json();
      configId = data.config_id;
    }

    await fetch('https://voting-api-wnlq.onrender.com/election/create-election', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem("evm.token"),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        electionName,
        candidates: JSON.stringify(names),
        configId
      })
    });

    navigator('/');
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Election</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setTab('preset')}
          className={`px-4 py-2 rounded font-semibold ${tab === 'preset' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Copy Preset
        </button>
      </div>

      <ConfigPresetModal
        tab={tab}
        presetConfigs={presetConfigs}
        setTab={setTab}
        loadPreset={loadPreset}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Election Name" value={electionName} onChange={e => setElectionName(e.target.value)} />
        <Input placeholder="Config Name" value={configName} onChange={e => setConfigName(e.target.value)} disabled={configLocked} />

        {candidates.map((c, i) => (
          <div key={i} className="flex gap-2">
            <Input placeholder={`Candidate ${i + 1}`} value={c.name} onChange={e => updateCandidateName(i, e.target.value)} />
            <select
              value={c.groupId}
              onChange={e =>
                e.target.value === 'add'
                  ? setShowGroupModal(true)
                  : updateCandidateGroup(i, Number(e.target.value))
              }
              className="border p-2 rounded"
            >
              {Object.entries(groupMap).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
              {existingGroupIds.length < maxGroupsAllowed && (
                <option value="add">+ Add new group</option>
              )}
            </select>
          </div>
        ))}

        <div className="flex gap-2">
          {candidates.length < 8 && <Button type="button" onClick={handleAddCandidate}>+ Add</Button>}
          {candidates.length > 2 && <Button type="button" onClick={handleRemoveCandidate}>− Remove</Button>}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {pinBits.map((b, i) => (
            <button
              key={i}
              type="button"
              className={`w-12 h-12 rounded-full font-bold text-white ${b ? 'bg-green-600' : 'bg-red-600'}`}
              onClick={() => {
                const updated = [...pinBits];
                updated[i] = updated[i] ? 0 : 1;
                setPinBits(updated);
                unlockPreset();
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button type="submit" className="w-full py-2 mt-4 font-semibold text-white rounded bg-green-600">
          Create Election
        </button>
      </form>

      <Modal title="Add New Group" open={showGroupModal} onOk={handleAddGroup} onCancel={() => setShowGroupModal(false)}>
        <Input placeholder="Group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
        <p className="text-sm text-gray-500 mt-2">Max groups allowed: {maxGroupsAllowed}</p>
      </Modal>
    </div>
  );
}
