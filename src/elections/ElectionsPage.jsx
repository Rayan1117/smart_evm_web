import { Button, List, Empty, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import ElectionCard from './components/ElectionCard';
import { Header } from 'antd/es/layout/layout';
import ElectionDetailsModal from './components/ElectionDetailsModal';
import { Link, useNavigate } from 'react-router-dom';
import { LogoutOutlined } from '@ant-design/icons';

export default function ElectionsPage() {
  const [elections, setElections] = useState([]);
  const [ongoingElection, setOngoingElection] = useState(null);
  const [modalData, setModalData] = useState({ isOpen: false, election: null });

  const [logoutModalOpen, setLogoutModalOpen] = useState(false); // ✅ added

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("evm.token");
    fetch("https://voting-api-wnlq.onrender.com/utils/get-all-elections", {
      headers: { Authorization: "Bearer " + token }
    })
      .then(async res => {
        const data = await res.json();
        const electionsList = data || [];
        setElections(electionsList);
        const current = electionsList.find(e => e.isCurrent);
        setOngoingElection(current || null);
      })
      .catch(() => setElections([]));
  }, []);

  const openModal = (election) => setModalData({ isOpen: true, election });

  // ✅ open logout modal
  const handleLogoutClick = () => {
    setLogoutModalOpen(true);
  };

  // ✅ confirm logout
  const confirmLogout = () => {
    localStorage.removeItem("evm.token");
    localStorage.removeItem("evm.role");
    localStorage.removeItem("evm.username");
    navigate("/login");
  };

  const theme = {
    header: '#1C74E9',
    headerText: '#FFFFFF',
    cardBg: '#FFFFFF',
    ongoingCardBg: '#EFF6FF',
    bg: '#F5F5F5',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    buttonPrimary: '#1C74E9',
    buttonText: '#FFFFFF',
    bannerGradient: 'linear-gradient(145deg, #EFF6FF, #DBEAFE)',
    bannerBorder: '#1C74E9',
    cardShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontFamily: "'Inter', sans-serif",
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: theme.bg,
        fontFamily: theme.fontFamily,
        position: 'relative',
        zIndex: 0,
        userSelect: 'none',
      }}
    >
      <Header
        style={{
          background: theme.header,
          color: theme.headerText,
          fontSize: '1.75rem',
          fontWeight: 600,
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: theme.cardShadow,
          borderBottomLeftRadius: '0.75rem',
          borderBottomRightRadius: '0.75rem',
          position: 'relative',
          zIndex: 1,
          userSelect: 'none',
        }}
      >
        Elections

        {/* ✅ Logout Icon Button */}
        <Button
          onClick={handleLogoutClick}
          icon={<LogoutOutlined />}
          style={{
            position: 'absolute',
            right: '2rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '1.3rem',
            cursor: 'pointer'
          }}
        />
      </Header>

      {/* ✅ Logout Modal */}
      <Modal
        title="Logout"
        open={logoutModalOpen}
        onOk={confirmLogout}
        onCancel={() => setLogoutModalOpen(false)}
        okText="Yes"
        cancelText="No"
        centered
      >
        <p>Do you want to logout?</p>
      </Modal>

      {ongoingElection && (
        <div
          onClick={() => openModal(ongoingElection)}
          style={{
            background: theme.bannerGradient,
            borderLeft: `4px solid ${theme.bannerBorder}`,
            boxShadow: theme.cardShadow,
            borderRadius: '0.5rem',
            maxWidth: '40rem',
            margin: '2rem auto',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            padding: '1.25rem 1.75rem',
            position: 'relative',
            zIndex: 1,
            userSelect: 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = theme.cardShadow;
          }}
        >
          <h1
            style={{
              fontSize: '1rem',
              fontWeight: 500,
              textAlign: 'center',
              color: theme.textPrimary,
              margin: 0,
              userSelect: 'none',
            }}
          >
            An election is currently ongoing. Click here to view details.
          </h1>
        </div>
      )}

      {modalData.isOpen && (
        <ElectionDetailsModal
          election={modalData.election}
          trigger={setModalData}
          ongoingElectionId={ongoingElection?.election_id || null}
        />
      )}

      <div
        style={{
          maxWidth: '80rem',
          margin: '2rem auto',
          padding: '0 1.5rem',
          position: 'relative',
          zIndex: 0,
          userSelect: 'none',
        }}
      >
        {elections.length === 0 ? (
          <Empty description="No elections found in the database." />
        ) : (
          <List
            dataSource={elections}
            renderItem={(election, idx) => (
              <div
                style={{
                  marginBottom: '1.5rem',
                  borderRadius: '0.75rem',
                  background: election.election_id === ongoingElection?.election_id
                    ? theme.ongoingCardBg
                    : theme.cardBg,
                  boxShadow: theme.cardShadow,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  position: 'relative',
                  zIndex: 0,
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = theme.cardShadow;
                }}
              >
                <ElectionCard
                  key={idx}
                  election={election}
                  ongoingElectionId={ongoingElection?.election_id || null}
                  openModal={openModal}
                  theme={theme}
                  onDeleted={(deletedId) => {
                    setElections((prev) => prev.filter(e => e.election_id !== deletedId));
                    if (ongoingElection?.election_id === deletedId) {
                      setOngoingElection(null);
                    }
                  }}
                />
              </div>
            )}
          />
        )}
      </div>

      {localStorage.getItem("evm.role") === "admin" && <Link to="/create-election">
        <Button
          style={{
            position: 'fixed',
            bottom: '2.5rem',
            right: '2.5rem',
            height: '3.5rem',
            width: '3.5rem',
            borderRadius: '9999px',
            background: theme.buttonPrimary,
            color: theme.buttonText,
            fontWeight: 700,
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            zIndex: 2,
            userSelect: 'none',
          }}
        >
          +
        </Button>
      </Link>}
    </div>
  );
}