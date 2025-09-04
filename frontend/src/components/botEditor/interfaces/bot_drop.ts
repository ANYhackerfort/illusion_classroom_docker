import axiosClient from "../../../api/axiosClient";

export async function storeBotToServer(
  bot: {
    id: string;
    name: string;
    memory: string;
    answer_select: string[];
    img?: File;
  },
  meetingName: string,
) {
  const formData = new FormData();
  formData.append("unique_id", bot.id);
  formData.append("name", bot.name);
  formData.append("memory", bot.memory);
  formData.append("answers", JSON.stringify(bot.answer_select));
  if (bot.img) formData.append("img", bot.img);

  const response = await axiosClient.post(
    `/api/auth/store_bot/${meetingName}/`,
    formData,
  );
  return response.data;
}

export async function getAllBotsFromServer(meetingName: string) {
  const response = await axiosClient.get(
    `/api/auth/get_all_bots/${meetingName}/`,
  );
  return response.data; // { bots: [...] }
}

export async function getBotAnswersFromServer(
  meetingName: string,
  currentQuestion: number,
  startTime: number,
  endTime: number,
  answers: string[]
) {
  const params = {
    currentQuestion,
    startTime,
    endTime,
    answers: answers.join(","), // 👈 send as "Focused,Tired,Motivated"
  };

  const response = await axiosClient.get(
    `/api/auth/get_bot_answers/${meetingName}/`,
    { params }
  );
  return response.data;
}
