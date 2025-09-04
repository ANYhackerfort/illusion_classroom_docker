import React, { useState, useEffect } from "react";
import MediaInfoCard from "../cards/OngoingMeeting";
import type { MediaInfoCardProps } from "../cards/OngoingMeeting";
import AddMeetingCard from "../cards/AddCard";
import MeetingDialog from "../dialogs/NewMeetingDialog";
import { createMeeting, fetchUserMeetings } from "../../api/meetingApi";
import "./CurrentMeetings.css";

const CurrentMeetings: React.FC = () => {
  const [meetings, setMeetings] = useState<MediaInfoCardProps[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const result = await fetchUserMeetings(); // now returns { meetings: [...] }
        const withDefaults = result.meetings.map((m) => ({
          name: m.name ?? "untitled",
          imageUrl: m.imageUrl ?? "/default.jpg",
          description: m.description ?? "",
          questionsCount: m.questionsCount ?? 0,
          videoLengthSec: m.videoLengthSec ?? 0,
          tags: m.tags ?? [],
          createdAt: m.createdAt ?? new Date().toISOString(),
          ownerEmail: m.ownerEmail ?? "",
          sharedWith: m.sharedWith ?? [],

          // Frontend-only props
          VideoSegments: [],
          className: "",
          onClick: () => console.log(`Open meeting: ${m.description}`),
        }));
        setMeetings(withDefaults);
      } catch (err) {
        console.error("❌ Failed to load meetings:", err);
      }
    };

    loadMeetings();
  }, []);

  const handleSave = async (data: {
    description: string;
    tags: string[];
    name: string;
    sharedWith: string[];
  }) => {
    try {
      const payload = {
        name: data.name,
        imageUrl: "/default.jpg",
        description: data.description,
        questionsCount: 0,
        videoLengthSec: 0,
        tags: data.tags,
        sharedWith: data.sharedWith,
        VideoSegments: [],
      };

      const result = await createMeeting(payload);
      console.log("✅ Meeting created:", result);
    } catch (err) {
      console.error("⚠️ Error while creating meeting:", err);
    }
  };

  return (
    <main className="cm">
      <h1 className="cm__title">Current Meetings</h1>
      <section className="cm__grid">
        {meetings.map((m, idx) => (
          <MediaInfoCard key={idx} {...m} />
        ))}
        <AddMeetingCard onClick={() => setDialogOpen(true)} />
      </section>

      <MeetingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </main>
  );
};

export default CurrentMeetings;
