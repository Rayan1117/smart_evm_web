import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";

export default function ElectionLiveStatsPage() {
  const { electionId } = useParams();

  const [candidates, setCandidates] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupPins, setGroupPins] = useState([]);

  const groupPinsRef = useRef([]);

  useEffect(() => {
    const socket = io("http://localhost:5000/live-election", {
      transports: ["websocket"],
      query: { token: "Bearer " + localStorage.getItem("evm.token") }
    });

    socket.on("connect", () => {
      socket.emit("join-election-room", { electionId });
    });

    socket.on("vote-updated", (data) => {
      if (!data.updatedVotes) return;

      const newVotes = JSON.parse(data.updatedVotes);

      setCandidates(prev =>
        prev.map((c, i) => ({
          ...c,
          votes: newVotes[i] ?? 0
        }))
      );

      setGroups(prev => {
        const grouped = {};

        groupPinsRef.current.forEach((grp, i) => {
          grouped[grp] = (grouped[grp] || 0) + (newVotes[i] ?? 0);
        });

        return prev.map(g => ({
          ...g,
          votes: grouped[g.id] ?? 0
        }));
      });
    });

    const fetchVoteData = async () => {
      const res = await fetch(`http://localhost:5000/utils/get-vote-count/${electionId}`, {
        headers: {
          authorization: "Bearer " + localStorage.getItem("evm.token")
        }
      });

      const data = await res.json();
      if (!data[0]) return;

      const voteCounts = JSON.parse(data[0].vote_count || "[]");
      const candidateNames = JSON.parse(data[0].candidates || "[]");
      const groupsData = JSON.parse(data[0].group_pins || "[]");

      groupPinsRef.current = groupsData;
      setGroupPins(groupsData);

      setCandidates(
        candidateNames.map((name, i) => ({
          name,
          votes: voteCounts[i] || 0
        }))
      );

      const grouped = {};
      groupsData.forEach((grp, i) => {
        grouped[grp] = (grouped[grp] || 0) + (voteCounts[i] || 0);
      });

      setGroups(
        Object.entries(grouped).map(([id, votes]) => ({
          id,
          name: `Group ${id}`,
          votes
        }))
      );
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

        <div>
          <h2 className="text-xl font-semibold mb-4">🧑‍💼 Candidates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {candidates.map((c, i) => (
              <div key={i} className="p-4 bg-blue-100 rounded-xl">
                <p>{c.name}</p>
                <p>Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">🟢 Groups</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((g, i) => (
              <div key={i} className="p-4 bg-green-100 rounded-xl">
                <p>{g.name}</p>
                <p>Group Votes: {g.votes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
