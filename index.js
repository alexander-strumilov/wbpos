const express = require('express')
const app = express()
const port = 8080
const path = require('path')
const cheerio = require('cheerio')
const url = "https://www.wildberries.ru/catalog/0/search.aspx?search="
const HttpsProxyAgent = require("https-proxy-agent")
const httpsAgent = new HttpsProxyAgent({host: "45.128.184.27", port: "65233", auth: "webactives:N4h6ArL"})
let axios = require('axios')

axios = axios.create({httpsAgent});

app.use(express.json());

app.post('/api/parse', (req, res) => {
    let phrases = req.body.phrases,
        vendorCode = req.body.vendorCode,
        result = {
            positions: []
        };

    const phrasesList = phrases.split(/\n/);

    console.log('phrasesList :>> ', phrasesList);



    async function getProductInfo() {
        const product = await parseProduct(vendorCode).then(data => data);
        result.product = product;
    }

    getProductInfo();

    async function requestData(arr) {
        if (arr.length) {
            const phrase = arr.shift();
            await parseUrl(url, phrase, vendorCode, result);
            await requestData(phrasesList);
        } else {
            res.status(200).json(result);
        }
    }

    requestData(phrasesList)

    async function parseUrl(url, phrase, code, result) {

        let vendors = [];
        // Проверка страниц пагинации (максимум: 7)
        const pagination = await axios.get(url + encodeURI(phrase)).then(response => {
            if (response.status === 200) {
                const html = response.data;
                const $ = cheerio.load(html);
                let linkNumbers = [];
                if ($('.pagination-item').length == 0) {
                    linkNumbers.push(1);
                } else {
                    $('.pagination-item').each(function (i, el) {
                        linkNumbers.push(i + 1);
                    })
                }
                return linkNumbers;
            }
        })
        //Запрос всех артикулов по порядку
        for (const number of pagination) {

            const searchUrl = url + encodeURI(phrase) + '&page=' + number;

            const data = await axios.get(searchUrl).then(response => {
                if (response.status === 200) {
                    const html = response.data;
                    const $ = cheerio.load(html);
                    $('.catalog_main_table .j-card-item').each(function (i, el) {
                        vendors.push($(this).attr('data-catalogercod1s'));
                    })
                }
            }, (error) => console.log(error));

        }
        //Проверка содержит ли массив артикулов нужный
        let hasInList = false;
        vendors.forEach((item, i) => {
            if (item == code) {
                hasInList = true;
                result.positions.push({
                    phrase: phrase,
                    position: i + 1,
                    link: url + encodeURI(phrase)
                });
            }
        })
        if (!hasInList) {
            result.positions.push({
                phrase: phrase,
                position: '-',
                link: url + encodeURI(phrase)
            });
        }
        console.log('result:', result);
    }

    async function parseProduct(vendor) {
        const url = `https://www.wildberries.ru/catalog/${vendor}/detail.aspx`;
        const product = await axios.get(url).then(response => {
            if (response.status === 200) {
                const html = response.data;
                const $ = cheerio.load(html);
                return {
                    url: url,
                    title: $('span.name').text(),
                    price: $('span.final-cost').text(),
                    imageUrl: 'https://' + $('img.MagicZoomFullSizeImage').attr('src')
                }
            }
        })
        return product;
    }

})

app.use(express.static(path.resolve(__dirname, 'client')))

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'))
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})