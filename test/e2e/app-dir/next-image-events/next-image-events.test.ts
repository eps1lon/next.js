import { nextTestSetup } from 'e2e-utils'
import { retry } from 'next-test-utils'

describe('next-image-events', () => {
  const { next } = nextTestSetup({
    files: __dirname,
  })

  it('should not call onLoad multiple times', async () => {
    const imageRequests = []
    const browser = await next.browser('/fulfilled', {
      beforePageLoad(page) {
        page.on('request', (request) => {
          if (request.resourceType() === 'image') {
            imageRequests.push(request.url())
          }
        })
      },
    })

    let logsIdx = 0
    await retry(async () => {
      const logs = await browser.log()
      expect(
        logs.slice(logsIdx).filter(({ source }) => source === 'error')
      ).toEqual([
        {
          source: 'error',
          message: 'hydrated image load',
        },
      ])
      logsIdx = logs.length
    })
    expect(imageRequests).toEqual([expect.stringContaining('test')])
    imageRequests.length = 0

    await browser.locator(':text("Show Client image")').click()

    await retry(async () => {
      const logs = await browser.log()
      expect(
        logs.slice(logsIdx).filter(({ source }) => source === 'error')
      ).toEqual([
        {
          source: 'error',
          message: 'client rendered image load',
        },
      ])
      logsIdx = logs.length
    })
    expect(imageRequests).toEqual([expect.stringContaining('test')])
    imageRequests.length = 0

    await browser.locator(':text("rerender Page")').click()

    const logs = await browser.log()
    expect(
      logs.slice(logsIdx).filter(({ source }) => source === 'error')
    ).toEqual([])
    expect(imageRequests).toEqual([])
    imageRequests.length = 0
  })

  it('should not infinitely retry on error', async () => {
    const imageRequests = []
    const browser = await next.browser('/rejected', {
      beforePageLoad(page) {
        page.on('request', (request) => {
          if (request.resourceType() === 'image') {
            imageRequests.push(request.url())
          }
        })
      },
    })

    let logsIdx = 0
    await retry(async () => {
      const logs = await browser.log()
      expect(
        logs.slice(logsIdx).filter(({ source }) => source === 'error')
      ).toEqual([
        {
          source: 'error',
          message:
            'Failed to load resource: the server responded with a status of 400 (Bad Request)',
        },
        // Next.js retries once to trigger onError on SSRed images.
        {
          source: 'error',
          message:
            'Failed to load resource: the server responded with a status of 400 (Bad Request)',
        },
        {
          source: 'error',
          message: 'hydrated image error',
        },
      ])
      logsIdx = logs.length
    })
    expect(imageRequests).toEqual([
      expect.stringContaining('will-never-exist'),
      expect.stringContaining('will-never-exist'),
    ])
    imageRequests.length = 0

    await browser.locator(':text("Show Client image")').click()

    await retry(async () => {
      const logs = await browser.log()
      expect(
        logs.slice(logsIdx).filter(({ source }) => source === 'error')
      ).toEqual([
        {
          source: 'error',
          message:
            'Failed to load resource: the server responded with a status of 400 (Bad Request)',
        },
        {
          source: 'error',
          message: 'client rendered image error',
        },
      ])
      logsIdx = logs.length
    })
    expect(imageRequests).toEqual([
      expect.stringContaining('still-doesnt-exist'),
    ])
    imageRequests.length = 0

    await browser.locator(':text("rerender Page")').click()

    const logs = await browser.log()
    expect(
      logs.slice(logsIdx).filter(({ source }) => source === 'error')
    ).toEqual([])
    expect(imageRequests).toEqual([])
    imageRequests.length = 0
  })
})
