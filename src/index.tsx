import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';
import { registerSW } from 'virtual:pwa-register';
import App from './app';
import './index.css';

registerSW({ immediate: true });

const root = document.getElementById('root');

render(
  () => (
    <Router>
      <App />
    </Router>
  ),
  root!,
);
