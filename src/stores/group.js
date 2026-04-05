import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useGroupStore = defineStore('group', () => {
  const isEditing = ref(false);
  const selectedTests = ref([]);
  const initialTests = ref([]);
  
  const getIsEditing = computed(() => isEditing.value);
  const getSelectedTests = computed(() => selectedTests.value);
  const getInitialTests = computed(() => initialTests.value);

    function setIsEditing(newIsEditing) {
    isEditing.value = newIsEditing;
  };
  
  function setSelectedTests(tests) {
    selectedTests.value = tests;
  };

  function setInitialTests(tests) {
    initialTests.value = tests;
  }

  function clear() {
    selectedTests.value = [];
    initialTests.value = [];
    isEditing.value = false;
  }

  return {
    getIsEditing,
    getSelectedTests,
    getInitialTests,
    setIsEditing,
    setSelectedTests,
    setInitialTests,
    clear
  }
})