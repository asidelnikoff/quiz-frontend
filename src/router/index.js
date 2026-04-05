import { createRouter, createWebHistory } from 'vue-router'
import AvaliableQuizzesView from '@/views/AvaliableQuizzesView.vue'
import OwnedQuizzesView from '@/views/OwnedQuizzesView.vue'
import ProfileView from '../views/User/ProfileView.vue'
import UserResultsView from '@/views/UserResultsView.vue'
import QuestionsListView from '../views/QuestionsListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/User/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/User/SignupView.vue')
    },
    {
      path: '/',
      name: 'home',
      component: AvaliableQuizzesView,
    },
    {
      path: '/quizzes',
      name: 'quizzes',
      component: OwnedQuizzesView
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/results',
      name: 'results',
      component: UserResultsView,
    },
    {
      path: '/questions',
      name: 'questions',
      component: QuestionsListView,
    },
    {
      path: '/create-test',
      name: 'create-test',
      component: () => import('../views/Quiz/QuizEditView.vue'),
    },
    {
      path: '/edit-test/:id',
      name: 'edit-test',
      component: () => import('../views/Quiz/QuizEditView.vue'),
    },
    {
      path: '/create-question',
      name: 'create-question',
      component: () => import('../views/QuestionEditView.vue'),
    },
    {
      path: '/edit-question/:id',
      name: 'edit-question',
      component: () => import('../views/QuestionEditView.vue')
    },
    {
      path: '/select-questions/:id',
      name: 'select-questions',
      component: () => import('../views/SelectQuestionsView.vue')
    },
    {
      path: '/test/:id',
      name: 'test',
      component: () => import('../views/Quiz/QuizInfoView.vue')
    },
    {
      path: '/invite-link/:id',
      name: 'invite-link',
      component: () => import('../views/InviteQuizView.vue')
    },
    {
      path: '/take-test',
      name: 'take-test',
      component: () => import('../views/Quiz/QuizProcessView.vue')
    },
    {
      path: '/test-results',
      name: 'test-results',
      component: () => import('../views/Quiz/QuizResultsView.vue')
    },
    {
      path: '/detailed-results',
      name: 'detailed-results',
      component: () => import('../views/Quiz/QuizDetailedResultsView.vue')
    },

    {
      path: '/groups',
      name: 'groups',
      component: () => import('../views/Group/GroupsListView.vue')
    },
    {
      path: '/group/:id',
      name: 'group',
      component: () => import('../views/Group/GroupView.vue')
    },
    {
      path: '/group/:group_id/test/:id',
      name: 'group-test',
      component: () => import('../views/Quiz/QuizInfoView.vue')
    },
    {
      path: '/group/select-quizzes',
      name: 'group-select-quizzes',
      component: () => import('../views/Quiz/SelectQuizView.vue')
    }
  ],
})

export default router
