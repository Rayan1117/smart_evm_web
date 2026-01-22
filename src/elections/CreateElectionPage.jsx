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

  const theme = {
    cardBg: '#FFFFFF',
    borderColor: '#E5E7EB',
    primaryBtn: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
    secondaryBtn: 'linear-gradient(135deg, #10B981, #34D399)',
    dangerBtn: 'linear-gradient(135deg, #EF4444, #F87171)',
    pinActive: '#059669',
    pinInactive: '#B91C1C',
    fontFamily: "'Inter', sans-serif",
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    shadow: '0 8px 24px rgba(0,0,0,0.08)'
  };

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
      });
  }, []);

  const activeButtons = pinBits.filter(b => b === 1).length;
  const maxGroupsAllowed = Math.floor(activeButtons / 2);
  const existingGroupIds = Object.keys(groupMap).map(Number);

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return alert('Group name cannot be empty.');
    if (existingGroupIds.length >= maxGroupsAllowed)
      return alert(`Max ${maxGroupsAllowed} groups allowed.`);

    const nextId = existingGroupIds.length ? Math.max(...existingGroupIds) + 1 : 1;
    setGroupMap(prev => ({ ...prev, [nextId]: newGroupName.trim() }));
    setNewGroupName('');
    setShowGroupModal(false);
  };

  const handleAddCandidate = () => {
    if (candidates.length >= 8) return;
    const nextGroup = existingGroupIds[0] || 1;
    setCandidates([...candidates, { name: '', groupId: nextGroup }]);
    const updatedPins = [...pinBits];
    const idx = updatedPins.indexOf(0); if (idx !== -1) updatedPins[idx] = 1;
    setPinBits(updatedPins);
    setConfigLocked(false); setOriginalPreset(null); setConfigName('');
  };

  const handleRemoveCandidate = () => {
    if (candidates.length <= 2) return;
    setCandidates(candidates.slice(0, -1));
    const updatedPins = [...pinBits]; for (let i = 7; i >= 0; i--) {
      if (updatedPins[i] === 1) { updatedPins[i] = 0; break; }
    }
    setPinBits(updatedPins);
    setConfigLocked(false); setOriginalPreset(null); setConfigName('');
  };

  const updateCandidateName = (idx, value) => {
    const updated = [...candidates]; updated[idx].name = value; setCandidates(updated);
  };

  const updateCandidateGroup = (idx, groupId) => {
    const updated = [...candidates]; updated[idx].groupId = groupId; setCandidates(updated);
    setConfigLocked(false); setOriginalPreset(null); setConfigName('');
  };

  const loadPreset = (preset) => {
    const activeCount = preset.pinBits.filter(b => b === 1).length;
    setCandidates(Array(activeCount).fill(0).map((_, i) => ({
      name: candidates[i]?.name || '',
      groupId: preset.groupPins[i] || 1
    })));
    setPinBits(preset.pinBits);
    setGroupMap(preset.groupNames || {});
    setConfigName(preset.name);
    setConfigLocked(true);
    setOriginalPreset(preset);
    setTab('manual');
  };

  const isSameConfig = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const handleSubmit = async e => {
    e.preventDefault();
    const names = candidates.map(c => c.name.trim()).filter(Boolean);
    const groupIds = candidates.map(c => c.groupId);
    const maxGroupId = Math.max(...groupIds);
    if (maxGroupId > 4) return alert('Groups max 1–4.');
    const groupCount = {}; groupIds.forEach(g => groupCount[g] = (groupCount[g] || 0) + 1);
    if (!Object.values(groupCount).every(c => c >= 2)) return alert('Each group must have ≥2 candidates.');
    if (activeButtons !== candidates.length) return alert('Active buttons must match candidates.');

    const sparseGroups = Array(8).fill(null); let ci = 0;
    pinBits.forEach((b, i) => { if (b === 1) sparseGroups[i] = candidates[ci++].groupId; });

    let configId = null;
    if (originalPreset && configLocked && isSameConfig(pinBits, originalPreset.pinBits) && isSameConfig(sparseGroups, originalPreset.groupPins)) {
      configId = originalPreset.id;
    } else {
      if (!configName.trim()) return alert('Provide a config name.');
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

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded shadow" style={{ background: theme.cardBg, fontFamily: theme.fontFamily }}>
      <h1 className="text-2xl font-bold mb-6 text-center" style={{ color: theme.textPrimary }}>Create Election</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setTab('preset')}
          className={`px-4 py-2 rounded font-semibold ${tab === 'preset' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
        >
          Use Preset
        </button>
      </div>

      <ConfigPresetModal tab={tab} presetConfigs={presetConfigs} setTab={setTab} loadPreset={loadPreset} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Election Name" value={electionName} onChange={e => setElectionName(e.target.value)} required />
        <Input placeholder="Config Name" value={configName} onChange={e => setConfigName(e.target.value)} disabled={configLocked} />

        {candidates.map((c, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <Input placeholder={`Candidate ${i+1}`} value={c.name} onChange={e => updateCandidateName(i, e.target.value)} />
            {existingGroupIds.length === 0 ? (
              <Button type="button" onClick={() => setShowGroupModal(true)}>+ Add Group</Button>
            ) : (
              <select value={c.groupId} onChange={e => e.target.value === 'add' ? setShowGroupModal(true) : updateCandidateGroup(i, Number(e.target.value))} className="border p-2 rounded">
                {Object.entries(groupMap).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                {existingGroupIds.length < maxGroupsAllowed && <option value="add">+ Add new group</option>}
              </select>
            )}
          </div>
        ))}

        <div className="flex gap-2">
          {candidates.length < 8 && <Button type="button" onClick={handleAddCandidate}>+ Add</Button>}
          {candidates.length > 2 && <Button type="button" onClick={handleRemoveCandidate}>− Remove</Button>}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {pinBits.map((b, i) => (
            <button
              type="button"
              key={i}
              className={`w-12 h-12 rounded-full font-bold text-white ${b ? 'bg-green-600' : 'bg-red-600'}`}
              onClick={() => {
                const updated = [...pinBits]; updated[i] = updated[i] ? 0 : 1; setPinBits(updated);
              }}
            >{i+1}</button>
          ))}
        </div>

        <button type="submit" className="w-full py-2 mt-4 font-semibold text-white rounded" style={{ background: theme.secondaryBtn }}>Create Election</button>
      </form>

      <Modal title="Add New Group" open={showGroupModal} onOk={handleAddGroup} onCancel={() => setShowGroupModal(false)} okText="Add">
        <Input placeholder="Group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
        <p className="text-sm text-gray-500 mt-2">Max groups allowed: {maxGroupsAllowed}</p>
      </Modal>
    </div>
  );
}
