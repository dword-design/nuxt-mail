import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import { buildNuxt, loadNuxt } from '@nuxt/kit'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import fs from 'fs-extra'
import ora from 'ora'
import outputFiles from 'output-files'
import { pEvent } from 'p-event'
import P from 'path'
import smtpTester from 'smtp-tester'
import kill from 'tree-kill-promise'
import { fileURLToPath } from 'url'

import self from './index.js'

export default tester(
  {
    bcc: {
      files: {
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
            }),
          }
          </script>

        `,
      },
      options: { message: { bcc: 'johndoe@gmail.com' }, smtp: { port: 3001 } },
      async test() {
        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.receivers).toEqual({ 'johndoe@gmail.com': true })
      },
    },
    cc: {
      files: {
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
            }),
          }
          </script>

        `,
      },
      options: { message: { cc: 'johndoe@gmail.com' }, smtp: { port: 3001 } },
      async test() {
        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.cc).toEqual('johndoe@gmail.com')
        expect(email.email.receivers).toEqual({ 'johndoe@gmail.com': true })
      },
    },
    'cc and bcc': {
      files: {
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
            }),
          }
          </script>

        `,
      },
      options: {
        message: { bcc: 'bcc@gmail.com', cc: 'cc@gmail.com' },
        smtp: { port: 3001 },
      },
      async test() {
        const waiter = this.mailServer.captureOne('cc@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.cc).toEqual('cc@gmail.com')
        expect(email.email.receivers).toEqual({
          'bcc@gmail.com': true,
          'cc@gmail.com': true,
        })
      },
    },
    'client side': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button @click="send" />
          </template>

          <script>
          export default {
            methods: {
              async send() {
                await this.$mail.send({
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
      },
      options: { message: { to: 'johndoe@gmail.com' }, smtp: { port: 3001 } },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')

        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await button.click()

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.to).toEqual('johndoe@gmail.com')
      },
    },
    'config by index': {
      files: {
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
            config: 1,
          }),
        }
        </script>

      `,
      },
      options: {
        message: [{ to: 'foo@bar.com' }, { to: 'johndoe@gmail.com' }],
        smtp: { port: 3001 },
      },
      async test() {
        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.to).toEqual('johndoe@gmail.com')
      },
    },
    'config by name': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send({
              config: 'foo',
              from: 'a@b.de',
              subject: 'Incredible',
              text: 'This is an incredible test message',
            }),
          }
          </script>

        `,
      },
      options: {
        message: [
          { to: 'foo@bar.com' },
          { name: 'foo', to: 'johndoe@gmail.com' },
        ],
        smtp: { port: 3001 },
      },
      async test() {
        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.to).toEqual('johndoe@gmail.com')
      },
    },
    'config invalid index': {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            asyncData(context) {
              return context.$mail.send({ config: 10 })
            },
          }
          </script>

        `,
      },
      options: {
        message: [{ to: 'foo@bar.com' }],
        smtp: {},
      },
      test: async () => {
        let errorMessage
        try {
          await axios.post('http://localhost:3000')
        } catch (error) {
          errorMessage = error.response.data.message
        }
        expect(errorMessage).toEqual('Message config not found at index 10.')
      },
    },
    'config name not found': {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            asyncData(context) {
              return context.$mail.send({ config: 'foo' })
            },
          }
          </script>

        `,
      },
      options: { message: [{ to: 'foo@bar.com' }], smtp: {} },
      test: async () => {
        let errorMessage
        try {
          await axios.post('http://localhost:3000')
        } catch (error) {
          errorMessage = error.response.data.message
        }
        expect(errorMessage).toEqual(
          "Message config with name 'foo' not found."
        )
      },
    },
    'no message configs': {
      error: 'You have to provide at least one config.',
      options: { smtp: {} },
    },
    'no recipients': {
      error: 'You have to provide to/cc/bcc in all configs.',
      options: { message: {}, smtp: {} },
    },
    'no smtp config': {
      error: 'SMTP config is missing.',
    },
    nuxt3: {
      files: {
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
      },
      nuxtVersion: 3,
      options: {
        message: { to: 'johndoe@gmail.com' },
        smtp: { port: 3001 },
      },
      async test() {
        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.to).toEqual('johndoe@gmail.com')
      },
    },
    'nuxt3: client side': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button @click="send" />
          </template>

          <script setup>
          const { $mail } = useNuxtApp()

          const send = () => $mail.send({
            from: 'a@b.de',
            subject: 'Incredible',
            text: 'This is an incredible test message',
            to: 'foo@bar.de',
          })
          </script>

        `,
      },
      nuxtVersion: 3,
      options: { message: { to: 'johndoe@gmail.com' }, smtp: { port: 3001 } },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')

        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await button.click()

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.to).toEqual('johndoe@gmail.com')
      },
    },
    'to, cc and bcc': {
      files: {
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
            }),
          }
          </script>

        `,
      },
      options: {
        message: {
          bcc: 'bcc@gmail.com',
          cc: 'cc@gmail.com',
          to: 'to@gmail.com',
        },
        smtp: { port: 3001 },
      },
      async test() {
        const waiter = this.mailServer.captureOne('to@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.to).toEqual('to@gmail.com')
        expect(email.email.headers.cc).toEqual('cc@gmail.com')
        expect(email.email.receivers).toEqual({
          'bcc@gmail.com': true,
          'cc@gmail.com': true,
          'to@gmail.com': true,
        })
      },
    },
    valid: {
      files: {
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
      },
      options: {
        message: { to: 'johndoe@gmail.com' },
        smtp: { port: 3001 },
      },
      async test() {
        const waiter = this.mailServer.captureOne('johndoe@gmail.com')
        await axios.get('http://localhost:3000')

        const email = await waiter
        expect(email.email.body).toEqual('This is an incredible test message')
        expect(email.email.headers.subject).toEqual('Incredible')
        expect(email.email.headers.from).toEqual('a@b.de')
        expect(email.email.headers.to).toEqual('johndoe@gmail.com')
      },
    },
  },
  [
    testerPluginTmpDir(),
    testerPluginPuppeteer(),
    {
      before: async () => {
        await fs.outputFile(
          P.join('node_modules', '.cache', 'tester', 'nuxt2', 'package.json'),
          JSON.stringify({})
        )

        const spinner = ora('Installing Nuxt 2').start()
        await execa.command('yarn add nuxt@^2', {
          cwd: P.join('node_modules', '.cache', 'tester', 'nuxt2'),
        })
        spinner.stop()
      },
    },
    {
      async after() {
        await this.mailServer.stop()
      },
      before() {
        this.mailServer = smtpTester.init(3001)
      },
    },
    {
      transform: config => {
        config.nuxtVersion = config.nuxtVersion || 2
        config.options = config.options || {}
        config.test = config.test || (() => {})

        return async function () {
          await outputFiles({
            'package.json': JSON.stringify({ type: 'module' }),
            ...config.files,
          })
          if (config.nuxtVersion === 3) {
            // Loads package.json of nuxt, nuxt3 or nuxt-edge from cwd
            // Does not work with symlink (Cannot read property send of undefined)
            const nuxt = await loadNuxt({
              config: {
                build: { quiet: true },
                modules: [[self, config.options]],
              },
            })
            await buildNuxt(nuxt)

            const childProcess = execa.command(
              `node ${P.join('.output', 'server', 'index.mjs')}`,
              { all: true }
            )
            await pEvent(childProcess.all, 'data')
            try {
              await config.test.call(this)
            } finally {
              await kill(childProcess.pid)
            }
          } else {
            // Loads @nuxt/vue-app from cwd
            await fs.symlink(
              P.join(
                '..',
                'node_modules',
                '.cache',
                'tester',
                'nuxt2',
                'node_modules'
              ),
              'node_modules'
            )

            const nuxtImport = await import(
              `./${P.relative(
                P.dirname(fileURLToPath(import.meta.url)),
                './node_modules/nuxt/dist/nuxt.js'
              )
                .split(P.sep)
                .join('/')}`
            )

            const Nuxt = nuxtImport.Nuxt

            const Builder = nuxtImport.Builder

            const nuxt = new Nuxt({
              dev: false,
              modules: [packageName`@nuxtjs/axios`, [self, config.options]],
              telemetry: false,
            })
            if (config.error) {
              await expect(new Builder(nuxt).build()).rejects.toThrow(
                config.error
              )
            } else {
              await new Builder(nuxt).build()
              await nuxt.listen()
              try {
                await config.test.call(this)
              } finally {
                await nuxt.close()
              }
            }
          }
        }
      },
    },
  ]
)
