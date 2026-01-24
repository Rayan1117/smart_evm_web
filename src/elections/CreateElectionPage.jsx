import { Modal, Input, Button, message, Alert } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigPresetModal from './components/ConfigPresetModal';

export default function ElectionForm() {
  const navigator = useNavigate();

  const [tab, setTab] = useState('manual');
  const [electionName, setElectionName] = useState('');
  const [candidates, setCandidates] = useState([
    { name: '', categoryId: null },
    { name: '', categoryId: null },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const [pinBits, setPinBits] = useState([1, 1, 0, 0, 0, 0, 0, 0]);
  const [presetConfigs, setPresetConfigs] = useState([]);
  const [configName, setConfigName] = useState('');

  const [categoryMap, setCategoryMap] = useState({});
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showManageCategories, setShowManageCategories] = useState(false);

  const [formError, setFormError] = useState('');
  const [activeCandidateIndex, setActiveCandidateIndex] = useState(null);

  useEffect(() => {
    fetch('https://voting-api-wnlq.onrender.com/utils/get-all-configs', {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('evm.token') }
    })
      .then(res => res.json())
      .then(data => {
        const parsed = (data?.configs || []).map(cfg => ({
          id: cfg.config_id,
          name: cfg.config_name,
          pinBits: JSON.parse(cfg.pin_bits || '[]'),
          categoryPins: JSON.parse(cfg.group_pins || '[]'),
          categoryNames: cfg.group_names ? JSON.parse(cfg.group_names) : {}
        }));
        setPresetConfigs(parsed);
      })
      .catch(() => setPresetConfigs([]));
  }, []);

  const activeButtons = pinBits.filter(b => b === 1).length;
  const maxCategoriesAllowed = Math.floor(activeButtons / 2);
  const existingCategoryIds = Object.keys(categoryMap).map(Number);

  const loadPreset = preset => {
    const newCandidates = [];
    preset.pinBits.forEach(bit => {
      if (bit === 1) newCandidates.push({ name: '', categoryId: null });
    });

    setCandidates(newCandidates);
    setPinBits(preset.pinBits);
    setCategoryMap(preset.categoryNames || {});
    setConfigName(preset.name || '');
    setTab('manual');
  };

  const togglePin = index => {
    const updated = [...pinBits];
    updated[index] = updated[index] ? 0 : 1;

    const enabled = updated.filter(b => b === 1).length;
    if (enabled < 2 || enabled > 8) return;

    setPinBits(updated);

    setCandidates(prev => {
      const copy = [...prev];
      while (copy.length < enabled) copy.push({ name: '', categoryId: null });
      return copy.slice(0, enabled);
    });
  };

  const addCandidate = () => {
    if (candidates.length >= 8) return message.warning('Maximum 8 candidates');

    const idx = pinBits.findIndex(b => b === 0);
    if (idx === -1) return;

    const updatedPins = [...pinBits];
    updatedPins[idx] = 1;

    setPinBits(updatedPins);
    setCandidates(prev => [...prev, { name: '', categoryId: null }]);
  };

  const removeCandidate = index => {
    if (candidates.length <= 2) {
      return message.warning('Minimum 2 candidates required');
    }

    const updatedPins = [...pinBits];
    let seen = -1;
    for (let i = 0; i < updatedPins.length; i++) {
      if (updatedPins[i] === 1) {
        seen++;
        if (seen === index) {
          updatedPins[i] = 0;
          break;
        }
      }
    }

    setPinBits(updatedPins);
    setCandidates(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setFormError('Category name cannot be empty');
      return message.warning('Category name cannot be empty');
    }

    if (existingCategoryIds.length >= maxCategoriesAllowed) {
      return message.warning(`Max ${maxCategoriesAllowed} categories allowed`);
    }

    const nextId = existingCategoryIds.length
      ? Math.max(...existingCategoryIds) + 1
      : 1;

    setCategoryMap(prev => ({ ...prev, [nextId]: newCategoryName.trim() }));

    if (activeCandidateIndex !== null) {
      setCandidates(prev => {
        const copy = [...prev];
        copy[activeCandidateIndex].categoryId = nextId;
        return copy;
      });
    }

    setNewCategoryName('');
    setShowCategoryModal(false);
    setActiveCandidateIndex(null);
  };

  const updateCategoryName = (id, name) =>
    setCategoryMap(prev => ({ ...prev, [id]: name }));

  const deleteCategory = id => {
    setCategoryMap(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
    setCandidates(prev =>
      prev.map(c => (c.categoryId === id ? { ...c, categoryId: null } : c))
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setFormError('');

    if (!electionName.trim()) return setFormError('Election name is required');
    if (!configName.trim()) return setFormError('Config name is required');
    if (candidates.some(c => !c.name.trim()))
      return setFormError('All candidates must have a name');
    if (candidates.some(c => !c.categoryId))
      return setFormError('Each candidate must be assigned to a category');

    const categoryCount = {};
    candidates.forEach(c => {
      categoryCount[c.categoryId] = (categoryCount[c.categoryId] || 0) + 1;
    });

    const invalidCategory = Object.values(categoryCount).some(count => count < 2);
    if (invalidCategory)
      return setFormError('Each category must have at least 2 candidates');

    setSubmitting(true);

    try {
      const sparseCategories = Array(8).fill(null);
      let ci = 0;
      pinBits.forEach((b, i) => {
        if (b === 1) sparseCategories[i] = candidates[ci++].categoryId;
      });

      const configRes = await fetch(
        'https://voting-api-wnlq.onrender.com/config/create-config',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('evm.token'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: configName,
            pins: pinBits,
            grouppins: sparseCategories,
            groupNames: categoryMap
          })
        }
      );

      if (!configRes.ok) throw new Error('Config creation failed');
      const configData = await configRes.json();

      const electionRes = await fetch(
        'https://voting-api-wnlq.onrender.com/election/create-election',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('evm.token'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            electionName,
            candidates: JSON.stringify(candidates.map(c => c.name.trim())),
            configId: configData.config_id
          })
        }
      );

      if (!electionRes.ok) throw new Error('Election creation failed');

      message.success('Election created successfully');
      navigator('/');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded shadow">
      <h1 className="text-2xl font-bold mb-6 text-center">Create Election</h1>

      {formError && (
        <Alert type="error" showIcon message="Cannot create election" description={formError} className="mb-4" />
      )}

      <Button onClick={() => setTab('preset')} className="mb-4">
        Copy Preset
      </Button>

      <ConfigPresetModal
        tab={tab}
        presetConfigs={presetConfigs}
        setTab={setTab}
        loadPreset={loadPreset}
      />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input placeholder="Election Name" value={electionName} onChange={e => setElectionName(e.target.value)} />
        <Input placeholder="Config Name" value={configName} onChange={e => setConfigName(e.target.value)} />

        {candidates.map((c, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder={`Candidate ${i + 1}`}
              value={c.name}
              onChange={e => {
                const copy = [...candidates];
                copy[i].name = e.target.value;
                setCandidates(copy);
              }}
            />

            {existingCategoryIds.length === 0 ? (
              <Button onClick={() => { setActiveCandidateIndex(i); setShowCategoryModal(true); }}>
                Add Category
              </Button>
            ) : (
              <select
                className="border p-2 rounded"
                value={c.categoryId || ''}
                onChange={e => {
                  if (e.target.value === 'add') {
                    setActiveCandidateIndex(i);
                    setShowCategoryModal(true);
                  } else {
                    const copy = [...candidates];
                    copy[i].categoryId = Number(e.target.value);
                    setCandidates(copy);
                  }
                }}
              >
                <option value="" disabled>Select category</option>
                {Object.entries(categoryMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
                {existingCategoryIds.length < maxCategoriesAllowed && (
                  <option value="add">Add new category</option>
                )}
              </select>
            )}

            <Button danger onClick={() => removeCandidate(i)}>−</Button>
          </div>
        ))}

        <Button type="dashed" onClick={addCandidate} block>
          + Add Candidate
        </Button>
        {existingCategoryIds.length > 0 && (
          <Button type="link" onClick={() => setShowManageCategories(true)}>
            Manage categories
          </Button>
        )}


        <Button htmlType="submit" type="primary" block loading={submitting}>
          Create Election
        </Button>
      </form>

      <div className="mt-8 text-center">
        <h3 className="mb-3 font-semibold">Select Buttons</h3>
        <div className="flex justify-center gap-3 flex-wrap">
          {pinBits.map((bit, i) => (
            <button
              key={i}
              type="button"
              onClick={() => togglePin(i)}
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                backgroundColor: bit ? '#22c55e' : '#ef4444',
                color: '#fff',
                border: 'none',
                fontWeight: 600
              }}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <Modal
        title="Add Category"
        open={showCategoryModal}
        onOk={handleAddCategory}
        onCancel={() => { setShowCategoryModal(false); setActiveCandidateIndex(null); }}
      >
        <Input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} />
      </Modal>

      <Modal
        title="Manage Categories"
        open={showManageCategories}
        footer={null}
        onCancel={() => setShowManageCategories(false)}
      >
        {Object.entries(categoryMap).map(([id, name]) => (
          <div key={id} className="flex gap-2 mb-2">
            <Input value={name} onChange={e => updateCategoryName(Number(id), e.target.value)} />
            <Button danger onClick={() => deleteCategory(Number(id))}>Delete</Button>
          </div>
        ))}
      </Modal>
    </div>
  );
}
