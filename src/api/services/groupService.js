import api from "..";
import quizService from "./quizService";

const apiPrefix = '/users-ms/api/v1';
const quizApiPrefix = '/quiz-ms/api/v1';
const groupService = {
    async createGroup(params) {
        const response = await api.post(apiPrefix + `/group/create`, params, { withCredentials: true });
        return response;
    },

    async updateGroup(groupId, params) {
        const response = await api.post(apiPrefix + `/group/${groupId}/update`, params, { withCredentials: true });
        return response;
    },

    async deleteGroup(groupId) {
        const response = await api.delete(apiPrefix + `/group/${groupId}/delete`, { withCredentials: true });
        return response;
    },

    async addMembersToGroup(groupId, params) {
        const response = await api.post(apiPrefix + `/group/${groupId}/add-members`, params, { withCredentials: true });
        return response;
    },

    async editMembersRoles(groupId, params) {
        const response = await api.post(apiPrefix + `/group/${groupId}/edit-members-roles`, params, { withCredentials: true });
        return response;
    },

    async deleteMembersFromGroup(groupId, params) {
        const response = await api.post(apiPrefix + `/group/${groupId}/delete-members`, params, { withCredentials: true });
        return response;
    },

    async getUserGroups(params) {
        const response = await api.post(apiPrefix + `/group/list`, params, { withCredentials: true });
        return response;
    },

    async getGroupDetailed(groupId, params) {
        const response = await api.post(apiPrefix + `/group/${groupId}/detailed-info`, params, { withCredentials: true });
        return response;
    },

    async getGroupQuizzes(groupId, params) {
        const response = await api.get(quizApiPrefix + `/group/${groupId}/quiz-list`, {
            params: params
        }, { withCredentials: true })
        return response;
    },

    async updateGroupQuizz(groupId, params) {
        const response = await api.post(quizApiPrefix + `/group/${groupId}/update-quiz`, params, { withCredentials: true });
        return response;
    },

    async getGroupQuizTakeSettings(groupId, quizId) {
        const response = await api.get(quizApiPrefix + `/group/${groupId}/quiz/${quizId}/settings`, { withCredentials: true });
        return response;
    },

    async addQuizToGroup(groupId, params) {
        const response = await api.post(quizApiPrefix + `/group/${groupId}/add-quiz`, params, { withCredentials: true });
        return response;
    },

    async deleteQuizFromGroup(groupId, params) {
        const response = await api.post(quizApiPrefix + `/group/${groupId}/delete-quiz`, params, { withCredentials: true });
        return response;
    },

    async authToGroup(groupId) {
        const response = await api.post(apiPrefix + `/group/${groupId}/auth-to`, {}, { withCredentials: true });
        return response;
    },
    async logoutFromGroup(groupId) {
        const response = await api.post(apiPrefix + `/group/${groupId}/logout-from`, {}, { withCredentials: true });
        return response;
    }
}

export default groupService;