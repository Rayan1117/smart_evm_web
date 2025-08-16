'use client';

import { useEffect, useState } from 'react';

export default function ConfigListPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/utils/get-all-configs', {
      headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('evm.token')
      }
    })
      .then(res => res.json())
      .then(data => {
        console.log(data.configs);
        
        setConfigs(data.configs);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load configs:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Saved EVM Configs</h1>

      {loading ? (
        <p>Loading configs...</p>
      ) : configs.length === 0 ? (
        <p>No configs found.</p>
      ) : (
        <table className="w-full border border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Config ID</th>
              <th className="border p-2 text-left">Pin Bits</th>
              <th className="border p-2 text-left">Group Pins</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((cfg) => (
              <tr key={cfg.config_id} className="hover:bg-gray-50">
                <td className="border p-2">{cfg.config_name}</td>
                <td className="border p-2">
                  {JSON.parse(cfg.pin_bits)}
                </td>
                <td className="border p-2">
                  {JSON.parse(cfg.group_pins)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
