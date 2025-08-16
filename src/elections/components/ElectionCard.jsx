import React from 'react'

function ElectionCard(props) {
  let fixedCandidate = [];
  let fixedGroups = []

  try {
    if (props.candidates) {
      fixedCandidate = JSON.parse(props.candidates.replace(/'/g, '"'));
    }
    if (props.group_shapes) {
      fixedGroups = JSON.parse(props.group_shapes.replace(/'/g, '"'));
    }
  } catch (err) {
    console.error("JSON parse error in ElectionCard:", err);
  }

  const clickHandler = () => {
    props.trigger({
      data: {
        electionId: props.election_id,
        electionName: props.name,
        candidateNames: fixedCandidate,
        pinFlags: props.pin_bits,
        groupPins: props.group_pins,
        isCurr: props.is_current,
        isEnd: props.is_end
      },
      isOpen: true,
    });
  };

  return (
    <div
      onClick={clickHandler}
      className="bg-yellow-500 p-10 m-5 rounded-3xl active:scale-[99%] transition-transform duration-100 cursor-pointer"
    >
      <p className="text-md font-bold">{props.name}</p>
    </div>
  );
}



export default ElectionCard