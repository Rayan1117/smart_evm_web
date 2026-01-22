import { Header } from 'antd/es/layout/layout';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ElectionResultPage() {
  const { electionId } = useParams();
  const [electionName, setElectionName] = useState("");
  const [results, setResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);

  const candidateNamesRef = useRef([]);
  const pinBitsRef = useRef([]);
  const categoryPinsRef = useRef([]);

  const theme = {
    bg: '#F3F4F6',
    headerBg: 'linear-gradient(90deg, #1E3A8A, #3B82F6)',
    cardShadow: '0 8px 24px rgba(0,0,0,0.08)',
    fontFamily: "'Inter', sans-serif",
    textPrimary: '#111827',
    textSecondary: '#4B5563'
  }

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(`http://localhost:5000/utils/get-vote-count/${electionId}`, {
          headers: { "Authorization": "Bearer " + localStorage.getItem("evm.token") }
        });
        if (!response.ok) throw new Error("Failed to fetch vote data");
        const body = await response.json();
        if (!body || body.length === 0) throw new Error("No vote data found");

        const election = body[0];
        setElectionName(election.election_name || "Election Result");

        const candidateNames = JSON.parse(election.candidates || "[]");
        const voteCount = JSON.parse(election.vote_count || "[]");
        const pinBits = JSON.parse(election.pin_bits || "[]");
        const categoryPins = JSON.parse(election.group_pins || "[]");

        candidateNamesRef.current = candidateNames;
        pinBitsRef.current = pinBits;
        categoryPinsRef.current = categoryPins;

        const activeCandidates = [];
        let voteIdx = 0;
        candidateNames.forEach((name) => {
          while (voteIdx < pinBits.length && pinBits[voteIdx] === 0) voteIdx++;
          if (voteIdx >= voteCount.length) return;
          activeCandidates.push({
            candidateName: name,
            category: categoryPins[voteIdx],
            votes: voteCount[voteIdx] || 0
          });
          voteIdx++;
        });

        setResults(activeCandidates);

        const total = activeCandidates.reduce((acc, c) => acc + c.votes, 0);
        setTotalVotes(total);

        const categoryMap = {};
        activeCandidates.forEach(c => {
          if (!categoryMap[c.category]) categoryMap[c.category] = 0;
          categoryMap[c.category] += c.votes;
        });

        const categoryList = Object.entries(categoryMap).map(([catId, votes]) => ({
          name: `Category ${catId}`,
          votes
        }));
        setCategoryResults(categoryList);

      } catch {
        setElectionName("Election Result");
        setResults([]);
        setCategoryResults([]);
        setTotalVotes(0);
      }
    }
    fetchResults();
  }, [electionId]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: theme.fontFamily, paddingTop: '5rem', paddingBottom: '2rem' }}>
      <Header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: theme.headerBg,
        color: '#FFFFFF',
        fontWeight: 700,
        fontSize: '1.5rem',
        textAlign: 'center',
        padding: '1rem 0',
        zIndex: 10
      }}>
        {electionName}
      </Header>

      <div style={{ maxWidth: '5xl', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: theme.textPrimary, marginBottom: '1rem' }}>🧑‍💼 Candidates</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {results.map((c, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: '#DBEAFE', borderRadius: '1rem', boxShadow: theme.cardShadow }}>
                <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{c.candidateName}</p>
                <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>Category: {c.category}</p>
                <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: theme.textPrimary, marginBottom: '0.5rem' }}>📈 Total Votes</h2>
          <p style={{ fontSize: '1rem', fontWeight: 600 }}>{totalVotes}</p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: theme.textPrimary, marginBottom: '1rem' }}>🏷️ Category Votes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {categoryResults.map((c, idx) => (
              <div key={idx} style={{ padding: '1rem', backgroundColor: '#DCFCE7', borderRadius: '1rem', boxShadow: theme.cardShadow }}>
                <p style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>{c.name}</p>
                <p style={{ fontSize: '0.875rem', color: theme.textSecondary }}>Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
