import { createRouter, createWebHashHistory } from 'vue-router';
import ScreenEntry from './screen/ScreenEntry.vue';

export const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [{ path: '/', name: 'Screen', component: ScreenEntry }],
});
