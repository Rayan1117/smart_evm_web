import { Button, List, Empty } from 'antd';
import React, { useEffect, useState } from 'react';
import ElectionCard from './components/ElectionCard';
import { Header } from 'antd/es/layout/layout';
import ElectionDetailsModal from './components/ElectionDetailsModal';
import { Link } from 'react-router-dom';

export default function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [ongoingElection, setOngoingElection] = useState(null);
  const [modalData, setModalData] = useState({ isOpen: false, election: null });

  useEffect(() => {
    const token = localStorage.getItem("evm.token");
    fetch("http://localhost:5000/utils/get-all-elections", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(async res => {
        const data = await res.json();
        const electionsList = data || [];
        setElections(electionsList);

        // Find ongoing election if exists
        const current = electionsList.find(e => e.isCurrent);
        setOngoingElection(current || null);
      })
      .catch(err => {
        console.error(err);
        setElections([]); // Ensure state is empty on error
      });
  }, []);

  const openModal = (election) => {
    setModalData({ isOpen: true, election });
  };

  return (
    <div>
      <Header className='bg-blue-800 font-bold text-lg pt-5 text-yellow-500'>Elections</Header>

      {/* Running marquee for ongoing election */}
      {ongoingElection && (
        <div
          className='bg-yellow-500 rounded-md w-1/2 relative left-1/4 overflow-hidden cursor-pointer'
          onClick={() => openModal(ongoingElection)}
        >
          <h1 className='animate-marquee text-center select-none'>
            Currently, an election is ongoing. Click here to view
          </h1>
        </div>
      )}

      {/* Election Details Modal */}
      {modalData.isOpen && (
        <ElectionDetailsModal
          election={modalData.election}
          trigger={setModalData}
          ongoingElectionId={ongoingElection?.election_id || null}
        />
      )}

      <div className='ml-10 mt-5'>
        {elections.length === 0 ? (
          <Empty description="No elections found in the database." />
        ) : (
          <List>
            {elections.map((election, idx) => (
              <ElectionCard
                key={idx}
                election={election}
                ongoingElectionId={ongoingElection?.election_id || null}
                openModal={openModal}
              />
            ))}
          </List>
        )}
      </div>

      <Link to="/create-election">
        <Button className='fixed bottom-10 right-10 rounded-full h-14 w-14 bg-blue-800 text-yellow-50 font-bold hover:scale-105'>+</Button>
      </Link>
    </div>
  );
}
