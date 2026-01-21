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
  const groupNamesRef = useRef({}); // ✅ NEW

  useEffect(() => {
    const socket = io("http://localhost:5000/live-election", {
      transports: ["websocket"],
      query: { token: "Bearer " + localStorage.getItem("evm.token") }
    });

    socket.on("connect", () => {
      socket.emit("join-election-room", { electionId });
    });

    const updateVotes = (voteCounts) => {
      /* ---------- Candidate votes ---------- */
      const activeCandidates = [];
      let voteIdx = 0;

      candidateNamesRef.current.forEach(name => {
        while (
          voteIdx < pinBitsRef.current.length &&
          pinBitsRef.current[voteIdx] === 0
        ) voteIdx++;

        if (voteIdx >= voteCounts.length) return;

        activeCandidates.push({
          name,
          votes: voteCounts[voteIdx] || 0
        });

        voteIdx++;
      });

      setCandidates(activeCandidates);

      /* ---------- Total votes ---------- */
      setTotalVotes(
        activeCandidates.reduce((sum, c) => sum + c.votes, 0)
      );

      /* ---------- Category votes ---------- */
      const groupVotesMap = {};

      pinBitsRef.current.forEach((pin, i) => {
        if (pin === 0) return;

        const grp = groupPinsRef.current[i];
        if (grp == null) return;

        groupVotesMap[grp] =
          (groupVotesMap[grp] || 0) + (voteCounts[i] || 0);
      });

      const catVotesArray = Object.entries(groupVotesMap).map(
        ([grp, votes]) => ({
          name: groupNamesRef.current[String(grp)] || `Category ${grp}`, // ✅ FIX
          votes
        })
      );

      setCategoryVotes(catVotesArray);
    };

    socket.on("vote-updated", (data) => {
      if (!data.updatedVotes) return;
      updateVotes(JSON.parse(data.updatedVotes));
    });

    const fetchVoteData = async () => {
      const res = await fetch(
        `http://localhost:5000/utils/get-vote-count/${electionId}`,
        {
          headers: {
            authorization: "Bearer " + localStorage.getItem("evm.token")
          }
        }
      );

      const data = await res.json();
      if (!data[0]) return;

      const row = data[0];

      candidateNamesRef.current = JSON.parse(row.candidates || "[]");
      pinBitsRef.current = JSON.parse(row.pin_bits || "[]");
      groupPinsRef.current = JSON.parse(row.group_pins || "[]");
      groupNamesRef.current = JSON.parse(row.group_names || "{}"); // ✅ FIX

      updateVotes(JSON.parse(row.vote_count || "[]"));
    };

    fetchVoteData();
    return () => socket.disconnect();
  }, [electionId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-10">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          📊 Election Live Stats
        </h1>

        {/* Candidates */}
        <div>
          <h2 className="text-xl font-semibold mb-4">🧑‍💼 Candidates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {candidates.map((c, i) => (
              <div key={i} className="p-4 bg-blue-100 rounded-xl">
                <p className="font-semibold">{c.name}</p>
                <p>Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total Votes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">📈 Total Votes</h2>
          <p className="text-lg font-bold">{totalVotes}</p>
        </div>

        {/* Category Votes */}
        <div>
          <h2 className="text-xl font-semibold mb-4">🏷️ Category Votes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryVotes.map((c, i) => (
              <div key={i} className="p-4 bg-green-100 rounded-xl">
                <p className="font-semibold">{c.name}</p>
                <p>Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
