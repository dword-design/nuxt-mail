import { endent } from '@dword-design/functions';
import puppeteer from '@dword-design/puppeteer';
import axios from 'axios';
import packageName from 'depcheck-package-name';
import { execa, execaCommand } from 'execa';
import fs from 'fs-extra';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import P from 'path';
import portReady from 'port-ready';
import smtpTester from 'smtp-tester';
import kill from 'tree-kill-promise';
import withLocalTmpDir from 'with-local-tmp-dir';

export default {
  async after() {
    await this.mailServer.stop();
  },
  async afterEach() {
    await this.page.close();
    await this.browser.close();
    await this.resetWithLocalTmpDir();
  },
  async bcc() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', { message: { bcc: 'johndoe@gmail.com' }, smtp: { port: 3001 } }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.receivers).toEqual({ 'johndoe@gmail.com': true });
    } finally {
      await kill(nuxt.pid);
    }
  },
  async before() {
    this.mailServer = smtpTester.init(3001);

    await fs.outputFile(
      P.join('node_modules', '.cache', 'nuxt2', 'package.json'),
      JSON.stringify({ dependencies: { nuxt: '^2' } }),
    );

    await execaCommand('pnpm install', {
      cwd: P.join('node_modules', '.cache', 'nuxt2'),
      stdio: 'inherit',
    });
  },
  async beforeEach() {
    this.resetWithLocalTmpDir = await withLocalTmpDir();
    this.browser = await puppeteer.launch();
    this.page = await this.browser.newPage();
    this.mailServer.removeAll();

    await fs.outputFile(
      'node_modules/self/package.json',
      JSON.stringify({
        exports: './src/index.js',
        name: 'self',
        type: 'module',
      }),
    );

    await fs.copy('../src', 'node_modules/self/src');
  },
  async cc() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', { message: { cc: 'johndoe@gmail.com' }, smtp: { port: 3001 } }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.cc).toEqual('johndoe@gmail.com');
      expect(capture.email.receivers).toEqual({ 'johndoe@gmail.com': true });
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'cc and bcc'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: { bcc: 'bcc@gmail.com', cc: 'cc@gmail.com' },
              smtp: { port: 3001 },
            }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('cc@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
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
      await kill(nuxt.pid);
    }
  },
  async 'client side'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', { message: { to: 'johndoe@gmail.com' }, smtp: { port: 3001 } }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);
      await this.page.goto(`http://localhost:${port}`);
      const button = await this.page.waitForSelector('button');

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        button.click(),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'config by index'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: [{ to: 'foo@bar.com' }, { to: 'johndoe@gmail.com' }],
              smtp: { port: 3001 },
            }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'config by name'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: [
                { to: 'foo@bar.com' },
                { name: 'foo', to: 'johndoe@gmail.com' },
              ],
              smtp: { port: 3001 },
            }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  'config invalid index': async () => {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: [{ to: 'foo@bar.com' }],
              smtp: {},
            }],
          ],
        }
      `,
      'pages/index.vue': endent`
        <script setup>
        const mail = useMail()

        await mail.send({ config: 10 })
        </script>
      `,
    });

    const port = await getPort();
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);
      let errorMessage;

      try {
        await axios.post(`http://localhost:${port}`);
      } catch (error) {
        errorMessage = error.response.data.message;
      }

      expect(errorMessage).toEqual('Message config not found at index 10.');
    } finally {
      await kill(nuxt.pid);
    }
  },
  'config name not found': async () => {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', { message: [{ to: 'foo@bar.com' }], smtp: {} }],
          ],
        }
      `,
      'pages/index.vue': endent`
        <script setup>
        const mail = useMail()

        await mail.send({ config: 'foo' })
        </script>
      `,
    });

    const port = await getPort();
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);
      let errorMessage;

      try {
        await axios.post(`http://localhost:${port}`);
      } catch (error) {
        errorMessage = error.response.data.message;
      }

      expect(errorMessage).toEqual("Message config with name 'foo' not found.");
    } finally {
      await kill(nuxt.pid);
    }
  },
  async injected() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  'no message configs': async () => {
    await fs.outputFile(
      'nuxt.config.js',
      endent`
        export default {
          modules: [
            ['self', { smtp: {} }],
          ],
        }
      `,
    );

    await expect(execaCommand('nuxt build')).rejects.toThrow(
      'You have to provide at least one config.',
    );
  },
  'no recipients': async () => {
    await fs.outputFile(
      'nuxt.config.js',
      endent`
        export default {
          modules: [
            ['self', { message: {}, smtp: {} }],
          ],
        }
      `,
    );

    await expect(execaCommand('nuxt build')).rejects.toThrow(
      'You have to provide to/cc/bcc in all configs.',
    );
  },
  'no smtp config': async () => {
    await fs.outputFile(
      'nuxt.config.js',
      endent`
        export default {
          modules: ['self'],
        }
      `,
    );

    await expect(execaCommand('nuxt build')).rejects.toThrow(
      'SMTP config is missing.',
    );
  },
  async 'nuxt2: client side'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            '${packageName`@nuxtjs/axios`}',
            ['~/../src/index.js', {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            }],
          ],
        }
      `,
      'pages/index.vue': endent`
        <template>
          <button @click="send" />
        </template>

        <script>
        export default {
          methods: {
            send() {
              this.$mail.send({
                from: 'a@b.de',
                subject: 'Incredible',
                text: 'This is an incredible test message',
                to: 'foo@bar.de',
              })
            },
          },
        }
        </script>
      `,
    });

    await fs.remove('node_modules');

    await fs.symlink(
      P.join('..', 'node_modules', '.cache', 'nuxt2', 'node_modules'),
      'node_modules',
    );

    const port = await getPort();

    const nuxt = execa(P.join('node_modules', '.bin', 'nuxt'), ['dev'], {
      env: { PORT: port },
    });

    try {
      await nuxtDevReady(port);
      await this.page.goto(`http://localhost:${port}`);
      const button = await this.page.waitForSelector('button');

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        button.click(),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  'nuxt2: error': async () => {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            '${packageName`@nuxtjs/axios`}',
            ['~/../src/index.js', {
              message: [{ to: 'foo@bar.com' }],
              smtp: {},
            }],
          ],
        }
      `,
      'pages/index.vue': endent`
        <script>
        export default {
          asyncData: context => context.$mail.send({ config: 10 })
        }
        </script>
      `,
    });

    await fs.remove('node_modules');

    await fs.symlink(
      P.join('..', 'node_modules', '.cache', 'nuxt2', 'node_modules'),
      'node_modules',
    );

    const port = await getPort();

    const nuxt = execa(P.join('node_modules', '.bin', 'nuxt'), ['dev'], {
      env: { PORT: port },
    });

    try {
      await nuxtDevReady(port);
      let errorMessage;

      try {
        await axios.post(`http://localhost:${port}`);
      } catch (error) {
        errorMessage = error.response.data.error.message;
      }

      expect(errorMessage).toEqual('Message config not found at index 10.');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'nuxt2: runtime config'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            '${packageName`@nuxtjs/axios`}',
            '~/../src/index.js',
          ],
          privateRuntimeConfig: {
            mail: {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            }
          },
        }
      `,
      'pages/index.vue': endent`
        <template>
          <div />
        </template>

        <script>
        export default {
          asyncData: context => context.$mail.send({
            from: 'a@b.de',
            subject: 'Incredible',
            text: 'This is an incredible test message',
            to: 'foo@bar.de',
          })
        }
        </script>
      `,
    });

    await fs.remove('node_modules');

    await fs.symlink(
      P.join('..', 'node_modules', '.cache', 'nuxt2', 'node_modules'),
      'node_modules',
    );

    const port = await getPort();

    const nuxt = execa(P.join('node_modules', '.bin', 'nuxt'), ['dev'], {
      env: { PORT: port },
    });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'nuxt2: works'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            '${packageName`@nuxtjs/axios`}',
            ['~/../src/index.js', {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            }],
          ],
        }
      `,
      'pages/index.vue': endent`
        <template>
          <div />
        </template>

        <script>
        export default {
          asyncData: context => context.$mail.send({
            from: 'a@b.de',
            subject: 'Incredible',
            text: 'This is an incredible test message',
            to: 'foo@bar.de',
          })
        }
        </script>
      `,
    });

    await fs.remove('node_modules');

    await fs.symlink(
      P.join('..', 'node_modules', '.cache', 'nuxt2', 'node_modules'),
      'node_modules',
    );

    const port = await getPort();

    const nuxt = execa(P.join('node_modules', '.bin', 'nuxt'), ['dev'], {
      env: { PORT: port },
    });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async prod() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            }],
          ],
        }
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
    await execaCommand('nuxt build');
    const nuxt = execaCommand('nuxt start', { env: { PORT: port } });

    try {
      await portReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'runtime config'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: ['self'],
          runtimeConfig: {
            mail: {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            },
          },
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'server route'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            }],
          ],
        }
      `,
      'pages/index.vue': endent`
        <template>
          <div />
        </template>

        <script setup>
        $fetch('/api/foo');
        </script>
      `,
      'server/api/foo.js': endent`
        import { defineEventHandler, useMail } from '#imports';

        const mail = useMail();

        export default defineEventHandler(() => mail.send({
          from: 'a@b.de',
          subject: 'Incredible',
          text: 'This is an incredible test message',
          to: 'foo@bar.de',
        }));
      `,
    });

    const nuxt = execaCommand('nuxt dev');

    try {
      await nuxtDevReady();

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto('http://localhost:3000'),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
  async 'to, cc and bcc'() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: {
                bcc: 'bcc@gmail.com',
                cc: 'cc@gmail.com',
                to: 'to@gmail.com',
              },
              smtp: { port: 3001 },
            }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('to@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
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
      await kill(nuxt.pid);
    }
  },
  async valid() {
    await outputFiles({
      'nuxt.config.js': endent`
        export default {
          modules: [
            ['self', {
              message: { to: 'johndoe@gmail.com' },
              smtp: { port: 3001 },
            }],
          ],
        }
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
    const nuxt = execaCommand('nuxt dev', { env: { PORT: port } });

    try {
      await nuxtDevReady(port);

      const [capture] = await Promise.all([
        this.mailServer.captureOne('johndoe@gmail.com'),
        this.page.goto(`http://localhost:${port}`),
      ]);

      expect(capture.email.body).toEqual('This is an incredible test message');
      expect(capture.email.headers.subject).toEqual('Incredible');
      expect(capture.email.headers.from).toEqual('a@b.de');
      expect(capture.email.headers.to).toEqual('johndoe@gmail.com');
    } finally {
      await kill(nuxt.pid);
    }
  },
};
