import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';

// Importa Bootstrap y Bootstrap Icons
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Importa el store para poder verificar el estado de la sesión
import store from './store';

// Importa tus componentes que servirán como páginas
import Home from './components/Home.vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';
import AddMovie from './components/AddMovie.vue';
import SearchMovie from './components/SearchMovie.vue';
import ReceiptLookup from './components/ReceiptLookup.vue';
import ManageMovies from './components/ManageMovies.vue';
import EditMovie from './components/EditMovie.vue';
import Profile from './components/Profile.vue';
import Settings from './components/Settings.vue';

// Define las rutas
const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/add-movie', component: AddMovie, meta: { requiresAdmin: true } }, // Meta para rutas de admin
  { path: '/search', component: SearchMovie, meta: { requiresAuth: true } }, // Meta para rutas protegidas
  { path: '/receipt', component: ReceiptLookup, meta: { requiresAuth: true } }, // Meta para rutas protegidas
  { path: '/manage-movies', component: ManageMovies, meta: { requiresAdmin: true } }, // Meta para rutas de admin
  { path: '/edit-movie/:id', component: EditMovie, name: 'editMovie', meta: { requiresAdmin: true } }, // Meta para editar películas
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/settings', component: Settings, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

// --- GUARDIA DE NAVEGACIÓN GLOBAL ---
router.beforeEach((to, from, next) => {
  const isLoggedIn = !!store.state.value.session.username;
  const isAdmin = store.state.value.session.isAdmin;

  // Si la ruta requiere estar logueado y el usuario no lo está
  if (to.meta.requiresAuth && !isLoggedIn) {
    // Redirigir a la página de login, guardando la ruta a la que quería ir
    next({ path: '/login', query: { redirect: to.fullPath } });
  }
  // Si la ruta requiere ser admin y el usuario no lo es
  else if (to.meta.requiresAdmin && !isAdmin) {
    // Redirigir al inicio o a una página de "no autorizado"
    alert('No tienes permiso para acceder a esta página.');
    next('/');
  }
  // En cualquier otro caso, permitir el acceso
  else {
    next();
  }
});

createApp(App).use(router).mount('#app');
