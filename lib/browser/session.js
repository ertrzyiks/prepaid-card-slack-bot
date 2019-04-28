const config = require('../config')
const puppeteer = require('puppeteer')
const {send} = require('../slack/communication')

exports.go = async function go({remoteInput}) {
  try {
    const values = await getData({remoteInput})

    const blocks = [{
      "type": "context",
      "elements": [
        {
          "type": "plain_text",
          "text": "Dane pobrane z plus online"
        }
      ]
    }, {
      "type": "section",
      "fields": values.reduce((res, value, index) => {
        if (index % 2 === 0) {
          res.push({
            "type": "plain_text",
            "text": values[index]
          })

          res.push({
            "type": "plain_text",
            "text": values[index + 1]
          })
        }
        return res
      }, [])
    }]

    send('Szczegóły konta', {blocks})
  } catch (ex) {
    send(ex.message)
  }
}

async function getData({remoteInput}) {
  const {triggerId, requestId} = await remoteInput.anyoneAround()

  let page, password

  try {
    [page, password] = await Promise.all([
      (async () => {
        page = await openPage()
        await start(page)
        await logIn(page)
        return page
      })(),
      remoteInput.askForCode({triggerId, requestId})
    ])

    await passSessionPassword(page, password)
    await switchToAnotherAccount(page)

    await page.waitForXPath("//table[contains(., 'Dostępne środki')]", {visible: true})
    const [table] = await page.$x("//table[contains(., 'Dostępne środki')]")

    const values = await serializeTable(table)
    await page.browser().close()
    return values
  } catch (ex) {
    if (page) {
      const path = `public/screenshot-${Math.random()}.png`
      await page.screenshot({path})
      await page.browser().close()
      send('Failure', {blocks: [
        {
          "type": "image",
          "title": {
            "type": "plain_text",
            "text": "Screenshot of failure",
            "emoji": true
          },
          "image_url": `http://plus-bot.ertrzyiks.me/${path}`,
          "alt_text": "Screenshot of failure"
        }
      ]})
    }
    throw ex
  }
}

async function openPage() {
  const browser = await puppeteer.launch({headless: true})
  return await browser.newPage()
}

async function start(page) {
  await page.goto('https://ssl.plusgsm.pl/ebok-web/basic/loginStep1.action')

  // GDPR modal
  await page.waitForXPath('//a[contains(., "Tak, przejdź do portalu")]', {visible: true, timeout: 10000})

  const [button] = await page.$x("//a[contains(., 'Tak, przejdź do portalu')]")
  if (button) {
    await button.click()
  }
}

async function logIn(page) {
  await sleep(3000)
  await page.type('#loginform [type="text"]', config.user.login)
  await page.type('#loginform [type="password"]', config.user.password)
  await page.click('#loginform [type="submit"]')
}

async function passSessionPassword(page, password) {
  await page.type('#loginform [type="password"]', password)
  await page.click('#loginform [type="submit"]')

}

async function clickOn(label, {page}) {
  await page.waitForXPath(`//a[contains(., '${label}')]`, {visible: true})

  const [button] = await page.$x(`//a[contains(., '${label}')]`)
  if (button) {
    await button.click()
  }
}

async function switchToAnotherAccount(page) {
  await page.waitForXPath("//*[@class='main']//a[contains(., 'Zmień')]", {visible: true})
  const [button] = await page.$x("//*[@class='main']//a[contains(., 'Zmień')]")
  if (button) {
    await button.click()
  }

  await clickOn('Zaprzyjaźnione konta', {page})
  await clickOn('Zarządzaj', {page})
}

async function serializeTable(table) {
  const tds = await table.$$('td')

  return await Promise.all(tds.map(async (td) => {
    const textContent = await td.getProperty('textContent')
    const text = await textContent.jsonValue()
    return text.trim()
  }))
}

function sleep(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
