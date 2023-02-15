import { endent, omit } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginNuxtConfig from '@dword-design/tester-plugin-nuxt-config'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import smtpTester from 'smtp-tester'

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
    composable: {
      files: {
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
    'nuxt3 error': {
      files: {
        'pages/index.vue': endent`
          <script setup>
          const mail = useMail()
          
          await mail.send({ config: 10 })
          </script>

        `,
      },
      nuxtVersion: 3,
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
    {
      transform: config => {
        config.nuxtVersion = config.nuxtVersion || 2

        return {
          ...(config |> omit(['options'])),
          config: {
            modules: [
              ...(config.nuxtVersion === 2 ? [packageName`@nuxtjs/axios`] : []),
              [self, config.options],
            ],
          },
        }
      },
    },
    testerPluginNuxtConfig(),
    testerPluginPuppeteer(),
    {
      async after() {
        await this.mailServer.stop()
      },
      before() {
        this.mailServer = smtpTester.init(3001)
      },
    },
  ]
)
