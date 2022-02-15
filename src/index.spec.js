import {
  endent,
  find,
  identity,
  includes,
  keys,
  map,
  pick,
  pickBy,
} from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import { simpleParser } from 'mailparser'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import { SMTPServer } from 'smtp-server'

const testerPluginEmail = options => {
  options = { mapEmail: x => x, port: 3001, ...options }

  return {
    after() {
      this.smtpServer.close()
    },
    before() {
      this.smtpServer = new SMTPServer({
        authOptional: true,
        onData: async (stream, session, callback) => {
          try {
            this.sentEmails.push(
              options.mapEmail({ email: await simpleParser(stream), session })
            )
          } finally {
            callback()
          }
        },
      })
      this.smtpServer.listen(options.port)
    },
    beforeEach() {
      this.sentEmails = []
    },
  }
}

const waitForError = (page, errorMessage) =>
  new Promise(resolve => {
    const handler = async msg => {
      const messages = await Promise.all(
        msg.args()
          |> map(arg =>
            arg
              .executionContext()
              .evaluate(
                _arg => (_arg instanceof Error ? _arg.message : undefined),
                arg
              )
          )
      )
      if (errorMessage && messages |> includes(errorMessage)) {
        page.off('console', handler)
        resolve(errorMessage)
      } else if (!errorMessage) {
        const message = messages |> find(_message => !!_message)
        if (message) {
          page.off('console', handler)
          resolve(message)
        }
      }
    }
    page.on('console', handler)
  })

