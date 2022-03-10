const puppeteer = require('puppeteer');
const DayArray = new Array(30);
const RaiseArray = new Array(30);

let crawler = async () => {
    const browser = await puppeteer.launch({ headless: true });
    //如果為false則會開啟瀏覽器，適合用作於debug時。
    const page = await browser.newPage();

    // ------------------對Request做Interception以取消載入圖片、廣告...----------------------
    // await page.setRequestInterception(true);
    // page.on('request', (request) => {
    //     if (['image', 'stylesheet', 'font', 'script'].indexOf(request.resourceType()) !== -1) {
    //         request.abort();
    //     } else {
    //         request.continue();
    //     }
    // });

    //-------------------抓出目前成值排行--------------------
    const url_TV = "https://tw.stock.yahoo.com/rank/turnover" //TV = Trading Value
    await page.goto(url_TV);

    const code = await page.$$eval('span.Ell', els => els.map(el => el.innerHTML.slice(0,4)));

    //-----------------抓出各成值排行的資訊-------------------
    const url_Indi = "https://goodinfo.tw/StockInfo/" //Indi = 個股查詢
    await page.goto(url_Indi);

    for(j = 0; j < 30; j++) {
        /*搜尋個股到達個股K線圖*/
        await page.$eval('#txtStockCode', (el, A) => el.value = A, code[j]);
        await page.$eval('#frmStockSearch > input[type=submit]:nth-child(2)', el => el.click() );
        await page.waitForSelector('#StockDetailMenu > table > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(10) > td > a');
        await page.$eval('#StockDetailMenu > table > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(10) > td > a', el => el.click() );
        await page.waitForSelector('#tblPriceDetail');

        /*抓出是否大於10日量*/
        const volumn = await page.$$eval('#tblPriceDetail tr:nth-child(n+3):nth-child(-n+12) td:nth-child(9)', els => els.map(el => el.innerText));
        const UporDown = await page.$$eval('body > table:nth-child(8) > tbody > tr > td:nth-child(3) > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(1) > table > tbody > tr:nth-child(3) > td:nth-child(4)', els => els.map(el => el.innerText.slice(0,1)));;
        
        if(UporDown == '+') {
            RaiseArray[j] = 1;
        }
        else {
            RaiseArray[j] = 0;
        }

        var check10 = 1
        volumn[0] = parseInt(volumn[0], 10)
        for(i = 1; i < 10; i++){
            volumn[i] = parseInt(volumn[i], 10)
            if(volumn[0] > volumn[i]) {
                check10++;
            }
            else {
                break;
            }
        };

        if (check10 >= 5) {
            DayArray[j] = 5
            if (check10 == 10) {
                DayArray[j] += 10
            }
        }
        else {
            DayArray[j] = 0
        }
    }

    await browser.close();

    for(i = 0; i < DayArray.length; i++) {
        if(DayArray[i] != 0 && RaiseArray[i] == 1) {
            console.log(code[i] + ' / ')
        }
    }
};

crawler()