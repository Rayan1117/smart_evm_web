import { Button } from 'antd'
import { Header } from 'antd/es/layout/layout'
import { HttpStatusCode } from 'axios'
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import io from "socket.io-client"

export default function ElectionResetPage() {
    const [query] = useSearchParams()
    const { flag } = useParams()
    const [buttonDisabled, setButtonDisabled] = useState(true)
    const [showConfirm, setShowConfirm] = useState(false)
    const electionId = query.get("electionId")
    const socketRef = useRef()
    const navigate = useNavigate()

    const theme = {
        bg: '#F3F4F6',
        headerBg: 'linear-gradient(90deg, #1E3A8A, #3B82F6)',
        resetBtnBg: 'linear-gradient(135deg, #3B82F6, #60A5FA)',
        resetBtnDisabled: '#A5B4FC',
        endBtnBg: 'linear-gradient(135deg, #EF4444, #F87171)',
        cardShadow: '0 8px 24px rgba(0,0,0,0.08)',
        fontFamily: "'Inter', sans-serif",
        textPrimary: '#111827',
        textSecondary: '#4B5563'
    }

    const fetchVoteStatus = async () => {
        try {
            const res = await fetch(`http://localhost:5000/startup/vote-status?espId=NVEM1234`, {
                headers: { authorization: "Bearer " + localStorage.getItem("evm.token") }
            })
            if (!res.ok) return
            const data = await res.json()
            setButtonDisabled(!data.flag)
        } catch {
            setButtonDisabled(true)
        }
    }

    useEffect(() => {
        const socket = io("http://localhost:5000/", {
            query: { token: "Bearer " + localStorage.getItem("evm.token") }
        })
        socketRef.current = socket

        socket.on("connect", async () => {
            socket.emit("post-connection", { espId: "NVEM1234", role: "web" })
            try {
                const res = await fetch(`http://localhost:5000/utils/get-all-elections/?election_id=${electionId}`, {
                    headers: { authorization: "Bearer " + localStorage.getItem("evm.token") }
                })
                const data = await res.json()
                const isCurr = data?.election_config?.isCurrent
                if (!isCurr && flag === "0") {
                    const startRes = await fetch("http://localhost:5000/election/start-election", {
                        method: "POST",
                        headers: {
                            authorization: "Bearer " + localStorage.getItem("evm.token"),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ electionId, espId: "NVEM1234" })
                    })
                    if (startRes.status === 200) navigate(`/election-reset/1/?electionId=${electionId}`, { replace: true })
                } else if (isCurr && flag === "1") {
                    const resumeRes = await fetch("http://localhost:5000/election/resume-election", {
                        method: "POST",
                        headers: {
                            authorization: "Bearer " + localStorage.getItem("evm.token"),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({ electionId, espId: "NVEM1234" })
                    })
                    if (resumeRes.status === HttpStatusCode.Ok) await fetchVoteStatus()
                } else if (isCurr && flag === "0") {
                    navigate(`/election-reset/1/?electionId=${electionId}`, { replace: true })
                }
            } catch {}
        })

        socket.on("vote-selected", () => setButtonDisabled(false))
        socket.on("reset-selected", () => setButtonDisabled(true))
        socket.on("vote-updated", () => fetchVoteStatus())
        socket.on("check-presence", (espId) => socket.emit("present", { room: espId, role: "web" }))

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
        <div style={{ minHeight: '100vh', backgroundColor: theme.bg, fontFamily: theme.fontFamily, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', position: 'relative' }}>
            <Header style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: theme.headerBg, color: '#FFFFFF', fontWeight: 700, fontSize: '1.5rem', textAlign: 'center', padding: '1rem 0', zIndex: 10 }}>
                Election Reset Page
            </Header>

            <div style={{ marginTop: '6rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <Button
                    style={{
                        width: '16rem',
                        height: '3.5rem',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        color: '#FFFFFF',
                        background: buttonDisabled ? theme.resetBtnDisabled : theme.resetBtnBg,
                        boxShadow: theme.cardShadow
                    }}
                    onClick={handleResetVote}
                    disabled={buttonDisabled}>
                    Reset Vote
                </Button>
            </div>

            <Button
                style={{
                    position: 'fixed',
                    bottom: '2.5rem',
                    right: '2.5rem',
                    width: '12rem',
                    height: '2.5rem',
                    borderRadius: '9999px',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: theme.endBtnBg,
                    boxShadow: theme.cardShadow
                }}
                onClick={() => setShowConfirm(true)}>
                End Election
            </Button>

            {showConfirm && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 50 }}>
                    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '1rem', padding: '2rem', width: '20rem', boxShadow: theme.cardShadow }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: theme.textPrimary }}>Confirm End Election</h2>
                        <p style={{ marginBottom: '1.5rem', color: theme.textSecondary }}>Are you sure you want to end this election?</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button style={{ padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#E5E7EB', fontWeight: 500 }} onClick={() => setShowConfirm(false)}>No</button>
                            <button style={{ padding: '0.5rem 1rem', borderRadius: '9999px', backgroundColor: '#EF4444', color: '#FFFFFF', fontWeight: 600 }} onClick={handleEndElection}>Yes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
