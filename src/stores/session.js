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
  const inviteHash = ref('');
  
  function getSessionId() { return localStorage.getItem('testSessionId'); };
  function getInviteHash() { return localStorage.getItem('invite'); }
  function getGroupId() { return localStorage.getItem('groupId'); }
  const getTest = computed(() => test.value);
  const getSettings = computed(() => settings.value)

  function saveTest(savingTest) {
    console.log('Saving test');
    test.value = savingTest;
    localStorage.setItem('test', JSON.stringify(test.value));
    console.log('Saved test');
  }

  function saveGroupId(groupId) {
    localStorage.setItem('groupId', groupId);
  }

  function startSession(sessionId) {
    console.log('Saving sessionId', localStorage.getItem('testSessionId'));
    localStorage.setItem('testSessionId', sessionId);
    console.log('Saved sessiondId', localStorage.getItem('testSessionId'));
  }

  function clear() {
    localStorage.removeItem('test');
    localStorage.removeItem('testSessionId');
    localStorage.removeItem('invite');
    localStorage.removeItem('settings')
    localStorage.removeItem('groupId')
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