import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";

export default function ElectionLiveStatsPage() {
  const { electionId } = useParams();

  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [categoryVotes, setCategoryVotes] = useState([]);

  const candidateNamesRef = useRef([]);
  const pinBitsRef = useRef([]);
  const groupPinsRef = useRef([]);
  const groupNamesRef = useRef({});

  const theme = {
    bg: '#F9FAFB',
    cardBg: '#FFFFFF',
    candidateBg: 'linear-gradient(135deg, #DBEAFE, #EFF6FF)',
    categoryBg: 'linear-gradient(135deg, #DCFCE7, #ECFDF5)',
    textPrimary: '#111827',
    textSecondary: '#4B5563',
    fontFamily: "'Inter', sans-serif",
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
  };

  useEffect(() => {
    const socket = io("https://voting-api-wnlq.onrender.com/live-election", {
      transports: ["websocket"],
      query: { token: "Bearer " + localStorage.getItem("evm.token") }
    });

    socket.on("connect", () => {
      socket.emit("join-election-room", { electionId });
    });

    const updateVotes = (voteCounts) => {
      const activeCandidates = [];
      let voteIdx = 0;
      candidateNamesRef.current.forEach(name => {
        while (voteIdx < pinBitsRef.current.length && pinBitsRef.current[voteIdx] === 0) voteIdx++;
        if (voteIdx >= voteCounts.length) return;
        activeCandidates.push({ name, votes: voteCounts[voteIdx] || 0 });
        voteIdx++;
      });
      setCandidates(activeCandidates);
      setTotalVotes(activeCandidates.reduce((sum, c) => sum + c.votes, 0));

      const groupVotesMap = {};
      pinBitsRef.current.forEach((pin, i) => {
        if (!pin) return;
        const grp = groupPinsRef.current[i];
        if (grp == null) return;
        groupVotesMap[grp] = (groupVotesMap[grp] || 0) + (voteCounts[i] || 0);
      });

      setCategoryVotes(
        Object.entries(groupVotesMap).map(([grp, votes]) => ({
          name: groupNamesRef.current[String(grp)] || `Category ${grp}`,
          votes
        }))
      );
    };

    socket.on("vote-updated", (data) => {
      if (!data.updatedVotes) return;
      updateVotes(JSON.parse(data.updatedVotes));
    });

    const fetchVoteData = async () => {
      const res = await fetch(`https://voting-api-wnlq.onrender.com/utils/get-vote-count/${electionId}`, {
        headers: { authorization: "Bearer " + localStorage.getItem("evm.token") }
      });
      const data = await res.json();
      if (!data[0]) return;
      const row = data[0];
      candidateNamesRef.current = JSON.parse(row.candidates || "[]");
      pinBitsRef.current = JSON.parse(row.pin_bits || "[]");
      groupPinsRef.current = JSON.parse(row.group_pins || "[]");
      groupNamesRef.current = JSON.parse(row.group_names || "{}");
      updateVotes(JSON.parse(row.vote_count || "[]"));
    };

    fetchVoteData();
    return () => socket.disconnect();
  }, [electionId]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: theme.fontFamily, padding: '2rem' }}>
      <div style={{ maxWidth: '5xl', margin: '0 auto', background: theme.cardBg, borderRadius: '1.5rem', boxShadow: theme.boxShadow, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 700, textAlign: 'center', color: theme.textPrimary }}>📊 Election Live Stats</h1>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: theme.textPrimary }}>🧑‍💼 Candidates</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {candidates.map((c, i) => (
              <div key={i} style={{ background: theme.candidateBg, borderRadius: '1rem', padding: '1rem', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                <p style={{ fontWeight: 600, color: theme.textPrimary }}>{c.name}</p>
                <p style={{ color: theme.textSecondary }}>Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: theme.textPrimary }}>📈 Total Votes</h2>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: theme.textPrimary }}>{totalVotes}</p>
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: theme.textPrimary }}>🏷️ Category Votes</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            {categoryVotes.map((c, i) => (
              <div key={i} style={{ background: theme.categoryBg, borderRadius: '1rem', padding: '1rem', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
                <p style={{ fontWeight: 600, color: theme.textPrimary }}>{c.name}</p>
                <p style={{ color: theme.textSecondary }}>Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
