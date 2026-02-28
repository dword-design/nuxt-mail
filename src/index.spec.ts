import pathLib from 'node:path';

import { expect, test as base } from '@playwright/test';
import axios from 'axios';
import endent from 'endent';
import { execaCommand } from 'execa';
import fs from 'fs-extra';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import portReady from 'port-ready';
import type { MailServer } from 'smtp-tester';
import smtpTester from 'smtp-tester';
import kill from 'tree-kill-promise';

const test = base.extend<{ mailServer: MailServer; mailServerPort: number }>({
  mailServer: async ({ mailServerPort }, use) => {
    const mailServer = smtpTester.init(mailServerPort);

    try {
      await use(mailServer);
    } finally {
      mailServer.stop();
    }
  },
  mailServerPort: async ({}, use) => {
    const port = await getPort();
    await use(port);
  },
});

test('bcc', async ({ page, mailServer, mailServerPort }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', { message: { bcc: 'johndoe@gmail.com' }, smtp: { port: ${mailServerPort} } }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { NODE_ENV: '', PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.receivers).toEqual({ 'johndoe@gmail.com': true });
  } finally {
    await kill(nuxt.pid!);
  }
});

test('cc', async ({ page, mailServer, mailServerPort }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', { message: { cc: 'johndoe@gmail.com' }, smtp: { port: ${mailServerPort} } }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.cc).toEqual('johndoe@gmail.com');
    expect(capture.email.receivers).toEqual({ 'johndoe@gmail.com': true });
  } finally {
    await kill(nuxt.pid!);
  }
});

test('cc and bcc', async ({ page, mailServer, mailServerPort }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', {
            message: { bcc: 'bcc@gmail.com', cc: 'cc@gmail.com' },
            smtp: { port: ${mailServerPort} },
          }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('cc@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.cc).toEqual('cc@gmail.com');

    expect(capture.email.receivers).toEqual({
      'bcc@gmail.com': true,
      'cc@gmail.com': true,
    });
  } finally {
    await kill(nuxt.pid!);
  }
});

test('client side', async ({ page, mailServer, mailServerPort }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', { message: { to: 'johndoe@gmail.com' }, smtp: { port: ${mailServerPort} } }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <button @click="send" />
      </template>

      <script setup>
      const mail = useMail()

      const send = mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
        to: 'foo@bar.de',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);
    await page.goto(`http://localhost:${port}`);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.locator('button').click(),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
  } finally {
    await kill(nuxt.pid!);
  }
});

test('config by index', async ({
  page,
  mailServer,
  mailServerPort,
}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', {
            message: [{ to: 'foo@bar.com' }, { to: 'johndoe@gmail.com' }],
            smtp: { port: ${mailServerPort} },
          }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
        config: 1,
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
  } finally {
    await kill(nuxt.pid!);
  }
});

test('config by name', async ({
  page,
  mailServer,
  mailServerPort,
}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', {
            message: [
              { to: 'foo@bar.com' },
              { name: 'foo', to: 'johndoe@gmail.com' },
            ],
            smtp: { port: ${mailServerPort} },
          }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        config: 'foo',
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { NODE_ENV: '', PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
  } finally {
    await kill(nuxt.pid!);
  }
});

test('config invalid index', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', {
            message: [{ to: 'foo@bar.com' }],
            smtp: {},
          }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <script setup>
      const mail = useMail()

      await mail.send({ config: 10 })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    await expect(
      axios.post(`http://localhost:${port}`).catch(error => {
        throw new Error(error.response.data.message);
      }),
    ).rejects.toThrow('Message config not found at index 10.');
  } finally {
    await kill(nuxt.pid!);
  }
});

test('config name not found', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', { message: [{ to: 'foo@bar.com' }], smtp: {} }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <script setup>
      const mail = useMail()

      await mail.send({ config: 'foo' })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    await expect(
      axios.post(`http://localhost:${port}`).catch(error => {
        throw new Error(error.response.data.message);
      }),
    ).rejects.toThrow("Message config with name 'foo' not found.");
  } finally {
    await kill(nuxt.pid!);
  }
});

test('injected', async ({ page, mailServer, mailServerPort }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', {
            message: { to: 'johndoe@gmail.com' },
            smtp: { port: ${mailServerPort} },
          }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const { $mail } = useNuxtApp()

      await $mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
        to: 'foo@bar.de',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
  } finally {
    await kill(nuxt.pid!);
  }
});

