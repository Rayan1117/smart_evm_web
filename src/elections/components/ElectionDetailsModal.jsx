import { Button, List, Modal } from 'antd'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserContext } from '../../App'

function ElectionDetailsModal(props) {

  const userProvider = useContext(UserContext)

  const navigator = useNavigate()

  const shapeOptions = [
    { id: 1, name: 'Circle', icon: '⚪' },
    { id: 2, name: 'Square', icon: '⬛' },
    { id: 3, name: 'Triangle', icon: '🔺' },
    { id: 4, name: 'Star', icon: '⭐' },
    { id: 5, name: 'Heart', icon: '❤️' },
    { id: 6, name: 'Diamond', icon: '💎' },
    { id: 7, name: 'Clover', icon: '🍀' },
    { id: 8, name: 'Moon', icon: '🌙' },
  ]

  const { electionId, electionName, candidateNames, isCurr, isEnd } = props.data.data

  console.log(props.data.data);


  const pinBits = JSON.parse(props.data.data.pinFlags || '[]')
  const groupPins = JSON.parse(props.data.data.groupPins || '[]')

  const mappedCandidates = []
  let candidateIdx = 0

  for (let i = 0; i < pinBits.length; i++) {
    if (pinBits[i] === 1) {
      const name = candidateNames[candidateIdx]
      const shapeId = groupPins[i] // note: indexed by pin position
      const shape = shapeOptions.find(s => s.id === shapeId)
      mappedCandidates.push({
        name,
        shape: shape?.icon ?? '❓',
      })
      candidateIdx++
    }
  }

  console.log(isCurr);

  console.log(userProvider);
  

  return (
    <Modal
      open={props.data.isOpen}
      width={1000}
      onCancel={() => props.trigger({ data: null, isOpen: false })}
      footer={isEnd ? [
        <Button onClick={() => navigator(`/election-stat/${electionId}`)}>view stats</Button>
      ] : isCurr ? [userProvider.role === "admin" && <Button onClick={() => navigator(`/election-reset/?electionId=${electionId}`)}>Participate</Button>, <Button>view live voting</Button>] : [userProvider.role === "admin" && isCurr?<Button>continue election</Button>:<Button onClick={() => navigator(`/election-reset/?electionId=${electionId}`)}>start election</Button>]}
    >
      <div className="flex flex-col gap-5">
        <h1 className="text-xl font-bold text-blue-800">
          Election: {electionName}
        </h1>

        <div className="flex justify-center">
          <ol>
            <h2 className="border-b-2 mb-3 text-lg">Candidates & Groups</h2>
            <List
              dataSource={mappedCandidates}
              renderItem={(item, idx) => (
                <li key={idx} className="text-base">
                  {item.name}
                  <span className="ml-2 text-gray-600">{item.shape}</span>
                </li>
              )}
            />
          </ol>
        </div>
      </div>
    </Modal>
  )
}

export default ElectionDetailsModal
