import { Header } from 'antd/es/layout/layout';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

function ElectionResultPage() {
  const { electionId } = useParams();
  const [electionName, setElectionName] = useState("");
  const [results, setResults] = useState([]);
  const [categoryResults, setCategoryResults] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);

  const candidateNamesRef = useRef([]);
  const pinBitsRef = useRef([]);
  const categoryPinsRef = useRef([]);

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

        // Assign votes linearly only to active pins
        const activeCandidates = [];
        let voteIdx = 0;
        candidateNames.forEach((name) => {
          // Skip inactive pins
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

        // Total votes
        const total = activeCandidates.reduce((acc, c) => acc + c.votes, 0);
        setTotalVotes(total);

        // Category-wise aggregation
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

      } catch (err) {
        console.error("Failed to fetch vote data:", err.message);
        setElectionName("Election Result");
        setResults([]);
        setCategoryResults([]);
        setTotalVotes(0);
      }
    }

    fetchResults();
  }, [electionId]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <Header className="!bg-blue-500 !text-white !font-bold !text-xl text-center">
        {electionName}
      </Header>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 space-y-10 mt-6">
        {/* Candidates */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🧑‍💼 Candidates</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((c, idx) => (
              <div key={idx} className="p-4 bg-blue-100 rounded-xl shadow">
                <p className="text-lg font-medium">{c.candidateName}</p>
                <p className="text-sm text-gray-700">Category: {c.category}</p>
                <p className="text-sm text-gray-700">Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Total Votes */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">📈 Total Votes</h2>
          <p className="text-lg font-medium">{totalVotes}</p>
        </div>

        {/* Category Votes */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-700">🏷️ Category Votes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categoryResults.map((c, idx) => (
              <div key={idx} className="p-4 bg-green-100 rounded-xl shadow">
                <p className="text-lg font-medium">{c.name}</p>
                <p className="text-sm text-gray-700">Votes: {c.votes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ElectionResultPage;
