import api from "..";

const apiPrefix = '/quiz-ms/api/v1';
const quizService = {
    async getQuestionForEdit(questionId) {
        const response = api.get(apiPrefix + `/question-for-edit/${questionId}`);
        return response;
    },

    async getQuiz(quizId, invite) {
        let path = apiPrefix + `/quiz/${quizId}`;
        if (invite) {
            path += `?invite=${invite}`;
        }
        const response = await api.get(path);
        return response;
    },

    async getGroupQuiz(groupId, quizId) {
        const response = await api.get(apiPrefix + `/group/${groupId}/quiz/${quizId}`);
        return response;
    },

    async createQuiz(params) {
        const response = await api.post(apiPrefix + '/quiz/create', params);
        return response;
    },

    async updateQuiz(quizId, params) {
        const response = await api.post(apiPrefix + `/quiz/update/${quizId}`, params);
        return response;
    },

    async getQuestionsList(params) {
        const response = await api.get(apiPrefix + '/question/list', {
            params: params
        });
        return response;
    },

    async deleteQuestion(questionId) {
        const response = await api.delete(apiPrefix + `/question/delete/${questionId}`);
        return response;
    },

    async createQuestion(params) {
        const response = await api.post(apiPrefix + '/question/create', params);
        return response;
    },

    async updateQuestion(questionId, params) {
        const response = await api.post(apiPrefix + `/question/update/${questionId}`, params);
        return response;
    },

    async getSession(sessionId) {
        const response = await api.get(apiPrefix + `/quiz/session/${sessionId}`);
        return response;
    },

    async startQuizSession(params) {
        const response = await api.post(apiPrefix + '/quiz/session/start', params);
        return response;
    },

    async getQuizQuestions(quizId, shuffleQuestions, invite) {
        let path = apiPrefix + `/quiz/${quizId}/questions?shuffleQuestions=${shuffleQuestions}`;
        if (invite) {
            path += `&invite=${invite}`;
        }
        const response = await api.get(path);
        return response;
    },

    async getQuizForEdit(quizId) {
        const response = await api.get(apiPrefix + `/quiz/${quizId}/for-edit`, { withCredentials: true });
        return response;
    },

    async goToQuestion(sessionId, questionIndex) {
        const response = await api.post(apiPrefix + `/quiz/session/${sessionId}/go-to/${questionIndex}`, { withCredentials: true });
        return response;
    },

    async answerQuestion(sessionId, params) {
        const response = await api.post(apiPrefix + `/quiz/session/${sessionId}/answer`, params);
        return response;
    },

    async getOwnedQuizzesList(params) {
        const response = await api.get(apiPrefix + '/quiz/list/owned', {
            params: params
        });
        return response;
    },

    async getAvailableQuizzesList(params) {
        const response = await api.get(apiPrefix + '/quiz/list/available', {
            params: params
        });
        return response;
    },

    async deleteQuiz(quizId, deleteQuestions=false) {
        const response = await api.delete(apiPrefix + `/quiz/delete/${quizId}?deleteQuestions=${deleteQuestions}`);
        return response;
    },

    async endQuizSession(sessionId) {
        const response = await api.post(apiPrefix + `/quiz/session/${sessionId}/end`);
        return response;
    },

    async moveQuizSessionToResults(sessionId) {
        const response = await api.post(apiPrefix + `/quiz/session/${sessionId}/to-results`);
        return response;
    },

    async getDetailedQuizSessionResults(sessionId) {
        const response = await api.get(apiPrefix + `/quiz/session/${sessionId}/detailed-results`);
        return response;
    },

    async uploadQuiz(file) {
        const response = await api.post(apiPrefix + '/quiz/upload', 
        {upload: file},
        {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response;
    },

    async getResults(params) {
        const response = await api.post(apiPrefix + '/results', params, { withCredentials: true });
        return response; 
    },

    async getPermissionsList(quizId) {
        const response = await api.get(apiPrefix + `/quiz/${quizId}/permissions`, { withCredentials: true });
        return response;
    },

    async grantPermissions(quizId, params) {
        const response = await api.post(apiPrefix + `/quiz/update/${quizId}/permissions/grant`, params, { withCredentials: true });
        return response;
    },

    async revokePermissions(quizId, params) {
        const response = await api.post(apiPrefix + `/quiz/update/${quizId}/permissions/revoke`, params, { withCredentials: true });
        return response;
    },

    async getVisibilityLevel(quizId) {
        const response = await api.get(apiPrefix + `/quiz/${quizId}/visibility`, { withCredentials: true });
        return response;
    },

    async setVisibilityLevel(quizId, params) {
        const response = await api.post(apiPrefix + `/quiz/update/${quizId}/visibility`, params, { withCredentials: true });
        return response;
    },

    async getLinkHash(quizId) {
        const response = await api.get(apiPrefix + `/quiz/${quizId}/visibility/link`);
        return response;
    }
}

export default quizService;