import React from "react";
import "./UserBlock.css";

type UserBlockProps = {
  name: string;
  email: string;
  imageSrc: string;
  onClick: () => void;
};

const UserBlock: React.FC<UserBlockProps> = ({
  name,
  email,
  imageSrc,
  onClick,
}) => {
  return (
    <div className="user-block" onClick={onClick}>
      <img src={imageSrc} alt="profile" className="user-avatar" />
      <div className="user-info">
        <div className="user-name">{name}</div>
        <div className="user-email">{email}</div>
      </div>
    </div>
  );
};

export default UserBlock;
