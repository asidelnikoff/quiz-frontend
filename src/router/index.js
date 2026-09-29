import { createRouter, createWebHistory } from 'vue-router'
import ChatListPage from '@/views/Messenger/ChatListPage.vue'
import ChatWindow from '@/views/Messenger/ChatWindow.vue'
import UserProfile from '@/views/Messenger/UserProfile.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/User/LoginView.vue')
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/User/SignupView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: UserProfile,
    },
    {
      path: '/',
      name: 'home',
      component: ChatListPage
    },
    {
      path: '/chats/:chatId',
      name: 'chat',
      component: ChatWindow,
      // route.params всегда строки — ChatWindow принимает chatId как [Number, String],
      // отдельного приведения типа не требуется
      props: (route) => ({
        chatId: route.params.chatId,
        chatName: route.query.name ?? ''
      }),
      // Отмечаем маршрут как "не переиспользуемый" — при переходе между двумя разными
      // чатами (например, по пересланному сообщению) компонент должен пересоздаваться,
      // а не просто получать новые props. useChatMessages/useReadTracking захватывают
      // chatId один раз при создании и не отслеживают его изменение реактивно.
      meta: { forceRemount: true }
    }
  ],
})

export default router
