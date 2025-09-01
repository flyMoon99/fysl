<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAdminStore } from '@/store/admin'

const adminStore = useAdminStore()

onMounted(() => {
  adminStore.initAdmin()
})
</script>

<style>
#app {
  height: 100vh;
}
</style>
