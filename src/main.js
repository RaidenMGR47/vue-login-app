import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';

// Importa tus componentes que servirán como páginas
import Home from './components/Home.vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';
import AddMovie from './components/AddMovie.vue';
import SearchMovie from './components/SearchMovie.vue';
import ReceiptLookup from './components/ReceiptLookup.vue';

// Define las rutas
const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/add-movie', component: AddMovie }, // ruta para admin
  { path: '/search', component: SearchMovie },
  { path: '/receipt', component: ReceiptLookup },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

createApp(App).use(router).mount('#app');
