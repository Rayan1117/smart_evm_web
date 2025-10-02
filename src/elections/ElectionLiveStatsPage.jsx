import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";

export default function ElectionLiveStatsPage() {
    const { electionId } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [groups, setGroups] = useState([]);
    const [groupPins, setGroupPins] = useState([]); // track group mapping

    useEffect(() => {
        // --- SOCKET SETUP ---
        const socket = io("http://localhost:5000/live-election", {
            query: { token: "Bearer " + localStorage.getItem("evm.token") }
        });

        socket.on("connect", () => {
            console.log("Connected to user namespace");
            socket.emit("join-election-room", { electionId });
        });

        // --- VOTE UPDATE HANDLER ---
        socket.on("vote-updated", (data) => {
            console.log("Live vote update received:", data);

            // Expect backend to send absolute votes:
            // { candidates: ["Alice","Bob"], votes: [5,2], group_pins: [1,1] }
            if (!data.candidates || !data.votes || !data.group_pins) return;

            const candidateList = data.candidates.map((name, idx) => ({
                name,
                votes: data.votes[idx] || 0
            }));
            setCandidates(candidateList);

            // Save group mapping
            setGroupPins(data.group_pins);

            // Compute group votes
            const groupedCount = {};
            data.group_pins.forEach((grp, idx) => {
                groupedCount[grp] = (groupedCount[grp] || 0) + (data.votes[idx] || 0);
            });
            const groupList = Object.entries(groupedCount).map(([groupId, votes]) => ({
                id: groupId,
                name: `Group ${groupId}`,
                votes
            }));
            setGroups(groupList);
        });

        // --- INITIAL FETCH ---
        const fetchVoteData = async () => {
            try {
                const res = await fetch(`http://localhost:5000/utils/get-vote-count/${electionId}`, {
                    headers: {
                        "authorization": "Bearer " + localStorage.getItem("evm.token")
                    }
                });
                const data = await res.json();
                if (!data[0]) return;

                const voteCounts = JSON.parse(data[0].vote_count || "[]");
                const candidateNames = JSON.parse(data[0].candidates || "[]");
                const groupsData = JSON.parse(data[0].group_pins || "[]");

                setGroupPins(groupsData);

                // Candidates
                const candidateList = candidateNames.map((name, idx) => ({
                    name,
                    votes: voteCounts[idx] || 0
                }));
                setCandidates(candidateList);

                // Groups
                const groupedCount = {};
                groupsData.forEach((grp, idx) => {
                    groupedCount[grp] = (groupedCount[grp] || 0) + (voteCounts[idx] || 0);
                });
                const groupList = Object.entries(groupedCount).map(([groupId, votes]) => ({
                    id: groupId,
                    name: `Group ${groupId}`,
                    votes
                }));
                setGroups(groupList);

            } catch (err) {
                console.error("Failed to fetch initial vote data:", err);
            }
        };

        fetchVoteData();

        // Cleanup
        return () => socket.disconnect();
    }, [electionId]);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-10">
                <h1 className="text-3xl font-bold text-center text-gray-800">📊 Election Live Stats</h1>

                {/* Candidates */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">🧑‍💼 Candidates</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {candidates.map((c, idx) => (
                            <div key={idx} className="p-4 bg-blue-100 rounded-xl shadow">
                                <p className="text-lg font-medium">{c.name}</p>
                                <p className="text-sm text-gray-700">Votes: {c.votes}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Groups */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">🟢 Groups</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {groups.map((g, idx) => (
                            <div key={idx} className="p-4 bg-green-100 rounded-xl shadow">
                                <p className="text-lg font-medium">{g.name}</p>
                                <p className="text-sm text-gray-700">Group Votes: {g.votes}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
