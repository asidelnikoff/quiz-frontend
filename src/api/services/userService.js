import api from "..";

const apiPrefix = '/users-ms/api/v1';
const userService = {
    async getUserInfo(login) {
        const response = await api.get(apiPrefix + `/user?login=${login}`, { withCredentials: true });
        return response;
    },

    async updateUser(params) {
        const response = await api.post(apiPrefix + '/user/update', params, { withCredentials: true });
        return response;
    },

    async createUser(params) {
        const response = await api.post(apiPrefix + '/user/create', params);
        return response;
    },

    async deleteUser() {
        const response = await api.delete(apiPrefix + '/user/delete', { withCredentials: true });
        return response;
    },

    async getUsersInfos(params) {
        const response = await api.post(apiPrefix + '/users-list', params, { withCredentials: true });
        return response;
    }
}

export default userService;