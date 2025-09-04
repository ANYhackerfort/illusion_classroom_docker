import React from "react";
import "./RoomStatus.css";

type RoomStatusBoxProps = {
  name: string;
  id: string;
};

const RoomStatusBox: React.FC<RoomStatusBoxProps> = ({ name, id }) => {
  return (
    <div className="room-status-box">
      <div className="room-name">You are currently controlling room {name}</div>
      <div className="room-id">ID: {id}</div>
    </div>
  );
};

export default RoomStatusBox;
