import React from 'react';

export default function ElectionCard({ election, ongoingElectionId, openModal, theme }) {
  if (!election) return null;

  const isOngoing = election.election_id === ongoingElectionId;

  return (
    <div
      onClick={() => openModal(election)}
      style={{
        background: isOngoing ? theme.ongoingCardBg : theme.cardBg,
        border: `1px solid ${isOngoing ? theme.bannerBorder : '#E5E7EB'}`,
        borderRadius: '1rem',
        padding: '1.5rem 2rem',
        margin: '0',
        cursor: 'pointer',
        boxShadow: theme.cardShadow,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = theme.cardShadow;
      }}
    >
      <div>
        <p style={{ color: theme.textPrimary, fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
          {election.election_name}
        </p>
        <p style={{ color: theme.textSecondary, fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
          {election.description || 'No description available'}
        </p>
      </div>
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
            whiteSpace: 'nowrap',
          }}
        >
          Ongoing
        </span>
      )}
    </div>
  );
}
