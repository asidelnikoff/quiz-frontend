import api from "..";

const apiPrefix = '/chat-ms/api/v1';
const chatService = {
    async getChatsList(request) {
        const response = await api.post(apiPrefix + '/chats', request, { withCredentials: true });
        return response;
    },
}

export default chatService;