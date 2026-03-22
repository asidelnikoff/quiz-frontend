import authService from '@/api/services/authService';
import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import groupService from '@/api/services/groupService';

export const useAuthStore = defineStore('auth', () => {
  //
  // User and their token
  //
  const user = computed(() => localStorageUser() ? JSON.parse(localStorageUser()) : null)
  const token = ref(localStorage.getItem('token') || null)
  const isLimited = computed(() => !!localStorage.getItem('access_type'))
  const localStorageUser = () => localStorage.getItem('user') || null

  //
  // Getters
  //
  const getLogin = computed(() => {
    return user?.value?.login || ''
  })

  const getId = computed(() => {
    return user?.value?.id
  })

  const getToken = () => localStorage.getItem('token') || null
  //
  // User login/logout
  //
  async function login(params) {
    const response = await authService.login(params)
    if (response.status === 200) {
      token.value = response.data.access_token;
      localStorage.setItem('token', token.value);

      let userData = await authService.getUser();
      localStorage.setItem('user', JSON.stringify(userData.data));

      localStorage.removeItem('access_type')
    }

    return response
  }
  async function tempLogin(params) {
    const response = await authService.tempLogin(params)
    if (response.status === 200) {
      token.value = response.data.access_token;
      localStorage.setItem('token', token.value);

      let userData = await authService.getUser();
      localStorage.setItem('user', JSON.stringify(userData.data));

      localStorage.setItem('access_type', 'limited');
    }

    return response
  }
  async function logout() {
    const response = await authService.logout();
    user.value = null;
    token.value = null;
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('access_type')
    return response
  }

  async function groupLogin(groupId) {
    const response = await groupService.authToGroup(groupId)
    if (response.status === 200) {
      token.value = response.data.access_token;
      localStorage.setItem('token', token.value);
      localStorage.removeItem('access_type')
    }

    return response
  }
  async function groupLogout() {
    const response = await groupService.logoutFromGroup()
    if (response.status === 200) {
      token.value = response.data.access_token;
      localStorage.setItem('token', token.value);
      localStorage.removeItem('access_type')
    }

    return response
  }

  async function refresh() {
    let response = await authService.refresh()
    const { access_token } = response.data;
    localStorage.setItem('token', access_token);
  }
  //
  // Exported members
  //
  return { 
    user, 

    getLogin,
    getId,
    getToken,
    isLimited,

    login, 
    tempLogin,
    logout,
    groupLogin,
    groupLogout,
    refresh
  }
})