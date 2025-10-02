import { Header } from 'antd/es/layout/layout'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

function ElectionResultPage() {
    const { electionId } = useParams()
    const [electionName, setElectionName] = useState("")
    const [results, setResults] = useState([])
    const [groupResults, setGroupResults] = useState([])

    useEffect(() => {
        async function fetchResults() {
            try {
                const response = await fetch(`http://localhost:5000/utils/get-vote-count/${electionId}`, {
                    headers: { "Authorization": "Bearer " + localStorage.getItem("evm.token") }
                })

                if (!response.ok) throw new Error("Failed to fetch vote data")
                const body = await response.json()
                if (!body || body.length === 0) throw new Error("No vote data found")

                const election = body[0]
                setElectionName(election.election_name || "Election Result")

                const candidates = JSON.parse(election.candidates || "[]")
                const voteCount = JSON.parse(election.vote_count || "[]")
                const groupPins = JSON.parse(election.group_pins || "[]")

                // Candidate results
                const voteResults = candidates.map((candidate, idx) => ({
                    candidateName: candidate,
                    group: groupPins[idx],
                    votes: voteCount[idx] || 0
                }))
                setResults(voteResults)

                // Group aggregation
                const groupMap = {}
                voteResults.forEach(vr => {
                    if (!groupMap[vr.group]) groupMap[vr.group] = 0
                    groupMap[vr.group] += vr.votes
                })
                const groupList = Object.entries(groupMap).map(([groupId, votes]) => ({
                    id: groupId,
                    name: `Group ${groupId}`,
                    votes
                }))
                setGroupResults(groupList)

            } catch (err) {
                console.error("Failed to fetch vote data:", err.message)
                setElectionName("Election Result")
                setResults([])
                setGroupResults([])
            }
        }

        fetchResults()
    }, [electionId])

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <Header className='!bg-blue-500 !text-white !font-bold !text-xl text-center'>
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
                                <p className="text-sm text-gray-700">Group: {c.group}</p>
                                <p className="text-sm text-gray-700">Votes: {c.votes}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Groups */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">🟢 Groups</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {groupResults.map((g, idx) => (
                            <div key={idx} className="p-4 bg-green-100 rounded-xl shadow">
                                <p className="text-lg font-medium">{g.name}</p>
                                <p className="text-sm text-gray-700">Votes: {g.votes}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ElectionResultPage
