import API from "./axiosInstance";

 const sendChatMessage = async({query, thread_id}) => {
    try {
        const response = await API.post('/chat', {
            query,
            thread_id,
        });
        return response.data;
    } catch (err) {
        
        throw err;
    }
}

export default sendChatMessage