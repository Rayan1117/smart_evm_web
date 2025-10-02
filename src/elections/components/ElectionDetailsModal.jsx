import { Button, List, Modal } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ElectionDetailsModal({ election, trigger, ongoingElectionId }) {
  const navigate = useNavigate();

  if (!election) return null;

  const shapeOptions = [
    { id: 1, name: 'Circle', icon: '⚪' },
    { id: 2, name: 'Square', icon: '⬛' },
    { id: 3, name: 'Triangle', icon: '🔺' },
    { id: 4, name: 'Star', icon: '⭐' },
  ];

  // safely parse JSON fields
  let candidateNames = [];
  let pinBits = [];
  let groupPins = [];
  try {
    candidateNames = JSON.parse(election.candidates || '[]');
    pinBits = JSON.parse(election.pin_bits || '[]');
    groupPins = JSON.parse(election.group_pins || '[]');
  } catch (err) {
    console.error("Error parsing election JSON fields:", err);
  }

  // Map candidates with pinBits & groupPins
  const mappedCandidates = [];
  let candidateIdx = 0;
  for (let i = 0; i < pinBits.length; i++) {
    if (pinBits[i] === 1) {
      mappedCandidates.push({
        name: candidateNames[candidateIdx] || 'N/A',
        shape: shapeOptions.find(s => s.id === groupPins[i])?.icon || '❓'
      });
      candidateIdx++;
    }
  }

  const isOngoing = election.election_id === ongoingElectionId;

  return (
    <Modal
      open={true}
      onCancel={() => trigger({ isOpen: false, election: null })}
      width={800}
      footer={
        <>
          {isOngoing ? (
            <>
              <Button
                type="primary"
                onClick={() => navigate(`/election-reset/1/?electionId=${election.election_id}`)}
              >
                Resume Election
              </Button>
              <Button onClick={() => navigate("/election-live-stats/" + election.election_id)}>View Live Election</Button>
            </>
          ) : election.isEnd ? (
            <Button onClick={() => navigate("/election-result/" + election.election_id)}>View Result</Button>
          ) : (
            <Button
              type="primary"
              disabled={!!ongoingElectionId}
              onClick={() => navigate(`/election-reset/0/?electionId=${election.election_id}`)}
            >
              Start Election
            </Button>
          )}
        </>
      }
    >
      <h2 className="text-xl font-bold mb-4">{election.election_name}</h2>
      <List
        header={<div>Candidates & Groups</div>}
        dataSource={mappedCandidates}
        renderItem={(item, idx) => (
          <List.Item key={idx}>
            {item.name} <span className="ml-2">{item.shape}</span>
          </List.Item>
        )}
      />
    </Modal>
  );
}
