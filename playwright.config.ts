import { defineConfig } from '@playwright/test';

export default defineConfig({
  preserveOutput: 'failures-only',

  snapshotPathTemplate:
    '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{ext}',

  // fullyParallel: true,
  workers: 1,
});
