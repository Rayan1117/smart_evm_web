import React from 'react';

export default function ElectionCard({ election, ongoingElectionId, openModal }) {
  if (!election) return null;

  const isOngoing = election.election_id === ongoingElectionId;

  return (
    <div
      onClick={() => openModal(election)}
      className={`bg-yellow-500 p-10 m-5 rounded-3xl transition-transform duration-100 cursor-pointer
        ${isOngoing ? 'border-4 border-green-600' : ''}`}
    >
      <p className="text-md font-bold">{election.election_name}</p>
    </div>
  );
}
