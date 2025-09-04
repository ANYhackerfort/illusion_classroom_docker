import React, { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
} from "@mui/material";
import type { Bot } from "../interfaces/bot";
import BotEditDialog from "./BotEditDialog";
import { editBotById } from "../interfaces/bot_storage";
import { distributions } from "./BotEditDialog";

interface BotCardProps extends Bot {}

export const matteColors = [
  // TODO: beginner to expert colors
  "#F0F4F8", // soft blue-grey
  "#FEF7F0", // warm cream
  "#F9FAFB", // neutral off-white
];

const BotCard: React.FC<BotCardProps> = ({
  id,
  videoThumbnail,
  memory: initialMemory,
  answer_select: initialAnswerSelect,
  randomize: initialRandomize,
  name,
}) => {
  const [editOpen, setEditOpen] = useState(false);

  // Local states for live updates without re-fetching DB
  const [memory, setMemory] = useState(initialMemory);
  const [nameCard, setName] = useState(name);
  const [answerSelect, setAnswerSelect] = useState(initialAnswerSelect);
  const [randomize, setRandomize] = useState(initialRandomize);

  // Pick a random matte color once per mount
  const cardColor = useMemo(
    () => matteColors[Math.floor(Math.random() * matteColors.length)],
    [],
  );

  const mapAndLogPayload = (botId: string, data: any) => {
    const payload = {
      memory: data.memory,
      answer_select: data.answers,
      randomize: data.randomize,
      name: data.name,
    };

    // Update DB
    editBotById(botId, payload);

    // Update local states so UI refreshes instantly
    setMemory(payload.memory);
    setAnswerSelect(payload.answer_select);
    console.log("Payload to save:", payload);
    setRandomize(payload.randomize);
    setName(payload.name);
  };

  return (
    <>
      <Card
        sx={{
          maxWidth: 300,
          backgroundColor: cardColor,
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        {/* Video thumbnail */}
        <CardMedia
          component="img"
          height="180"
          image={videoThumbnail}
          alt="Bot Thumbnail"
        />

        <CardContent>
          {/* Bot Name */}
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              padding: "8px 12px",
              fontWeight: "bold",
              wordBreak: "break-word",
            }}
          >
            {nameCard}
          </Typography>

          {/* Memory */}
          <Typography variant="subtitle1" gutterBottom>
            <strong>Memory:</strong> {memory}
          </Typography>

          {/* Answer Select */}
          <Typography variant="subtitle1" gutterBottom>
            <strong>Answer:</strong> {answerSelect.join(", ")}
          </Typography>

          {/* Randomize */}
          <Typography variant="subtitle1" gutterBottom>
            <strong>Randomize:</strong>{" "}
            {randomize === -1
              ? "Not Random"
              : (distributions.find((d) => d.value === randomize)?.label ??
                "Unknown")}
          </Typography>
          {/* Edit Button */}
          <Button
            fullWidth
            onClick={() => setEditOpen(true)}
            sx={{
              mt: 2,
              backgroundColor: "#333", // dark gray
              color: "#fff",
              fontWeight: "bold",
              textTransform: "none",
              borderRadius: "8px",
              "&:hover": {
                backgroundColor: "#444", // slightly lighter on hover
              },
            }}
          >
            Edit
          </Button>
        </CardContent>
      </Card>

      {/* Editor dialog */}
      <BotEditDialog
        initialName={name}
        open={editOpen}
        botId={id}
        initialMemory={memory}
        initialAnswers={answerSelect}
        initialRandomize={randomize}
        onClose={() => setEditOpen(false)}
        onSave={(botId, data) => {
          mapAndLogPayload(botId, data);
        }}
      />
    </>
  );
};

export default BotCard;
