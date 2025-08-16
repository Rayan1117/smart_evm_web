import { Modal } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfigPresetModal from './components/ConfigPresetModal';

const shapeOptions = [
  { id: 1, name: 'Circle', icon: '⚪' },
  { id: 2, name: 'Square', icon: '⬛' },
  { id: 3, name: 'Triangle', icon: '🔺' },
  { id: 4, name: 'Star', icon: '⭐' },
  { id: 5, name: 'Heart', icon: '❤️' },
  { id: 6, name: 'Diamond', icon: '💎' },
  { id: 7, name: 'Clover', icon: '🍀' },
  { id: 8, name: 'Moon', icon: '🌙' },
];

export default function ElectionForm() {
  const navigator = useNavigate();
  const [tab, setTab] = useState('manual');
  const [electionName, setElectionName] = useState('');
  const [candidates, setCandidates] = useState([
    { name: '', shapeId: 1 },
    { name: '', shapeId: 2 },
  ]);
  const [pinBits, setPinBits] = useState([1, 1, 0, 0, 0, 0, 0, 0]);
  const [presetConfigs, setPresetConfigs] = useState([]);
  const [configName, setConfigName] = useState('');
  const [configLocked, setConfigLocked] = useState(false);
  const [originalPreset, setOriginalPreset] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/utils/get-all-configs", {
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("evm.token")
      }
    })
      .then(res => res.json())
      .then(data => {
        const parsed = data.configs.map(cfg => ({
          id: cfg.config_id,
          name: cfg.config_name,
          pinBits: JSON.parse(cfg.pin_bits),
          groupPins: JSON.parse(cfg.group_pins)
        }));

        setPresetConfigs(parsed);
      })
      .catch(err => console.error("Failed to load presets", err));
  }, []);

  const togglePinBit = (index) => {
    const updated = [...pinBits];
    updated[index] = updated[index] ? 0 : 1;
    setPinBits(updated);

    if (originalPreset) {
      setConfigLocked(false);
      setOriginalPreset(null);
      setConfigName('');
    }
  };

  const handleAddCandidate = () => {
    if (candidates.length < 8) {
      const nextShape = shapeOptions[candidates.length % shapeOptions.length].id;
      setCandidates([...candidates, { name: '', shapeId: nextShape }]);
      const updatedPinBits = [...pinBits];
      const nextOffIndex = updatedPinBits.indexOf(0);
      if (nextOffIndex !== -1) updatedPinBits[nextOffIndex] = 1;
      setPinBits(updatedPinBits);

      if (originalPreset) {
        setConfigLocked(false);
        setOriginalPreset(null);
        setConfigName('');
      }
    }
  };

  const handleRemoveCandidate = () => {
    if (candidates.length > 2) {
      const updatedCandidates = candidates.slice(0, -1);
      setCandidates(updatedCandidates);
      const updatedPinBits = [...pinBits];
      for (let i = 7; i >= 0; i--) {
        if (updatedPinBits[i] === 1) {
          updatedPinBits[i] = 0;
          break;
        }
      }
      setPinBits(updatedPinBits);

      if (originalPreset) {
        setConfigLocked(false);
        setOriginalPreset(null);
        setConfigName('');
      }
    }
  };

  const updateCandidateShape = (index, shapeId) => {
    const updated = [...candidates];
    updated[index].shapeId = shapeId;
    setCandidates(updated);

    if (originalPreset) {
      setConfigLocked(false);
      setOriginalPreset(null);
      setConfigName('');
    }
  };

  const updateCandidateName = (index, value) => {
    const updated = [...candidates];
    updated[index].name = value;
    setCandidates(updated);
  };

  const loadPreset = (preset) => {
    const activeCount = preset.pinBits.filter((b) => b === 1).length;

    const updatedCandidates = Array(activeCount)
      .fill(0)
      .map((_, i) => ({
        name: candidates[i]?.name || '',
        shapeId: preset.groupPins[i] || 1
      }));

    setCandidates(updatedCandidates);
    setPinBits(preset.pinBits);
    setOriginalPreset(preset);
    setConfigName(preset.name || '');
    setConfigLocked(true);
    setTab('manual');
  };

  const isSameConfig = (a, b) => {
    return JSON.stringify(a) === JSON.stringify(b);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const names = candidates.map((c) => c.name.trim()).filter((n) => n !== '');
    const shapeIds = candidates.map((c) => c.shapeId);
    const uniqueShapes = new Set(shapeIds);

    if (uniqueShapes.size < 2) {
      alert('At least 2 distinct shapes (groups) are required.');
      return;
    }

    const activeButtons = pinBits.filter((bit) => bit === 1).length;
    if (activeButtons !== candidates.length) {
      alert(`Active buttons (${activeButtons}) must match candidate count (${candidates.length})`);
      return;
    }

    const sparseCandidates = Array(8).fill(null);
    const sparseGroups = Array(8).fill(null);
    let ci = 0;
    pinBits.forEach((bit, i) => {
      if (bit === 1) {
        sparseCandidates[i] = candidates[ci].name.trim();
        sparseGroups[i] = candidates[ci].shapeId;
        ci++;
      }
    });

    let configId = null;
    if (originalPreset && configLocked && isSameConfig(pinBits, originalPreset.pinBits) && isSameConfig(sparseGroups, originalPreset.groupPins)) {
      configId = originalPreset.id;
    } else {
      if (configName.trim() === '') {
        alert("Please provide a config name for a custom configuration.");
        return;
      }

      const configRes = await fetch("http://localhost:5000/config/create-config", {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("evm.token"),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: configName,
          pins: pinBits,
          grouppins: sparseGroups
        })
      });
      const configData = await configRes.json();
      configId = configData.config_id;
    }

    const candidateNames = candidates.map(val => val.name)
    fetch("http://localhost:5000/election/create-election", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + localStorage.getItem("evm.token"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        candidates: JSON.stringify(candidateNames),
        electionName,
        configId
      })
    }).then(res => {
      if (res.status === 201) {
        navigator("/");
      } else {
        res.json().then(r => console.log(r));
      }
    });
  };


  const handleCreateWithoutConfig = () => {

    const form = document.getElementById("electionForm")
    form.requestSubmit()

    const electionData = {
      electionName,
      candidates: JSON.stringify(candidates.map((c) => c.name)),
      configId: null, // explicitly set to null
    };

    fetch("http://localhost:5000/election/create-election", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + localStorage.getItem("evm.token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(electionData),
    })
      .then((res) => {
        if (res.status === 201) {
          alert("Election created without config!");
          navigator("/"); // or your redirection logic
        } else {
          res.json().then((data) => console.error(data));
        }
      })
      .catch((err) => console.error("Error:", err));
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Create Election</h1>

      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={() => setTab('preset')}
          className={`px-4 py-2 rounded ${tab === 'preset' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Use Preset
        </button>
      </div>

      <ConfigPresetModal tab={tab} presetConfigs={presetConfigs} setTab={setTab} shapeOptions={shapeOptions} setPresetConfigs={setPresetConfigs} />

      <form id='electionForm' onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-1">Election Name</label>
          <input
            type="text"
            value={electionName}
            onChange={(e) => setElectionName(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Config Name</label>
          <input
            type="text"
            value={configName}
            onChange={(e) => setConfigName(e.target.value)}
            className="w-full border border-gray-300 p-2 rounded"
            disabled={configLocked}
            placeholder="Optional (only for custom configs)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Candidates</label>
          {candidates.map((candidate, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={candidate.name}
                onChange={(e) => updateCandidateName(idx, e.target.value)}
                placeholder={`Candidate ${idx + 1}`}
                className="flex-1 border border-gray-300 p-2 rounded"
                required
              />
              <select
                value={candidate.shapeId}
                onChange={(e) => updateCandidateShape(idx, parseInt(e.target.value))}
                className="border border-gray-300 p-2 rounded"
              >
                {shapeOptions.map((shape) => (
                  <option key={shape.id} value={shape.id}>
                    {shape.icon} {shape.name}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex gap-3 mt-2">
            {candidates.length < 8 && (
              <button
                type="button"
                onClick={handleAddCandidate}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                + Add
              </button>
            )}
            {candidates.length > 2 && (
              <button
                type="button"
                onClick={handleRemoveCandidate}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                − Remove
              </button>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">EVM Buttons (Pin Bits)</label>
          <div className="grid grid-cols-4 gap-2">
            {pinBits.map((bit, idx) => (
              <button
                key={idx}
                type="button"
                className={`w-12 h-12 rounded-full text-white font-bold text-lg ${bit ? 'bg-green-600' : 'bg-red-600'}`}
                onClick={() => togglePinBit(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>


        <button
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Create Election
        </button>
        <button
          type="button"
          onClick={handleCreateWithoutConfig}
          className="w-full bg-gray-500 text-white py-2 rounded hover:bg-gray-600 scale-[80%]"
        >
          Create Without Config
        </button>

      </form>
    </div>
  );
}
