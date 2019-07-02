const config = require('../config')
const puppeteer = require('puppeteer')
const {send} = require('../slack/communication')
const {ActionCancelled} = require('../../remote_input_service')

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
            "type": "mrkdwn",
            "text": `*${values[index]}*`
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
    return true
  } catch (ex) {
    send(ex.message)

    if (ex instanceof ActionCancelled) {
      return true
    }
  }

  return false
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

    const basicInfo = await serializeTable(table)

    await clickOn('Pakiety i promocje', {page})

    await page.waitForXPath("//table[contains(., 'Pozostało jeszcze')]", {visible: true})
    const [table2] = await page.$x("//table[contains(., 'Pozostało jeszcze')]")

    const limitsToUse = (await serializeTable(table2)).reduce((res, value, index, tds) => {
      if (index % 3 === 0) {
        res.push(tds[index])
        res.push(`${tds[index + 1]}, ${tds[index + 2]}`)
      }
      return res
    },[])

    await page.browser().close()
    return basicInfo.concat(limitsToUse)
  } catch (ex) {
    if (page) {
      await takeScreenshot(page)
      await page.browser().close()
    }
    throw ex
  }
}

async function takeScreenshot(page) {
  const path = `public/screenshot-${Math.random()}.png`
  await page.screenshot({path})
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