test('prod', async ({ page, mailServer, mailServerPort }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', {
            message: { to: 'johndoe@gmail.com' },
            smtp: { port: ${mailServerPort} },
          }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
        to: 'foo@bar.de',
      })
      </script>
    `,
  });

  const port = await getPort();
  await execaCommand('nuxt build', { cwd });

  const nuxt = execaCommand('node .output/server/index.mjs', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await portReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
  } finally {
    await kill(nuxt.pid!);
  }
});

test('to, cc and bcc', async ({
  page,
  mailServer,
  mailServerPort,
}, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', {
            message: {
              bcc: 'bcc@gmail.com',
              cc: 'cc@gmail.com',
              to: 'to@gmail.com',
            },
            smtp: { port: ${mailServerPort} },
          }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('to@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.to).toEqual('to@gmail.com');
    expect(capture.email.headers.cc).toEqual('cc@gmail.com');

    expect(capture.email.receivers).toEqual({
      'bcc@gmail.com': true,
      'cc@gmail.com': true,
      'to@gmail.com': true,
    });
  } finally {
    await kill(nuxt.pid!);
  }
});

test('env variable', async ({ page, mailServer, mailServerPort }, testInfo) => {
  const cwd = testInfo.outputPath();

  await outputFiles(cwd, {
    '.env': `NUXT_MAIL_SMTP='{ "port": ${mailServerPort} }'`,
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: [
          ['../../src', { message: { to: 'johndoe@gmail.com' } }],
        ],
      });
    `,
    'pages/index.vue': endent`
      <template>
        <div />
      </template>

      <script setup>
      const mail = useMail()

      await mail.send({
        from: 'a@b.de',
        subject: 'Incredible',
        text: 'This is an incredible test message',
        to: 'foo@bar.de',
      })
      </script>
    `,
  });

  const port = await getPort();

  const nuxt = execaCommand('nuxt dev', {
    cwd,
    env: { PORT: String(port) },
    reject: false,
  });

  try {
    await nuxtDevReady(port);

    const [capture] = await Promise.all([
      mailServer.captureOne('johndoe@gmail.com'),
      page.goto(`http://localhost:${port}`),
    ]);

    expect(capture.email.body).toEqual('This is an incredible test message');
    expect(capture.email.headers.subject).toEqual('Incredible');
    expect(capture.email.headers.from).toEqual('a@b.de');
    expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
  } finally {
    await kill(nuxt.pid!);
  }
});

test.describe('options checking', () => {
  test('no message configs', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await fs.outputFile(
      pathLib.join(cwd, 'nuxt.config.ts'),
      endent`
        export default defineNuxtConfig({
          modules: [
            ['../../src', { smtp: {} }],
          ],
        });
      `,
    );

    await expect(execaCommand('nuxt dev', { cwd })).rejects.toThrow(
      'You have to provide at least one config.',
    );
  });

  test('no recipients', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await fs.outputFile(
      pathLib.join(cwd, 'nuxt.config.ts'),
      endent`
        export default defineNuxtConfig({
          modules: [
            ['../../src', { message: {}, smtp: {} }],
          ],
        });
      `,
    );

    await expect(execaCommand('nuxt dev', { cwd })).rejects.toThrow(
      'You have to provide to/cc/bcc in all configs.',
    );
  });

  test('no smtp config', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await fs.outputFile(
      pathLib.join(cwd, 'nuxt.config.ts'),
      endent`
        export default defineNuxtConfig({
          modules: ['../../src'],
        });
      `,
    );

    await expect(execaCommand('nuxt dev', { cwd })).rejects.toThrow(
      'SMTP config is missing.',
    );
  });

  test('check options dev', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await fs.outputFile(
      pathLib.join(cwd, 'nuxt.config.ts'),
      endent`
        export default defineNuxtConfig({
          modules: ['../../src'],
        });
      `,
    );

    await expect(execaCommand('nuxt dev', { cwd })).rejects.toThrow(
      'SMTP config is missing.',
    );
  });

  test('check options prod', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await fs.outputFile(
      pathLib.join(cwd, 'nuxt.config.ts'),
      endent`
        export default defineNuxtConfig({
          modules: ['../../src'],
        });
      `,
    );

    await execaCommand('nuxt build', { cwd });

    await expect(
      execaCommand('node .output/server/index.mjs', { cwd }),
    ).rejects.toThrow('SMTP config is missing.');
  });

  test('check options prerender build', async ({}, testInfo) => {
    const cwd = testInfo.outputPath();

    await outputFiles(cwd, {
      'nuxt.config.ts': endent`
        export default defineNuxtConfig({
          modules: ['../../src'],
          nitro: {
            prerender: {
              routes: ['/'],
            },
          },
        });
      `,
      'pages/index.vue': endent`
        <template>
          <div />
        </template>
      `,
    });

    await execaCommand('nuxt build', { cwd });
  });
});

test('types top-level options', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();
  await execaCommand('base prepublishOnly');

  await outputFiles(cwd, {
    'nuxt.config.ts': endent`
      export default defineNuxtConfig({
        modules: ['self'],
        mail: { message: { cc: 'johndoe@gmail.com' }, smtp: { host: 'localhost', port: 1234 } },
      });
    `,
    'tsconfig.json': JSON.stringify({ extends: './.nuxt/tsconfig.json' }),
  });

  await fs.ensureDir(pathLib.join(cwd, 'node_modules'));
  await fs.symlink('../../..', pathLib.join(cwd, 'node_modules', 'self'));
  await execaCommand('nuxt typecheck', { cwd });
});
