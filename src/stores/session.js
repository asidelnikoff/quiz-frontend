import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useSessionStore = defineStore('session', () =>
{
  const test = ref(null);
  const settings = ref(null)

  const localStorageSettings = computed(() => localStorage.getItem('settings') || null)
  if (localStorageSettings.value) {
    settings.value = JSON.parse(localStorageSettings.value)
  }

  const localStorageTest = computed(() => localStorage.getItem('test') || null);
  if(localStorageTest.value) {
    test.value = JSON.parse(localStorageTest.value);
  }
  
  function getSessionId() { return localStorage.getItem('testSessionId'); };
  function getInviteHash() { return localStorage.getItem('invite'); }
  function getGroupId() { return localStorage.getItem('groupId'); }
  function getTest() { return test.value };
  function getSettings() { return settings.value }

  function saveTest(savingTest) {
    test.value = savingTest;
    localStorage.setItem('test', JSON.stringify(test.value));
  }

  function saveGroupId(groupId) {
    localStorage.setItem('groupId', groupId);
  }

  function startSession(sessionId) {
    localStorage.setItem('testSessionId', sessionId);
  }

  function clear() {
    removeTest()
    localStorage.removeItem('testSessionId');
    localStorage.removeItem('invite');
    removeSettings()
    localStorage.removeItem('groupId')
  }

  function removeSettings() {
    localStorage.removeItem('settings')
    settings.value = null
  }

  function removeTest() {
    localStorage.removeItem('test');
    test.value = null
  }

  function removeSession() {
    localStorage.removeItem('testSessionId');
  }

  function setInviteHash(hash) {
    localStorage.setItem('invite', hash);
  }

  function setSettings(newSettings) {
    settings.value = newSettings
    localStorage.setItem('settings', JSON.stringify(settings.value))
  }

  return {
    getSessionId,
    getTest,
    getInviteHash,
    getSettings,
    getGroupId,

    saveTest,
    startSession,
    setInviteHash,
    setSettings,
    saveGroupId,
    
    clear,
    removeSession
  }
});