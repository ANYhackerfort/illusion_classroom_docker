import React from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import "./JoinMeeting.css";
import JoinMeetingCard from "../cards/JoinMeetingCard";

const JoinMeeting: React.FC = () => {
  const navigate = useNavigate();

  const handleJoin = () => {
    navigate("/meeting-settings"); // TODO: TEMP
  };

  return (
    <Box className="join-meeting-root">
      <Typography className="lab-title" variant="body2">
        © Richard Meyer Lab
      </Typography>

      <Box className="join-meeting-content">
        <JoinMeetingCard
          meetingRoomName="Classroom simulation #1"
          description="In this classroom you will be learning about countries and their cultures."
          onClick={handleJoin}
        />
      </Box>
    </Box>
  );
};

export default JoinMeeting;
