import { defineNitroPlugin } from 'nitropack/runtime';

import { useRuntimeConfig } from '#imports';

import checkOptions from './check-options';

const { mail: options } = useRuntimeConfig();

// For prod
export default defineNitroPlugin(() => checkOptions(options));
