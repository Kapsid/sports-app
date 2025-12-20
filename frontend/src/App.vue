<template>
  <div class="app">
    <div class="snowflake-bg"></div>
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  const token = localStorage.getItem('token')
  if (token) {
    try {
      await authStore.fetchUser()
    } catch (error) {
      authStore.logout()
      router.push('/login')
    }
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
}
</style>
