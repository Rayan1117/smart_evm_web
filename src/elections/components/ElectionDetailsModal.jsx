import { Button, List, Modal } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ElectionDetailsModal({ election, trigger, ongoingElectionId }) {
  const navigate = useNavigate();

  if (!election) return null;

  let candidateNames = [];
  let pinBits = [];
  let groupPins = [];
  let groupNames = {};

  try {
    candidateNames = JSON.parse(election.candidates || '[]');
    pinBits = JSON.parse(election.pin_bits || '[]');
    groupPins = JSON.parse(election.group_pins || '[]');
    groupNames = JSON.parse(election.group_names || '{}');
  } catch (err) {}

  console.log(election);
  

  const mappedCandidates = [];
  let candidateIdx = 0;
  for (let i = 0; i < pinBits.length; i++) {
    if (pinBits[i] === 1) {
      mappedCandidates.push({
        name: candidateNames[candidateIdx] || 'N/A',
        category: groupNames[groupPins[i]] || 'Unknown'
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
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>{election.election_name}</h2>
      <List
        header={<div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Candidates & Categories</div>}
        dataSource={mappedCandidates}
        renderItem={(item, idx) => (
          <List.Item key={idx}>
            {item.name} - <span style={{ fontWeight: 500 }}>{item.category}</span>
          </List.Item>
        )}
      />
    </Modal>
  );
}
