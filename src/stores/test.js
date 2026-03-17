import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useTestStore = defineStore('test', () => {
  const isEditing = ref(false);
  const selectedQuestions = ref([]);

  const permissions = ref([]);
  const initialPermissions = ref([]);
  const toGrantPermissions = ref([]);
  const toRevokePermissions = ref([]);

  const visibility = ref(null);
  const initialVisibility = ref(null);

  const takeSettings = ref(null)

  const getIsEditing = computed(() => isEditing.value);
  const getSelectedQuestions = computed(() => selectedQuestions.value);
  const getCurrentPermissions = computed(() => permissions.value);
  const getInitialPermissions = computed(() => initialPermissions.value);
  const getToGrantPermissions = computed(() => toGrantPermissions.value);
  const getToRevokePermissions = computed(() => toRevokePermissions.value);
  const getVisibility = computed(() => visibility.value);
  const getInitialVisibility = computed(() => initialVisibility.value);
  const getTakeSettings = computed(() => takeSettings.value);

  function setIsEditing(newIsEditing) {
    isEditing.value = newIsEditing;
  };
  
  function setSelectedQuestions(questions) {
    selectedQuestions.value = questions;
  };

  function setInitialPermissions(permissions) {
    initialPermissions.value = structuredClone(permissions);
  }

  function setCurrentPermissions(curPermissions) {
    permissions.value = curPermissions;
  }

  function setToGrantPermissions(permissions) {
    toGrantPermissions.value = permissions;
  }

  function setToRevokePermissions(permissions) {
    toRevokePermissions.value = permissions;
  }

  function setVisibility(accessLevel) {
    visibility.value = accessLevel;
  }

  function setInitialVisibility(access) {
    initialVisibility.value = access;
  }

  function setTakeSettings(params) {
    takeSettings.value = params
  }
  
  function clear() {
    selectedQuestions.value = [];
    isEditing.value = false;
    visibility.value = null;
    takeSettings.value = null;

    clearPermissions();
  };

  function clearPermissions() {
    permissions.value = [];
    initialPermissions.value = [];
    toGrantPermissions.value = [];
    toRevokePermissions.value = [];
  }

  return {
    getIsEditing,
    getSelectedQuestions,
    getCurrentPermissions,
    getInitialPermissions,
    getToGrantPermissions,
    getToRevokePermissions,
    getVisibility,
    getInitialVisibility,
    getTakeSettings,

    setIsEditing,
    setSelectedQuestions,
    setInitialPermissions,
    setCurrentPermissions,
    setToGrantPermissions,
    setToRevokePermissions,
    setVisibility,
    setInitialVisibility,
    setTakeSettings,
    
    clear,
    clearPermissions
  }
});