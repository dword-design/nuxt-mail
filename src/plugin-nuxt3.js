import { defineNuxtPlugin } from '#imports';

import { useMail } from './composable.js';

export default defineNuxtPlugin(() => ({ provide: { mail: useMail() } }));
