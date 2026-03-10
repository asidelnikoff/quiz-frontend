import api from '..'

const apiPrefix = '/users-ms/api/v1'
const quizApiPrefix = '/quiz-ms/api/v1'
const groupService = {
  // COMMON GROUP
  async createGroup(params) {
    const response = await api.post(apiPrefix + `/group/create`, params, { withCredentials: true })
    return response
  },

  async updateGroup(params) {
    const response = await api.post(apiPrefix + `/group/update`, params, { withCredentials: true })
    return response
  },

  async deleteGroup() {
    const response = await api.delete(apiPrefix + `/group/delete`, { withCredentials: true })
    return response
  },
  ///

  // USER GROUP
  async authToGroup(groupId) {
    const response = await api.post(
      apiPrefix + `/group/${groupId}/auth`,
      {},
      { withCredentials: true },
    )
    return response
  },
  async logoutFromGroup() {
    const response = await api.post(apiPrefix + `/group/logout`, {}, { withCredentials: true })
    return response
  },

  async getUserGroups(params) {
    const response = await api.post(apiPrefix + `/group/list`, params, { withCredentials: true })
    return response
  },

  async getGroupDetailed(params) {
    const response = await api.post(apiPrefix + `/group/detailed-info`, params, {
      withCredentials: true,
    })
    return response
  },

  async getGroupQuizzes(params) {
    const response = await api.get(
      quizApiPrefix + `/group/quiz/list`,
      {
        params: params,
      },
      { withCredentials: true },
    )
    return response
  },
  ///

  // MEMBERS
  async addMembersToGroup(params) {
    const response = await api.post(apiPrefix + `/group/members/add`, params, {
      withCredentials: true,
    })
    return response
  },

  async editMembersRoles(params) {
    const response = await api.post(apiPrefix + `/group/members/roles`, params, {
      withCredentials: true,
    })
    return response
  },

  async deleteMembersFromGroup(params) {
    const response = await api.post(apiPrefix + `/group/members/delete`, params, {
      withCredentials: true,
    })
    return response
  },
  ///

  // QUIZZES
  async updateGroupQuizz(params) {
    const response = await api.post(quizApiPrefix + `/group/quiz/update`, params, {
      withCredentials: true,
    })
    return response
  },
  async updateGroupDefaultSettings(params) {
    const response = await api.post(quizApiPrefix + `/group/quiz/default-settings`, params, {
      withCredentials: true,
    })
    return response
  },
  async getGroupDefaultSettings() {
    const response = await api.get(quizApiPrefix + `/group/quiz/default-settings`, {
      withCredentials: true,
    })
    return response
  },
  async getGroupQuizTakeSettings(quizId) {
    const response = await api.get(quizApiPrefix + `/group/quiz/${quizId}/settings`, {
      withCredentials: true,
    })
    return response
  },

  async addQuizToGroup(params) {
    const response = await api.post(quizApiPrefix + `/group/quiz/add`, params, {
      withCredentials: true,
    })
    return response
  },

  async deleteQuizFromGroup(params) {
    const response = await api.post(quizApiPrefix + `/group/quiz/delete`, params, {
      withCredentials: true,
    })
    return response
  },
  ///
}

export default groupService
