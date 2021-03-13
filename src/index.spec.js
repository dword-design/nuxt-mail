import { endent, mapValues } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginNodemailerMock from '@dword-design/tester/dist/plugin-nodemailer-mock'
import testerPluginPuppeteer from '@dword-design/tester-plugin-puppeteer'
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
          await this.page.goto('http://localhost:3000')
          await config.test()
        } finally {
          await nuxt.close()
        }
      }
    })
  }
}

export default tester(
  {
    'no smtp config': {
      error: 'SMTP config is missing.',
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
                  to: 'johndoe@gmail.com',
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
      options: { smtp: {} },
      test: async () => {
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
