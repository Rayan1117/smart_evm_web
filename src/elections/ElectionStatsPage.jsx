import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function ElectionStatsPage() {
    const { electionId } = useParams()
    const [candidates, setCandidates] = useState([]);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const fetchVoteData = async () => {
            try {
                const res = await fetch(`http://localhost:5000/utils/get-vote-count/${electionId}`, {
                    headers: {
                        "authorization": "Bearer " + localStorage.getItem("evm.token"),
                    }
                });

                const data = await res.json();

                const voteCounts = JSON.parse(data.vote_count);        // [2,0,0,0,0,0,0,0]
                const groupedCount = data.grouped_count;               // {1: 2, 2: 0}

                // hardcoded or fetched from somewhere
                const candidateNames = ["rayan", "shiranjan"];

                // Candidate vote list
                const candidateList = candidateNames.map((name, index) => ({
                    name,
                    votes: voteCounts[index] || 0
                }));
                setCandidates(candidateList);

                // Group vote list
                const groupList = Object.entries(groupedCount).map(([groupId, votes]) => ({
                    name: `Group ${groupId}`,
                    votes
                }));
                setGroups(groupList);

            } catch (err) {
                console.error("Failed to fetch vote data:", err);
            }
        };

        fetchVoteData();
    }, [electionId]);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-10">
                <h1 className="text-3xl font-bold text-center text-gray-800">📊 Election Stats</h1>

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
