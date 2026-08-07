import api from "..";

const apiPrefix = '/chat-ms/api/v1';
const chatService = {
    async getChatsList(request) {
        const response = await api.post(apiPrefix + '/chats', request, { withCredentials: true });
        return response;
    },

    async getMessages(chatId, request) {
        const route = apiPrefix + `/chats/${chatId}/messages`
        const response = await api.post(route, request, { withCredentials: true })
        return response
    },

    async patchMessagesReads(chatId, request) {
        const route = apiPrefix + `/chats/${chatId}/messages/reads`
        const response = await api.patch(route, request, { withCredentials: true })
        return response
    },

    async postMessage(chatId, request) {
        const route = apiPrefix + `/chats/${chatId}/messages/new`
        const response = await api.post(route, request, { withCredentials: true })
        return response
    }
}

export default chatService;