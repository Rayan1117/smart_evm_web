import { Header } from 'antd/es/layout/layout'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { io } from "socket.io-client";

function ElectionResultPage() {
    const { electionId } = useParams()
    const [electionName, setElectionName] = useState("")
    const [electionResult, setElectionResult] = useState([])

    useEffect(() => {
        async function getElectionResults() {
            const response = await fetch(`http://localhost:5000/utils/get-vote-count/${electionId}`, {
                headers: {
                    "Authorization": "Bearer " + localStorage.getItem("evm.token")
                }
            })

            if (response.ok) {
                const body = await response.json()
                console.log(body[0]);
                
                setElectionName(body[0].election_name || "")
                setElectionResult(JSON.parse(body[0].vote_count) || [])
            } else {
                const errorBody = await response.json()
                setElectionName("")
                setElectionResult([])
                console.error(errorBody)
            }
        }

        getElectionResults()

        const socket = io("http://localhost:5000/live-election", {
            auth: {
                token: "Bearer " + localStorage.getItem("evm.token")
            }
        });

        socket.on("connect", () => {
            console.log("Connected to live results");
        });

        socket.on("voteUpdate", (updatedResults) => {
            setElectionName(updatedResults.electionName || "")
            setElectionResult(updatedResults.results || [])
        });

        return () => {
            socket.disconnect()
        }
    }, [electionId])

    return (
        <div>
            <Header>{electionName || "Election Result"}</Header>
            <div style={{ padding: "1rem" }}>
                {electionResult.length === 0 ? (
                    <p>No results yet</p>
                ) : (
                    <table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
                        <thead>
                            <tr>
                                <th>Candidate</th>
                                <th>Group</th>
                                <th>Votes</th>
                            </tr>
                        </thead>
                        <tbody>
                            {electionResult.map((candidate, index) => (
                                <tr key={index}>
                                    <td>{candidate.candidateName}</td>
                                    <td>{candidate.group}</td>
                                    <td>{candidate.votes}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default ElectionResultPage
