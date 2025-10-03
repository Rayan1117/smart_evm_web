import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import io from "socket.io-client";

export default function ElectionLiveStatsPage() {
    const { electionId } = useParams();
    const [candidates, setCandidates] = useState([]);
    const [groups, setGroups] = useState([]);
    const [groupPins, setGroupPins] = useState([]); // track group mapping

    useEffect(() => {
        const socket = io("http://localhost:5000/live-election", {
            transports: ["websocket"],
            query: { token: "Bearer " + localStorage.getItem("evm.token") }
        });

        socket.on("connect", () => {
            console.log("✅ Connected to live-election:", socket.id);
            socket.emit("join-election-room", { electionId });
        });

        socket.on("connect_error", (err) => {
            console.error("❌ Connection failed:", err.message);
        });

        socket.on("vote-updated", (data) => {
            console.log("Live vote update received:", data);

            if (!data.updatedVotes) return;
            setCandidates(prev =>
                prev.map((c, idx) => {
                    let incremented = false;

                    // iterate over all values in updatedVotes
                    Object.values(data.updatedVotes).forEach(voteIndex => {
                        if (idx === voteIndex) {
                            c.votes += 1;  // increment by 1
                            incremented = true;
                        }
                    });

                    return { ...c };
                })
            );

            // Update group votes
            setGroups(prev =>
                prev.map(g => {
                    let deltaSum = 0;

                    // Iterate over all updated votes (values = candidate indices)
                    Object.values(data.updatedVotes).forEach(candidateIdx => {
                        if (groupPins[candidateIdx] === g.id) {
                            deltaSum += 1; // increment group vote for each vote
                        }
                    });

                    return deltaSum > 0 ? { ...g, votes: g.votes + deltaSum } : g;
                })
            );


        });



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
                console.log(candidateList);

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

        return () => socket.disconnect();
    }, [electionId]);   // ✅ only depend on electionId


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
