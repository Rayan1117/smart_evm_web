import { Button, List } from 'antd'
import React, { useEffect, useState } from 'react'
import ElectionCard from './components/ElectionCard'
import { Header } from 'antd/es/layout/layout'
import ElectionDetailsModal from './components/ElectionDetailsModal'
import { Link } from 'react-router-dom'

function ElectionsPage() {

    console.log("rerender");

    const [elections, setElections] = useState({
        isCurrent: false,
        elections: []
    })


    const [modalData, setModalData] = useState(
        {
            data: null,
            isOpen: false,
        }
    )


    const [error, setError] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem("evm.token")
        fetch("http://localhost:5000/utils/get-all-elections", {
            headers: {
                "Authorization": "Bearer " + token
            }
        }).then(async res => {
            const elections = await res.json()
            if (res.status === 200) {

                console.log(elections);
                
                const isCurr = elections.find((value) => value.isCurrent)

                console.log(isCurr);
                

                setElections({
                    elections,
                    isCurrent: isCurr
                })
            }

        }).catch(err => {
            setError(err)
        })
    }, [])

    return (
        error ? <div className='text-red-500'>{error.message}</div> :
            <div>
                <Header className='bg-blue-800 font-bold text-lg pt-5 text-yellow-500'>Elections</Header>
                {elections.isCurrent &&
                    <div className='bg-yellow-500 rounded-md w-1/2 relative left-1/4 overflow-hidden'>
                        <h1 className='animate-marquee text-center select-none'>currently, an election ongoing. click here to view</h1>
                    </div>
                }
                <div className='ml-10'>
                    {modalData.isOpen && <ElectionDetailsModal trigger={setModalData} data={modalData} width={1000} okText={"view vote stats"} />}
                    <List>
                        {elections.elections.map((election, i) => (
                            <ElectionCard
                                key={i}
                                election_id={election.election_id}
                                trigger={setModalData}
                                name={election.election_name}
                                candidates={election.candidates}
                                pin_bits={election.pin_bits}
                                group_pins={election.group_pins}
                                is_current={election.isCurrent}
                                is_end={election.isEnd}
                            />

                        ))
                        }
                    </List></div>
                <Link to={"/create-election"}> <Button className='fixed bottom-10 right-10 rounded-full h-14 w-14 bg-blue-800 active:scale-90 text-yellow-50 font-bold hover:!text-yellow-50 hover:scale-105 hover:!bg-blue-800'>+</Button></Link>
            </div>
    )
}

export default ElectionsPage