import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
} from "@mui/material";

import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export const distributions = [
  { label: "Not Random", value: -1 },
  { label: "Uniform", value: 0 },
  { label: "Normal", value: 1 },
  { label: "Exponential", value: 2 },
  { label: "Binomial", value: 3 },
  { label: "Poisson", value: 4 },
  { label: "Geometric", value: 5 },
];

type BotEditDialogProps = {
  open: boolean;
  botId: string;
  initialMemory: string;
  initialAnswers: string[];
  initialRandomize: number;
  initialName: string;
  onClose: () => void;
  onSave?: (
    botId: string,
    data: {
      name: string;
      memory: string;
      answers: string[];
      randomize: number;
    },
  ) => void;
};

const BotEditDialog: React.FC<BotEditDialogProps> = ({
  open,
  botId,
  initialMemory,
  initialAnswers,
  initialRandomize,
  onClose,
  onSave,
  initialName,
}) => {
  const [name, setName] = useState<string>(initialName);
  const [memory, setMemory] = useState<string>(initialMemory);
  const [answers, setAnswers] = useState<string>(initialAnswers.join(", "));
  const [answersArray, setAnswersArray] = useState<string[]>(initialAnswers);
  const [randomize, setRandomize] = useState<number>(initialRandomize);
  const [position] = useState<number>(1);

  // Update answers array when text changes
  const handleAnswersChange = (value: string) => {
    setAnswers(value);
    const parsedArray = value
      .split(",")
      .map((answer) => answer.trim())
      .filter((answer) => answer.length > 0);
    setAnswersArray(parsedArray);
  };

  const handleSave = () => {
    onSave?.(botId, {
      memory,
      answers: answersArray,
      randomize,
      name,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Bot</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Bot Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            helperText={`Previous: ${initialName}`}
          />
        </Box>

        {/* Memory */}
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Memory"
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            helperText={`Previous: ${initialMemory}`}
          />
        </Box>

        {/* Answers */}
        <Box sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Answers (comma separated)"
            value={answers}
            onChange={(e) => handleAnswersChange(e.target.value)}
            helperText="Separate each answer with a comma"
          />
        </Box>

        {/* Render highlighted answers */}
        <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
          {answersArray.map((ans, idx) => (
            <Typography
              key={idx}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: "6px",
                bgcolor: idx === position ? "error.main" : "grey.300",
                color: idx === position ? "white" : "black",
                fontWeight: idx === position ? "bold" : "normal",
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "150px",
              }}
              title={ans}
            >
              {ans.length > 15 ? `${ans.substring(0, 15)}...` : ans}
            </Typography>
          ))}
        </Box>

        {/* Randomize */}
        <Box sx={{ mt: 3 }}>
          <FormControl fullWidth>
            <InputLabel id="distribution-label">Distribution</InputLabel>
            <Select
              labelId="distribution-label"
              value={randomize}
              onChange={(e) => setRandomize(Number(e.target.value))}
              label="Distribution"
            >
              {distributions.map((dist) => (
                <MenuItem key={dist.value} value={dist.value}>
                  {dist.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="text">
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BotEditDialog;
