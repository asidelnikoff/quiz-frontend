<script setup>
import { DataTable, Button, InputText, Paginator, Column } from 'primevue';
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useDialog } from 'primevue';
import CreateGroupDialog from '@/components/CreateGroupDialog.vue';
import groupService from '@/api/services/groupService';

const isLoading = ref(false);
const groups = ref([]);
const totalItems = ref(0);
const currentPage = computed(() => (first.value / perPage.value) + 1);
const perPage = ref(20);
const first = ref(0);
const searchQuery = ref(null);

const router = useRouter();
const dialog = useDialog();

const fetchGroups = async () => {
  isLoading.value = true;
  try {
    const response = await groupService.getUserGroups({
      search: searchQuery.value,
      limit: perPage.value,
      page: currentPage.value
    });
    groups.value = response.data.items || [];
    totalItems.value = response.data.count || 0;
  } catch (error) {
    console.error('Error fetching results:', error);
    groups.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
};

// Initial fetch
fetchGroups();

// Watch for page changes and refetch
watch([first, perPage], () => {
  fetchGroups();
});

watch(searchQuery, () => {
  fetchGroups();
})

// Watch for empty page and switch to previous page
watch([groups, totalItems], ([newGroups, newTotalItems]) => {
  if (newGroups.length === 0 && currentPage.value > 1 && newTotalItems > 0) {
    currentPage.value = Math.max(1, currentPage.value - 1);
    fetchGroups();
  }
});

const toCreateGroup = () => {
  console.log('creating group')
  dialog.open(CreateGroupDialog, {
    props: {
      header: 'Создание группы',
      style: {
        width: '50vw',
      },
      modal: true
    },
    emits: {
      onGroupCreate: toGroup
    }
  });
}

const toGroup = (groupId) => {
  router.push(`/group/${groupId}`)
}
</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-10">
      <h1 class="font-bold text-3xl">Мои группы</h1>
      <div class="flex flex-col gap-5">
        <InputText v-model="searchQuery" fluid placeholder="Введите название группы" />
        <DataTable :value="groups" :loading="isLoading" scrollable scrollHeight="flex" style="max-height: 58vh;">
          <template #empty> Нет групп для отображения </template>
          <Column header="#" style="width: 3rem;">
            <template #body="slotProps">
              {{ slotProps.index + 1 + first }}
            </template>
          </Column>
          <Column field="group_name" header="Название группы"></Column>
          <Column bodyClass="!text-end">
            <template #body="slotProps">
              <Button label="В группу" icon="pi pi-arrow-right" iconPos="right"
                @click="toGroup(slotProps.data.group_id)"></Button>
            </template>
          </Column>
        </DataTable>
        <div class="flex flex-row gap-5 w-full justify-between">
          <span></span>
          <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
            :rowsPerPageOptions="[20, 40, 60, 100]" />
          <Button label="Создать группу" icon="pi pi-plus-circle" iconPos="right" variant="outlined"
            @click="toCreateGroup"></Button>
        </div>
      </div>
    </div>
  </main>
</template>
