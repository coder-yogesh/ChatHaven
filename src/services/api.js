// import axios from 'axios';

// const setaxios = axios.create({
//     baseURL: process.env.REACT_APP_API_URL,
//     headers: {
//         'Content-Type': 'application/json',
//     }
// })

// export async function chatGpt = async (prompt) => {
//     console.log('dd', process.env.REACT_APP_API_URL)
//     const result = await setaxios.post('/chatgpt', { prompt });
//     return result.data;
// }

// export const login = async () => {
//     const result = await setaxios.get('/api/auth/google');
//     return result;
// }


// services/api.js
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3000";

/**
 * Sends a prompt (and optional image file) to the backend.
 * @param {string} prompt
 * @param {File} [imageFile]
 * @returns {Promise<{ success: boolean, message?: string, error?: string }>}
 */
export async function chatGpt(prompt, imageFile) {
  const form = new FormData();
  form.append("prompt", prompt);
  if (imageFile) form.append("image", imageFile);

  const res = await fetch(`${API_BASE}chatgpt`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Request failed");
  return data;
}

/**
 * Sends like/dislike feedback for a given message to the backend, so it can
 * be logged/stored rather than just kept in local UI state.
 * @param {string} messageId - a stable id for the message (see App.jsx)
 * @param {'up'|'down'|null} type - null clears previously-sent feedback
 */
export async function sendFeedback(messageId, type) {
  const res = await fetch(`${API_BASE}feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageId, type }),
  });
  return res.json();
}