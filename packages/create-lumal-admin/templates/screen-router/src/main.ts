import { createApp } from 'vue';
import App from './App.vue';
import { router } from './router';
import './styles.css';

async function bootstrap() {
  const app = createApp(App);
  app.use(router);
  await router.isReady();
  app.mount('#app');
}

void bootstrap();