export default tester(
  {
    'client side: bcc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            data: () => ({
              sent: false,
            }),
            methods: {
              async send() {
                await this.$mail.send('contact', {
                  from: 'john@doe.de',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
                this.sent = true
              },
            },
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: { bcc: 'johndoe@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('button.sent')
        expect(this.sentEmails).toEqual([
          {
            from: 'john@doe.de',
            rcptTo: ['johndoe@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
          },
        ])
      },
    },
    'client side: cc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            data: () => ({
              sent: false,
            }),
            methods: {
              async send() {
                await this.$mail.send('contact', {
                  from: 'john@doe.de',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
                this.sent = true
              },
            },
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: { cc: 'johndoe@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('button.sent')
        expect(this.sentEmails).toEqual([
          {
            cc: 'johndoe@gmail.com',
            from: 'john@doe.de',
            rcptTo: ['johndoe@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
          },
        ])
      },
    },
    'client side: cc and bcc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            data: () => ({
              sent: false,
            }),
            methods: {
              async send() {
                await this.$mail.send('contact', {
                  from: 'john@doe.de',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
                this.sent = true
              },
            },
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: { bcc: 'bar@gmail.com', cc: 'foo@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('button.sent')
        expect(this.sentEmails).toEqual([
          {
            cc: 'foo@gmail.com',
            from: 'john@doe.de',
            rcptTo: ['foo@gmail.com', 'bar@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
          },
        ])
      },
    },
    'client side: config by name': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            data: () => ({
              sent: false,
            }),
            methods: {
              async send() {
                await this.$mail.send('foo', {
                  from: 'john@doe.de',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                  config: 'foo',
                })
                this.sent = true
              },
            },
          }
          </script>

        `,
      },
      options: {
        configs: {
          bar: { to: 'foo@bar.com' },
          foo: { to: 'johndoe@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('button.sent')
        expect(this.sentEmails).toEqual([
          {
            from: 'john@doe.de',
            rcptTo: ['johndoe@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
            to: 'johndoe@gmail.com',
          },
        ])
      },
    },
    'client side: config name not found': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            methods: {
              async send() {
                return this.$mail.send('foo')
              },
            },
          }
          </script>

        `,
      },
      options: {
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await waitForError(
          this.page,
          "Message config with name 'foo' not found."
        )
        expect(this.sentEmails).toEqual([])
      },
    },
    'client side: no config': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            methods: {
              async send() {
                await this.$mail.send()
              },
            },
          }
          </script>

        `,
      },
      options: {
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await waitForError(
          this.page,
          'You have to specify a config in your message.'
        )
        expect(this.sentEmails).toEqual([])
      },
    },
    'client side: only config': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            data: () => ({
              sent: false,
            }),
            methods: {
              async send() {
                await this.$mail.send('contact')
                this.sent = true
              },
            },
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: {
            from: 'foo@bar.de',
            text: 'foo bar',
            to: 'bar@baz.de',
          },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('button.sent')
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['bar@baz.de'],
            text: 'foo bar\n',
            to: 'bar@baz.de',
          },
        ])
      },
    },
    'client side: to, cc and bcc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            data: () => ({
              sent: false,
            }),
            methods: {
              async send() {
                await this.$mail.send('contact', {
                  from: 'john@doe.de',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
                this.sent = true
              },
            },
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: {
            bcc: 'bcc@gmail.com',
            cc: 'cc@gmail.com',
            to: 'to@gmail.com',
          },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('button.sent')
        expect(this.sentEmails).toEqual([
          {
            cc: 'cc@gmail.com',
            from: 'john@doe.de',
            rcptTo: ['to@gmail.com', 'cc@gmail.com', 'bcc@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
            to: 'to@gmail.com',
          },
        ])
      },
    },
    'client side: valid': {
      files: {
        'pages/index.vue': endent`
          <template>
            <button :class="{ sent }" @click="send" />
          </template>

          <script>
          export default {
            data: () => ({
              sent: false,
            }),
            methods: {
              async send() {
                await this.$mail.send('contact', {
                  from: 'john@doe.de',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                  to: 'foo@bar.de',
                })
                this.sent = true
              },
            },
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: { to: 'johndoe@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await this.page.goto('http://localhost:3000')

        const button = await this.page.waitForSelector('button')
        await button.click()
        await this.page.waitForSelector('button.sent')
        expect(this.sentEmails).toEqual([
          {
            from: 'john@doe.de',
            rcptTo: ['johndoe@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
            to: 'johndoe@gmail.com',
          },
        ])
      },
    },
    'config: array': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact'),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: [
            {
              from: 'foo@bar.de',
              rcptTo: ['foo@bar.de'],
              text: 'This is an incredible test message\n',
              to: 'foo@bar.de',
            },
            {
              from: 'bar@baz.de',
              rcptTo: ['bar@baz.de'],
              text: 'This is another incredible test message\n',
              to: 'bar@baz.de',
            },
          ],
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['foo@bar.de'],
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
          {
            from: 'bar@baz.de',
            rcptTo: ['bar@baz.de'],
            text: 'This is another incredible test message\n',
            to: 'bar@baz.de',
          },
        ])
      },
    },
    'config: function': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', { to: 'a@b.de' }),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: params => ({
            from: 'foo@bar.de',
            text: 'This is an incredible test message',
            to: params.to,
          }),
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['a@b.de'],
            text: 'This is an incredible test message\n',
            to: 'a@b.de',
          },
        ])
      },
    },
    'config: function returning an array': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', { to: 'a@b.de' }),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: params => [
            {
              from: 'foo@bar.de',
              rcptTo: [params.to],
              text: 'This is an incredible test message\n',
              to: params.to,
            },
            {
              from: 'bar@baz.de',
              rcptTo: [params.to],
              text: 'This is another incredible test message\n',
              to: params.to,
            },
          ],
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails.length).toEqual(2)
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['a@b.de'],
            text: 'This is an incredible test message\n',
            to: 'a@b.de',
          },
          {
            from: 'bar@baz.de',
            rcptTo: ['a@b.de'],
            text: 'This is another incredible test message\n',
            to: 'a@b.de',
          },
        ])
      },
    },
    'no smtp config': {
      error: 'SMTP config is missing.',
    },
    'send: multiple messages': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send([
              {
                from: 'foo@bar.de',
                rcptTo: ['foo@bar.de'],
                text: 'This is an incredible test message',
                to: 'foo@bar.de',
              },
              {
                from: 'bar@baz.de',
                rcptTo: ['bar@baz.de'],
                text: 'This is another incredible test message',
                to: 'bar@baz.de',
              },
            ]),
          }
          </script>

        `,
      },
      options: {
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['foo@bar.de'],
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
          {
            from: 'bar@baz.de',
            rcptTo: ['bar@baz.de'],
            text: 'This is another incredible test message\n',
            to: 'bar@baz.de',
          },
        ])
      },
    },
    'send: multiple messages with config array': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', [
              {
                from: 'foo@bar.de',
                rcptTo: ['foo@bar.de'],
                text: 'This is an incredible test message',
                to: 'foo@bar.de',
              },
              {
                from: 'bar@baz.de',
                rcptTo: ['bar@baz.de'],
                text: 'This is another incredible test message',
                to: 'bar@baz.de',
              },
            ]),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: [{ subject: 'foo' }, { subject: 'bar' }],
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['foo@bar.de'],
            subject: 'foo',
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
          {
            from: 'bar@baz.de',
            rcptTo: ['bar@baz.de'],
            subject: 'foo',
            text: 'This is another incredible test message\n',
            to: 'bar@baz.de',
          },
          {
            from: 'foo@bar.de',
            rcptTo: ['foo@bar.de'],
            subject: 'bar',
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
          {
            from: 'bar@baz.de',
            rcptTo: ['bar@baz.de'],
            subject: 'bar',
            text: 'This is another incredible test message\n',
            to: 'bar@baz.de',
          },
        ])
      },
    },
    'send: multiple messages with config function': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', [
              {
                from: 'foo@bar.de',
                rcptTo: ['foo@bar.de'],
                text: 'This is an incredible test message',
                to: 'foo@bar.de',
              },
              {
                from: 'bar@baz.de',
                rcptTo: ['bar@baz.de'],
                text: 'This is another incredible test message',
                to: 'bar@baz.de',
              },
            ]),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: messages =>
            messages.map(message => ({ ...message, subject: 'foo' })),
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['foo@bar.de'],
            subject: 'foo',
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
          {
            from: 'bar@baz.de',
            rcptTo: ['bar@baz.de'],
            subject: 'foo',
            text: 'This is another incredible test message\n',
            to: 'bar@baz.de',
          },
        ])
      },
    },
    'send: multiple messages with config object': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', [
              {
                from: 'foo@bar.de',
                rcptTo: ['foo@bar.de'],
                text: 'This is an incredible test message',
                to: 'foo@bar.de',
              },
              {
                from: 'bar@baz.de',
                rcptTo: ['bar@baz.de'],
                text: 'This is another incredible test message',
                to: 'bar@baz.de',
              },
            ]),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: {
            subject: 'foo',
          },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'foo@bar.de',
            rcptTo: ['foo@bar.de'],
            subject: 'foo',
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
          {
            from: 'bar@baz.de',
            rcptTo: ['bar@baz.de'],
            subject: 'foo',
            text: 'This is another incredible test message\n',
            to: 'bar@baz.de',
          },
        ])
      },
    },
    'server side: bcc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', {
              from: 'john@doe.de',
              subject: 'Incredible',
              text: 'This is an incredible test message',
            }),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: { bcc: 'johndoe@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'john@doe.de',
            rcptTo: ['johndoe@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
          },
        ])
      },
    },
    'server side: cc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', {
              from: 'john@doe.de',
              subject: 'Incredible',
              text: 'This is an incredible test message',
            }),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: { cc: 'johndoe@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            cc: 'johndoe@gmail.com',
            from: 'john@doe.de',
            rcptTo: ['johndoe@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
          },
        ])
      },
    },
    'server side: cc and bcc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', {
              from: 'john@doe.de',
              subject: 'Incredible',
              text: 'This is an incredible test message',
            }),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: { bcc: 'bar@gmail.com', cc: 'foo@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            cc: 'foo@gmail.com',
            from: 'john@doe.de',
            rcptTo: ['foo@gmail.com', 'bar@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
          },
        ])
      },
    },
    'server side: config': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('foo', {
              from: 'john@doe.de',
              subject: 'Incredible',
              text: 'This is an incredible test message',
            }),
          }
          </script>

        `,
      },
      options: {
        configs: {
          bar: { to: 'foo@bar.com' },
          foo: { to: 'johndoe@gmail.com' },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'john@doe.de',
            rcptTo: ['johndoe@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
            to: 'johndoe@gmail.com',
          },
        ])
      },
    },
    'server side: config name not found': {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            asyncData: context => context.$mail.send('foo'),
          }
          </script>

        `,
      },
      options: {
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
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
    'server side: only config': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact'),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: {
            from: 'john@doe.de',
            text: 'This is an incredible test message',
            to: 'foo@bar.de',
          },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'john@doe.de',
            rcptTo: ['foo@bar.de'],
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
        ])
      },
    },
    'server side: to, cc and bcc': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send('contact', {
              config: 0,
              from: 'john@doe.de',
              subject: 'Incredible',
              text: 'This is an incredible test message',
            }),
          }
          </script>

        `,
      },
      options: {
        configs: {
          contact: {
            bcc: 'bcc@gmail.com',
            cc: 'cc@gmail.com',
            to: 'to@gmail.com',
          },
        },
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            cc: 'cc@gmail.com',
            from: 'john@doe.de',
            rcptTo: ['to@gmail.com', 'cc@gmail.com', 'bcc@gmail.com'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
            to: 'to@gmail.com',
          },
        ])
      },
    },
    'server side: valid': {
      files: {
        'pages/index.vue': endent`
          <template>
            <div />
          </template>

          <script>
          export default {
            asyncData: context => context.$mail.send({
              from: 'john@doe.de',
              subject: 'Incredible',
              text: 'This is an incredible test message',
              to: 'foo@bar.de',
            }),
          }
          </script>

        `,
      },
      options: {
        smtp: {
          port: 3001,
          tls: {
            rejectUnauthorized: false,
          },
        },
      },
      async test() {
        await axios.get('http://localhost:3000')
        expect(this.sentEmails).toEqual([
          {
            from: 'john@doe.de',
            rcptTo: ['foo@bar.de'],
            subject: 'Incredible',
            text: 'This is an incredible test message\n',
            to: 'foo@bar.de',
          },
        ])
      },
    },
  },
  [
    {
      transform: test => {
        test = { options: {}, test: () => {}, ...test }

        return async function () {
          await outputFiles(test.files)

          const nuxt = new Nuxt({
            createRequire: 'native',
            dev: false,
            modules: [
              packageName`@nuxtjs/axios`,
              [require.resolve('../src'), test.options],
            ],
          })
          if (test.error) {
            await expect(new Builder(nuxt).build()).rejects.toThrow(test.error)
          } else {
            await new Builder(nuxt).build()
            await nuxt.listen()
            try {
              await test.test.call(this)
            } finally {
              await nuxt.close()
            }
          }
        }
      },
    },
    testerPluginPuppeteer(),
    testerPluginEmail({
      mapEmail: info =>
        ({
          cc: info.email.cc?.text,
          from: info.email.from?.text,
          rcptTo: info.session.envelope.rcptTo |> map('address'),
          to: info.email.to?.text,
          ...(info.email |> pick({ subject: true, text: true } |> keys)),
        } |> pickBy(identity)),
    }),
    testerPluginTmpDir(),
  ]
)
