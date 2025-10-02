import { Button } from 'antd'
import { Header } from 'antd/es/layout/layout'
import { HttpStatusCode } from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import io from "socket.io-client"

function ElectionResetPage() {
    const [query] = useSearchParams()
    const { flag } = useParams()
    const [buttonDisabled, setButtonDisabled] = useState(true)
    const [showConfirm, setShowConfirm] = useState(false)
    const electionId = query.get("electionId")
    const socketRef = useRef()
    const navigate = useNavigate()

    useEffect(() => {
        const socket = io("http://localhost:5000/", {
            query: { token: "Bearer " + localStorage.getItem("evm.token") }
        })
        socketRef.current = socket

        socket.on("connect", async () => {
            console.log("Admin socket connected:", socket.id)

            socket.emit("post-connection", { espId: "NVEM1234", role: "web" })

            try {
                const res = await fetch(
                    `http://localhost:5000/utils/get-all-elections/?election_id=${electionId}`,
                    { headers: { authorization: "Bearer " + localStorage.getItem("evm.token") } }
                )
                const data = await res.json()
                const isCurr = data?.election_config?.isCurrent

                if (!isCurr && flag === "0") {
                    console.log("Starting election…")
                    await fetch("http://localhost:5000/election/start-election", {
                        method: "POST",
                        headers: {
                            authorization: "Bearer " + localStorage.getItem("evm.token"),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ electionId, espId: "NVEM1234" })
                    })
                    navigate(`/election-reset/1/?electionId=${electionId}`, { replace: true })
                } 
                else if (isCurr && flag === "1") {
                    console.log("Resuming election…")
                    const res2 = await fetch("http://localhost:5000/election/resume-election", {
                        method: "POST",
                        headers: {
                            authorization: "Bearer " + localStorage.getItem("evm.token"),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ electionId, espId: "NVEM1234" })
                    })
                    if (res2.status === HttpStatusCode.Ok) console.log("Resume success")
                    else console.log(await res2.json())
                }
                else if (isCurr && flag === "0") {
                    navigate(`/election-reset/1/?electionId=${electionId}`, { replace: true })
                }
            } catch (err) {
                console.error("Error fetching election:", err)
            }
        })

        socket.on("vote-selected", () => setButtonDisabled(false))
        socket.on("reset-selected", () => setButtonDisabled(true))
        socket.on("vote-updated", () => setButtonDisabled(true))
        socket.on("check-presence", (espId) => {
            socket.emit("present", { room: espId, role: "web" })
            console.log("present")
        })

        return () => socket.disconnect()
    }, [electionId, flag, navigate])

    const handleResetVote = () => {
        socketRef.current.emit("cast-vote", { espId: "NVEM1234", electionId })
        setButtonDisabled(true)
        alert("Vote reset sent!")
    }

    const handleEndElection = async () => {
        try {
            const res = await fetch(`http://localhost:5000/election/end-election`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    "authorization": "Bearer " + localStorage.getItem("evm.token")
                },
                body: JSON.stringify({ electionId })
            })
            if (res.ok) {
                alert("Election ended successfully!")
                navigate("/")
            } else {
                const err = await res.json()
                alert("Failed to end election: " + JSON.stringify(err))
            }
        } catch (err) {
            alert("Error ending election: " + err.message)
        }
        setShowConfirm(false)
    }

    return (
        <div className="flex flex-col justify-center h-screen relative bg-gray-100">
            <Header className='!absolute !top-0 !bg-blue-500 !font-bold !text-lg self-center w-full text-center !leading-[60px]'>
                Reset Page
            </Header>
            
            <Button
                className='!bg-blue-500 !text-black !w-64 !rounded-full !h-14 disabled:!bg-blue-300 self-center'
                onClick={handleResetVote}
                disabled={buttonDisabled}>
                Reset
            </Button>

            <Button
                className='!bg-red-500 !text-white !w-36 !rounded-full !h-10 fixed bottom-5 right-5'
                onClick={() => setShowConfirm(true)}>
                End Election
            </Button>

            {/* Custom Confirmation Popup */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl shadow-lg p-6 w-80">
                        <h2 className="text-lg font-bold mb-4">Confirm End Election</h2>
                        <p className="mb-6 text-gray-700">Are you sure you want to end this election?</p>
                        <div className="flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 rounded-full bg-gray-300 hover:bg-gray-400"
                                onClick={() => setShowConfirm(false)}>
                                No
                            </button>
                            <button
                                className="px-4 py-2 rounded-full bg-red-500 text-white hover:bg-red-600"
                                onClick={handleEndElection}>
                                Yes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ElectionResetPage
