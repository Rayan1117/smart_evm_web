import { Input } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

export default function CreateConfigPage() {

    const navigator = useNavigate()
    const [configName, setConfigName] = useState("")
    const [groupShapes, setGroupShapes] = useState([1, 2]);
    const [pinBits, setPinBits] = useState([0, 0, 0, 0, 0, 0, 0, 0]);

    const handleTogglePinBit = (index) => {
        const updated = [...pinBits];
        updated[index] = updated[index] === 1 ? 0 : 1;
        setPinBits(updated);
    };

    const updateShapeAt = (index, shapeId) => {
        const updated = [...groupShapes];
        updated[index] = shapeId;
        setGroupShapes(updated);
    };

    const handleAddGroup = () => {
        if (groupShapes.length < 8) {
            setGroupShapes([...groupShapes, 1]);
        }
    };

    const handleRemoveGroup = () => {
        if (groupShapes.length > 2) {
            setGroupShapes(groupShapes.slice(0, -1));
        }
    };

   const handleSubmit = (e) => {
    e.preventDefault();

    const activePins = pinBits.filter((b) => b === 1).length;
    if (groupShapes.length !== activePins) {
        alert("Number of group pins must match number of active pin bits");
        return;
    }

    // Proper sparse group pin mapping
    let ci = 0;
    const sparseGroupPins = Array(8).fill(null);
    for (let i = 0; i < 8; i++) {
        if (pinBits[i] === 1) {
            sparseGroupPins[i] = groupShapes[ci];
            ci++;
        }
    }

    console.log("Submitting config to DB", pinBits, sparseGroupPins);

    fetch("http://localhost:5000/config/create-config", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + localStorage.getItem("evm.token"),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "name": configName,
            "pins": pinBits,
            "grouppins": sparseGroupPins
        })
    }).then(res => {
        if (res.status === 201) {
            navigator("/");
        } else {
            res.json().then(r => console.log(r));
        }
    });
};


    return (
        <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
            <h1 className="text-xl font-bold mb-4">Create EVM Config</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <Input placeholder='enter the config name' className='input my-5' onChange={(e) => setConfigName(e.target.value)} required></Input>
                    <label className="block text-sm font-medium mb-2">Group Pins</label>
                    {groupShapes.map((shapeId, idx) => (
                        <div key={idx} className="flex items-center gap-2 mb-2">
                            <select
                                value={shapeId}
                                onChange={(e) => updateShapeAt(idx, parseInt(e.target.value))}
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
                        {groupShapes.length < 8 && (
                            <button
                                type="button"
                                onClick={handleAddGroup}
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                                + Add Group
                            </button>
                        )}
                        {groupShapes.length > 2 && (
                            <button
                                type="button"
                                onClick={handleRemoveGroup}
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            >
                                − Remove
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">Pin Bits (Button Status)</label>
                    <div className="grid grid-cols-4 gap-3">
                        {pinBits.map((bit, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleTogglePinBit(idx)}
                                className={`rounded p-4 border text-white text-center ${bit ? 'bg-green-600' : 'bg-red-600'}`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
                >
                    Submit Config
                </button>
            </form>
        </div>
    );
}
