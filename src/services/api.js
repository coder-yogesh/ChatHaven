import axios from 'axios';

const setaxios = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    headers: {
        'Content-Type': 'application/json',
    }
})

export const chatGpt = async (prompt) => {
    console.log('dd', process.env.REACT_APP_API_URL)
    const result = await setaxios.post('/chatgpt', { prompt });
    return result.data;
}

// export const login = async () => {
//     const result = await setaxios.get('/api/auth/google');
//     return result;
// }