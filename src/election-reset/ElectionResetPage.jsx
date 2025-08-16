import { Button } from 'antd'
import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { io } from "socket.io-client"

function ElectionResetPage() {

    const [query, queryFunction] = useSearchParams()

    const [button, setButton] = useState(true)

    const electionId = query.get("electionId")

    console.log(query.get("electionId"));

    let isCurr

    const socketRef = useRef()

    useEffect(() => {

        let socket = io("http://localhost:5000/admin-socket-route", {
            auth:{token: "Bearer " + localStorage.getItem("evm.token")}
        })

        socket.on("connect", () => {
            console.log("connected");
        })

        socketRef.current = socket

        fetch(`http://localhost:5000/utils/get-all-elections/?election_id=${electionId}`, {
            headers: {
                authorization: "Bearer " + localStorage.getItem("evm.token")
            }
        }).then(async res => {
            const data = await res.json()
            console.log(data.election_config);

            if (res.status === 200) {
                console.log(data.election_config.isCurrent);
                isCurr = data.election_config.isCurrent
                if (!isCurr) {
                    fetch("http://localhost:5000/election/start-election", {
                        method: "POST",
                        headers: {
                            authorization: "Bearer " + localStorage.getItem("evm.token"),
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            electionId,
                            espId: "NVEM1234"
                        })
                    }).then(async res => {
                        if (res.status === 200) {
                            console.log("election started successfully");
                        }
                        else {
                            console.log(await res.json());
                        }
                    })
                }
            } else {
                console.log(data);
            }
            socket.emit('start-election', { espId: "NVEM1234" })

            socket.on("check-presence", (_) => {
                console.log("check presence");
                socket.emit("present", { room: "NVEM1234", role: "web" })
            })

            socket.on("vote-selected", (_) => {
                console.log("vote selected");
                setButton(false)
            })
        })
    }, [])

    return (
        <div className={"flex flex-col justify-center"}>
            <Button onClick={
                () => {
                    socketRef.current.emit("cast-vote", {
                        espId: "NVEM1234",
                        electionId
                    })
                    setButton(true)
                }

            } disabled={button}>reset</Button>
        </div>
    )
}

export default ElectionResetPage