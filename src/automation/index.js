const { stompToJson,
  jsonToStomp,
  modifyCashoutCoefficient,
  modifyBetAmount } = require('./stomp-parser');
const puppeteer = require('puppeteer-extra');

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
// const StealthPlugin = require('puppeteer-extra-plugin-stealth')
// puppeteer.use(StealthPlugin())
//
// // Add adblocker plugin to block all ads and trackers (saves bandwidth)
// const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
// puppeteer.use(AdblockerPlugin({ blockTrackers: true }))
//
//
const number = "08145358346";
const password = "Gwin@sportybet1";

(async () => {

  const browser = await puppeteer.launch({
    headless: false, args: [
      '--proxy-server=http://127.0.0.1:8080',
      '--ignore-certificate-errors',
      '--disable-web-security'
    ], defaultViewport: { width: 1366, height: 768 }, executablePath: "/opt/google/chrome/google-chrome", userDataDir: "/home/gwin/.config/google-chrome/"
  });
  const page = await browser.newPage();
  await page.setDefaultTimeout(500000)
  await page.goto('https://www.sportybet.com/ng/games?source=TopRibbon', { waitUntil: "domcontentloaded" })
  async function getBalance() {
    const balance = await page.$eval("#j_balance", el => el.textContent);
    console.log(balance)
    return balance
  }


  const cookies = await page.cookies();

  const isLoginavailable = cookies.find(cookie => cookie.name === "phone");

  if (!isLoginavailable) {
    const numberInput = await page.locator('input[name="phone"]').waitHandle();
    const passwordInput = await page.locator('input[name="psd"]').waitHandle();
    const submitButton = await page.locator('button[data-cms-key="log_in"]').waitHandle();

    if (passwordInput || numberInput) {
      await numberInput.type(number)
      await passwordInput.type(password)
      await submitButton.click();
    }
  }


  async function checkFor(selector) {
    try {
      await page.locator(selector).wait()
      console.log(`${selector} found`)
    } catch (err) {
      console.log(err)
    }
  }
  await checkFor("#j_balance")

  await getBalance()

  await checkFor("#games-lobby-wrapper");

  const enterGame = async () => {
    try {
      const frames = await page.frames();
      const targetFrame = frames.find(frame => frame.url().includes('//www.sportybet.com/ng/sportygames/lobby'));
      console.log(await targetFrame.url())
      const element = await targetFrame.locator('div[data-id="35"]').waitHandle();
      await element.click();
      console.log("Game entered successfully")
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (err) {
      console.log("Entering Game Error: " + err)
    }
  }

  await enterGame();



  // await isLoading();

  const iframeElement = await page.$('iframe[id="games-lobby"]');

  // Get the content of the iframe
  const gameFrame = await iframeElement.contentFrame();


  async function isLoading() {
    try {
      await gameFrame.waitForSelector("#app-init-loader-wrap", { hidden: true })
    } catch (err) {
      console.log("loading err: " + err);
    }
    console.log("Game Finished Loading")
  }

  await isLoading();

  await gameFrame.locator('div[data-cms-key="game_name"]');
  const name = await gameFrame.$eval('div[data-cms-key="game_name"]', el => el.textContent);
  console.log(await name);

  const checkIfModalAndClick = async () => {
    try {
      const modalOn = await gameFrame.locator("#__BVID__47___BV_modal_footer_ > button.btn.btn-primary").setTimeout(3000).waitHandle();
      await modalOn.click();
    } catch (err) {
      console.log("No modal found")
    }
  }
  await checkIfModalAndClick();

  async function getMouseCoordinates(x, y) {

    const frameRect = await iframeElement.boundingBox();
    const frameX = frameRect.x + x;
    const frameY = frameRect.y + y;
    return { x: frameX, y: frameY }

  }

  // Usage:
  const coordinates = await getMouseCoordinates(743, 490);
  console.log('Final coordinates:', coordinates);

  const notificationWs = new WebSocket('ws://localhost:8081');
  notificationWs.onmessage = async () => {
    console.log('⚡ Triggering instant cashout click');
    await page.mouse.click(coordinates.x, coordinates.y); // ✅ works on main page
    console.log('⚡ cashout clicked');
  };
  // Visual verification (adds red dot at click spot)
  // await gameFrame.evaluate((x, y) => {
  //   const marker = document.createElement('div');
  //   marker.style.position = 'fixed';
  //   marker.style.left = `${x - 5}px`;
  //   marker.style.top = `${y - 5}px`;
  //   marker.style.width = '10px';
  //   marker.style.height = '10px';
  //   marker.style.background = 'red';
  //   marker.style.zIndex = '99999';
  //   document.body.appendChild(marker);
  // }, 743, 490);
  //


  async function click() {
    try {
      await gameFrame.locator('div[data-cms-key="game_name"]');
      const name = await gameFrame.$eval('div[data-cms-key="game_name"]', el => el.textContent);
      console.log(await name);

      await gameFrame.waitForSelector(
        '#app > div > div > div > div:nth-child(2) > div.main-body > div.board-parent.mb-1 > div.sporty-hero-container.space > div.align-items-center.d-flex.flex-column.justify-content-center.power-up', { visible: true });
      console.log("Ready to click")

      await page.mouse.click(coordinates.x, coordinates.y); // ✅ works on main page
      console.log("🎯 Initial bet placed");

      await new Promise(r => setTimeout(r, 2000)); // let JS start sending request
      // STEP 2: Wait for the second button to appear
      console.log('⏳ Waiting for second button...');

      await gameFrame.waitForSelector(
        '#app > div > div > div > div:nth-child(2) > div.main-body > div.board-parent.mb-1 > div.align-items-center.d-flex.justify-content-center.multiplier > span'
        , { visible: true });
      console.log("span element now found")

      // await page.mouse.click(coordinates.x, coordinates.y); // ✅ click second button
      // console.log("🖱️ Cashout clicked");
    } catch (err) {
      console.log("clickErr: " + err);
    }
  }

  async function turboCashout() {
    await click();
  }






  let latestMultiplier = null;





  async function logRequestAndAutoClick() {
    try {
      console.log('⏳ Attaching to game frame...');
      const client = await gameFrame._client();
      await client.send('Network.enable');

      let gameSocketId = null;

      // Match the actual WebSocket URL from your logs
      client.on('Network.webSocketCreated', ({ requestId, url }) => {
        console.log(`🔌 WebSocket detected: ${url}`);
        if (url.includes('sporty-hero')) {
          console.log(`🕹️ Game WebSocket connected: ${url}`);
          gameSocketId = requestId;
        }
      });

      client.on('Network.webSocketFrameReceived', async ({ requestId, response }) => {
        if (!response.payloadData) return;
        try {
          const message = stompToJson(response.payloadData);
          console.log('📥 Incoming WebSocket message:', message);

          // Handle different message structures
          if (message.body) {
            const data = JSON.parse(message.body);

            if (data.messageType === 'ROUND_ONGOING') {
              latestMultiplier = parseFloat(data.currentMultiplier);
              console.log(`📈 Current Multiplier: ${latestMultiplier}x`);
            }

            if (data.messageType === 'ROUND_END_WAIT') {
              console.log('🛑 Round ending soon. Final multiplier:', latestMultiplier);

            }
          }
        } catch (err) {
          console.error('❌ Message processing error:', err);
        }
      });


      client.on('Network.webSocketFrameSent', async ({ requestId, response }) => {
        if (!response.payloadData) return;
        try {
          const message = stompToJson(response.payloadData);
          console.log('📥 Outgoing WebSocket message:', message);

        } catch (err) {
          console.error('❌ Outgoing Message processing error:', err);
        }
      });


      // Keep process alive
      await new Promise(() => { });
    } catch (err) {
      console.error("🚨 Critical error:", err);
    }
  }

  logRequestAndAutoClick();
  await turboCashout();
})();


