import API from "./axiosInstance";

 const sendChatMessage = async({query, client_id, thread_id}) => {
    try {
        const response = await API.post('/chat', {
            query,
            client_id,
            thread_id,
        });
        return response.data;
    } catch (err) {
        
        throw err;
    }
}

export default sendChatMessage