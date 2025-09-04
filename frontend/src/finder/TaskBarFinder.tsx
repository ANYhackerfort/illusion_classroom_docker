import React from "react";
import FinderTaskBarButton from "../components/buttons/FinderButton";
import "./TaskBarFinder.css";

const VideoIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="#007aff"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17 10.5V7C17 5.9 16.1 5 15 5H5C3.9 5 3 5.9 3 7V17C3 18.1 3.9 19 5 19H15C16.1 19 17 18.1 17 17V13.5L21 17V7L17 10.5Z" />
  </svg>
);

const EditIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="#007aff"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.41L18.37 3.29a1.003 1.003 0 0 0-1.41 0L15.13 5.12l3.75 3.75 1.83-1.83z" />
  </svg>
);

const QuestionIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="#007aff"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11 18H13V20H11V18ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 19C8.13 19 5 15.87 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19ZM12 7C10.34 7 9 8.34 9 10H11C11 9.45 11.45 9 12 9C12.55 9 13 9.45 13 10C13 11 11 10.75 11 13H13C13 11.75 15 11.5 15 10C15 8.34 13.66 7 12 7Z" />
  </svg>
);

type LeftTaskBarProps = {
  onSelect: (index: number) => void;
};

const LeftTaskBarFinder: React.FC<LeftTaskBarProps> = ({ onSelect }) => {
  return (
    <div className="finder-taskbar-container">
      <div className="finder-taskbar-section-label"></div>
      <div className="finder-taskbar-section-label">User</div>

      <div className="finder-taskbar-buttons-group">
        <FinderTaskBarButton
          icon={VideoIcon}
          label="Videos"
          onClick={() => onSelect(1)}
        />
        <FinderTaskBarButton
          icon={EditIcon}
          label="Edited Videos"
          onClick={() => onSelect(2)}
        />
        <FinderTaskBarButton
          icon={QuestionIcon}
          label="Questions"
          onClick={() => onSelect(3)}
        />
      </div>
    </div>
  );
};

export default LeftTaskBarFinder;
