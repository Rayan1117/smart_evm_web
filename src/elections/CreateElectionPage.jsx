import { Modal, Input, Button, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigPresetModal from './components/ConfigPresetModal';

export default function ElectionForm() {
  const navigator = useNavigate();

  const [tab, setTab] = useState('manual');
  const [electionName, setElectionName] = useState('');
  const [candidates, setCandidates] = useState([
    { name: '', categoryId: 1 },
    { name: '', categoryId: 1 },
  ]);

  const [pinBits, setPinBits] = useState([1, 1, 0, 0, 0, 0, 0, 0]);
  const [presetConfigs, setPresetConfigs] = useState([]);
  const [configName, setConfigName] = useState('');
  const [configLocked, setConfigLocked] = useState(false);
  const [originalPreset, setOriginalPreset] = useState(null);

  const [categoryMap, setCategoryMap] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch("https://voting-api-wnlq.onrender.com/utils/get-all-configs", {
          headers: { Authorization: "Bearer " + localStorage.getItem("evm.token") }
        });

        if (!res.ok) throw new Error(`Failed to load configs (${res.status})`);

        const data = await res.json();
        if (!data || !Array.isArray(data.configs)) {
          setPresetConfigs([]);
          return;
        }

        const parsed = data.configs.map(cfg => ({
          id: cfg.config_id,
          name: cfg.config_name,
          pinBits: JSON.parse(cfg.pin_bits || '[]'),
          categoryPins: JSON.parse(cfg.group_pins || '[]'),
          categoryNames: cfg.group_names ? JSON.parse(cfg.group_names) : {}
        }));

        setPresetConfigs(parsed);
      } catch (err) {
        console.error("Error fetching configs:", err);
        setPresetConfigs([]);
      }
    };

    fetchConfigs();
  }, []);

  const activeButtons = pinBits.filter(b => b === 1).length;
  const maxCategoriesAllowed = Math.floor(activeButtons / 2);
  const existingCategoryIds = Object.keys(categoryMap).map(Number);

  const unlockPreset = () => {
    setConfigLocked(false);
    setOriginalPreset(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return message.warning('Category name cannot be empty.');
    if (existingCategoryIds.length >= maxCategoriesAllowed)
      return message.warning(`Max ${maxCategoriesAllowed} categories allowed.`);

    const nextId = existingCategoryIds.length ? Math.max(...existingCategoryIds) + 1 : 1;

    setCategoryMap(prev => ({ ...prev, [nextId]: newCategoryName.trim() }));

    // Assign the new category to any candidate that does not have one
    setCandidates(prev =>
      prev.map(c => ({ ...c, categoryId: c.categoryId || nextId }))
    );

    setNewCategoryName('');
    setShowCategoryModal(false);
    unlockPreset();
  };

  const handleAddCandidate = () => {
    if (candidates.length >= 8) return;
    const idx = pinBits.indexOf(0);
    if (idx === -1) return;

    const updatedPins = [...pinBits];
    updatedPins[idx] = 1;

    setPinBits(updatedPins);
    setCandidates([...candidates, { name: '', categoryId: existingCategoryIds[0] || 1 }]);
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

  const updateCandidateCategory = (idx, categoryId) => {
    const updated = [...candidates];
    updated[idx].categoryId = categoryId;
    setCandidates(updated);
    unlockPreset();
  };

  const loadPreset = preset => {
    if (!preset) return;
    const newCandidates = [];

    preset.pinBits.forEach((bit, pinIndex) => {
      if (bit === 1) {
        newCandidates.push({
          name: '',
          categoryId: preset.categoryPins?.[pinIndex] ?? 1
        });
      }
    });

    setCandidates(newCandidates);
    setPinBits(preset.pinBits);
    setCategoryMap(preset.categoryNames || {});
    setConfigLocked(true);
    setOriginalPreset(preset);
    setConfigName('');
    setTab('manual');
  };

  const isSameConfig = (a, b) => JSON.stringify(a) === JSON.stringify(b);

  const handleSubmit = async e => {
    e.preventDefault();

    const names = candidates.map(c => c.name.trim());
    if (names.some(n => !n)) return message.warning('Candidate name missing');
    if (activeButtons !== candidates.length)
      return message.warning('Active buttons must match candidates.');

    const categoryCount = {};
    candidates.forEach(c => {
      categoryCount[c.categoryId] = (categoryCount[c.categoryId] || 0) + 1;
    });

    if (!Object.values(categoryCount).every(v => v >= 2))
      return message.warning('Each category must have at least 2 candidates.');

    const sparseCategories = Array(8).fill(null);
    let ci = 0;
    pinBits.forEach((b, i) => {
      if (b === 1) sparseCategories[i] = candidates[ci++].categoryId;
    });

    let configId;

    try {
      if (
        configLocked &&
        originalPreset &&
        isSameConfig(pinBits, originalPreset.pinBits) &&
        isSameConfig(sparseCategories, originalPreset.categoryPins)
      ) {
        configId = originalPreset.id;
      } else {
        if (!configName.trim()) return message.warning('Provide a config name.');

        const res = await fetch('https://voting-api-wnlq.onrender.com/config/create-config', {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem("evm.token"),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: configName,
            pins: pinBits,
            grouppins: sparseCategories,
            groupNames: categoryMap
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

      message.success('Election created successfully!');
      navigator('/');
    } catch (err) {
      console.error(err);
      message.error('Failed to create election');
    }
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

            {existingCategoryIds.length === 0 ? (
              <Button type="button" onClick={() => setShowCategoryModal(true)}>+ Add Category</Button>
            ) : (
              <select
                value={c.categoryId || ''}
                onChange={e => {
                  if (e.target.value === 'add') {
                    setShowCategoryModal(true);
                  } else {
                    updateCandidateCategory(i, Number(e.target.value));
                  }
                }}
                className="border p-2 rounded"
              >
                {Object.entries(categoryMap || {}).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
                {existingCategoryIds.length < maxCategoriesAllowed && (
                  <option value="add">+ Add new category</option>
                )}
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

      <Modal
        title="Add New Category"
        open={showCategoryModal}
        onOk={handleAddCategory}
        onCancel={() => setShowCategoryModal(false)}
      >
        <Input placeholder="Category name" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
        <p className="text-sm text-gray-500 mt-2">Max categories allowed: {maxCategoriesAllowed}</p>
      </Modal>
    </div>
  );
}
