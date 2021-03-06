import { endent, mapValues } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginNodemailerMock from '@dword-design/tester-plugin-nodemailer-mock'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
import axios from 'axios'
import packageName from 'depcheck-package-name'
import nodemailerMock from 'nodemailer-mock'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

const runTest = config => {
  config = { options: {}, test: () => {}, ...config }

  return function () {
    return withLocalTmpDir(async () => {
      await outputFiles({
        'modules/module.js': endent`
          import proxyquire from '${packageName`@dword-design/proxyquire`}'
          import nodemailerMock from '${packageName`nodemailer-mock`}'

          export default proxyquire('./../../src', {
            nodemailer: nodemailerMock
          })
          
        `,
        ...config.files,
      })

      const nuxt = new Nuxt({
        createRequire: 'native',
        dev: false,
        modules: [
          packageName`@nuxtjs/axios`,
          ['~/modules/module', config.options],
        ],
      })
      if (config.error) {
        await expect(new Builder(nuxt).build()).rejects.toThrow(config.error)
      } else {
        await new Builder(nuxt).build()
        await nuxt.listen()
        try {
          await config.test.call(this)
        } finally {
          await nuxt.close()
        }
      }
    })
  }
}

export default tester(
  {
    bcc: {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            async mounted() {
              console.log('sending mail')
              try {
                await this.$mail.send({
                  from: 'John Doe',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
              } catch (error) {
                console.log(error)
              }
              console.log('mail sent')
            },
            render: h => <div />,
          }
          </script>
        `,
      },
      options: { message: { bcc: 'johndoe@gmail.com' }, smtp: {} },
      async test() {
        await this.page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 5000))
        expect(nodemailerMock.mock.getSentMail()).toEqual([
          {
            bcc: 'johndoe@gmail.com',
            from: 'John Doe',
            subject: 'Incredible',
            text: 'This is an incredible test message',
          },
        ])
      },
    },
    cc: {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            async mounted() {
              console.log('sending mail')
              try {
                await this.$mail.send({
                  from: 'John Doe',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
              } catch (error) {
                console.log(error)
              }
              console.log('mail sent')
            },
            render: h => <div />,
          }
          </script>
        `,
      },
      options: { message: { cc: 'johndoe@gmail.com' }, smtp: {} },
      async test() {
        await this.page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 5000))
        expect(nodemailerMock.mock.getSentMail()).toEqual([
          {
            cc: 'johndoe@gmail.com',
            from: 'John Doe',
            subject: 'Incredible',
            text: 'This is an incredible test message',
          },
        ])
      },
    },
    'cc and bcc': {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            async mounted() {
              console.log('sending mail')
              try {
                await this.$mail.send({
                  from: 'John Doe',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
              } catch (error) {
                console.log(error)
              }
              console.log('mail sent')
            },
            render: h => <div />,
          }
          </script>
        `,
      },
      options: {
        message: { bcc: 'bar@gmail.com', cc: 'foo@gmail.com' },
        smtp: {},
      },
      async test() {
        await this.page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 5000))
        expect(nodemailerMock.mock.getSentMail()).toEqual([
          {
            bcc: 'bar@gmail.com',
            cc: 'foo@gmail.com',
            from: 'John Doe',
            subject: 'Incredible',
            text: 'This is an incredible test message',
          },
        ])
      },
    },
    'config by index': {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            async mounted() {
              console.log('sending mail')
              try {
                await this.$mail.send({
                  from: 'John Doe',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                  config: 1,
                })
              } catch (error) {
                console.log(error)
              }
              console.log('mail sent')
            },
            render: h => <div />,
          }
          </script>

        `,
      },
      options: {
        message: [{ to: 'foo@bar.com' }, { to: 'johndoe@gmail.com' }],
        smtp: {},
      },
      async test() {
        await this.page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 5000))
        expect(nodemailerMock.mock.getSentMail()).toEqual([
          {
            from: 'John Doe',
            subject: 'Incredible',
            text: 'This is an incredible test message',
            to: 'johndoe@gmail.com',
          },
        ])
      },
    },
    'config by name': {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            async mounted() {
              console.log('sending mail')
              try {
                await this.$mail.send({
                  config: 'foo',
                  from: 'John Doe',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
              } catch (error) {
                console.log(error)
              }
              console.log('mail sent')
            },
            render: h => <div />,
          }
          </script>

        `,
      },
      options: {
        message: [
          { to: 'foo@bar.com' },
          { name: 'foo', to: 'johndoe@gmail.com' },
        ],
        smtp: {},
      },
      async test() {
        await this.page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 5000))
        expect(nodemailerMock.mock.getSentMail()).toEqual([
          {
            from: 'John Doe',
            subject: 'Incredible',
            text: 'This is an incredible test message',
            to: 'johndoe@gmail.com',
          },
        ])
      },
    },
    'config invalid index': {
      options: {
        message: [{ to: 'foo@bar.com' }],
        smtp: {},
      },
      test: async () => {
        let errorMessage
        try {
          await axios.post('http://localhost:3000/mail/send', { config: 10 })
        } catch (error) {
          errorMessage = error.response.data
        }
        expect(errorMessage).toEqual('Message config not found at index 10.')
      },
    },
    'config name not found': {
      options: { message: [{ to: 'foo@bar.com' }], smtp: {} },
      test: async () => {
        let errorMessage
        try {
          await axios.post('http://localhost:3000/mail/send', { config: 'foo' })
        } catch (error) {
          errorMessage = error.response.data
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
    'to, cc and bcc': {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            async mounted() {
              console.log('sending mail')
              try {
                await this.$mail.send({
                  from: 'John Doe',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                })
              } catch (error) {
                console.log(error)
              }
              console.log('mail sent')
            },
            render: h => <div />,
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
        smtp: {},
      },
      async test() {
        await this.page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 5000))
        expect(nodemailerMock.mock.getSentMail()).toEqual([
          {
            bcc: 'bcc@gmail.com',
            cc: 'cc@gmail.com',
            from: 'John Doe',
            subject: 'Incredible',
            text: 'This is an incredible test message',
            to: 'to@gmail.com',
          },
        ])
      },
    },
    valid: {
      files: {
        'pages/index.vue': endent`
          <script>
          export default {
            async mounted() {
              console.log('sending mail')
              try {
                await this.$mail.send({
                  from: 'John Doe',
                  subject: 'Incredible',
                  text: 'This is an incredible test message',
                  to: 'foo@bar.de',
                })
              } catch (error) {
                console.log(error)
              }
              console.log('mail sent')
            },
            render: h => <div />,
          }
          </script>

        `,
      },
      options: { message: { to: 'johndoe@gmail.com' }, smtp: {} },
      async test() {
        await this.page.goto('http://localhost:3000')
        await new Promise(resolve => setTimeout(resolve, 5000))
        expect(nodemailerMock.mock.getSentMail()).toEqual([
          {
            from: 'John Doe',
            subject: 'Incredible',
            text: 'This is an incredible test message',
            to: 'johndoe@gmail.com',
          },
        ])
      },
    },
  } |> mapValues(runTest),
  [testerPluginPuppeteer(), testerPluginNodemailerMock()]
)
