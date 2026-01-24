import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function ElectionCard({ election, ongoingElectionId, openModal, theme, onDeleted }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPressing, setIsPressing] = useState(false);
  const [error, setError] = useState(null);
  const pressTimer = useRef(null);
  const longPressTriggered = useRef(false);

  if (!election) return null;

  const isOngoing = election.election_id === ongoingElectionId;

  const startPress = () => {
    setIsPressing(true);
    longPressTriggered.current = false;
    pressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setShowConfirm(true);
      setIsPressing(false);
    }, 600);
  };

  const endPress = () => {
    clearTimeout(pressTimer.current);
    setIsPressing(false);
  };

  const handleClick = () => {
    if (!longPressTriggered.current) openModal(election);
  };

  const handleEndElection = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `https://voting-api-wnlq.onrender.com/election/delete-election?electionId=${election.election_id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: 'Bearer ' + localStorage.getItem('evm.token'),
          },
        }
      );

      if (res.ok) {
        setShowConfirm(false);
        onDeleted?.(election.election_id);
      } else {
        const data = await res.json();
        setError(data?.error || 'Failed to delete election');
      }
    } catch {
      setError('Network error occurred while deleting election');
    } finally {
      setIsDeleting(false);
    }
  };

  const modal = showConfirm ? (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2147483647
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '1rem',
          padding: '2rem',
          width: '20rem',
          boxShadow: theme.cardShadow,
        }}
      >
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            marginBottom: '1rem',
            color: theme.textPrimary,
          }}
        >
          Confirm End Election
        </h2>

        <p
          style={{
            marginBottom: error ? '0.75rem' : '1.5rem',
            color: theme.textSecondary,
          }}
        >
          Are you sure you want to end this election?
        </p>

        {error && (
          <div
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              borderRadius: '0.75rem',
              backgroundColor: '#FEE2E2',
              color: '#991B1B',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
          }}
        >
          <button
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              backgroundColor: '#E5E7EB',
              fontWeight: 500,
            }}
            onClick={() => setShowConfirm(false)}
            disabled={isDeleting}
          >
            No
          </button>
          <button
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '9999px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 600,
            }}
            onClick={handleEndElection}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Yes'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchCancel={endPress}
        onClick={handleClick}
        style={{
          background: isOngoing ? theme.ongoingCardBg : theme.cardBg,
          border: `1px solid ${isOngoing ? theme.bannerBorder : '#E5E7EB'}`,
          borderRadius: '1rem',
          padding: '1.5rem 2rem',
          cursor: 'pointer',
          transform: isPressing ? 'scale(0.98)' : 'scale(1)',
          boxShadow: isPressing
            ? '0 4px 10px rgba(0,0,0,0.1)'
            : theme.cardShadow,
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p
          style={{
            color: theme.textPrimary,
            fontSize: '1.125rem',
            fontWeight: 600,
            margin: 0,
            userSelect: 'none'
          }}
        >
          {election.election_name}
        </p>

        {isOngoing && (
          <span
            style={{
              background: theme.bannerBorder,
              color: '#FFFFFF',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Ongoing
          </span>
        )}
      </div>

      {showConfirm && createPortal(modal, document.body)}
    </>
  );
}
