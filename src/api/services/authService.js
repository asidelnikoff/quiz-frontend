import api from "..";

const apiPrefix = '/users-ms/api/v1';
const authService = {
  async login(params) {
    const response = await api.post(apiPrefix + '/auth', params, { withCredentials: true });
    return response;
  },
  async tempLogin(params) {
    const response = await api.post(apiPrefix + '/limited-auth', params, { withCredentials: true });
    return response;
  },

  async logout() {
    const response = await api.post(apiPrefix + '/logout', null, { withCredentials: true });
    return response;
  },

  async refresh() {
    const response = await api.post(apiPrefix + '/refresh', null, { withCredentials: true });
    return response;
  },

  async signup(params) {
    const response = await api.post(apiPrefix + '/user/create', params);
    return response;
  },

  async deleteUser() {
    const response = await api.delete(apiPrefix + '/user/delete', { withCredentials: true });
    return response;
  },

  async getUser() {
    const response = await api.get(apiPrefix + '/user', { withCredentials: true });
    return response;
  }
}
export default authService