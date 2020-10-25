const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const cheerio = require('cheerio')
const url = "https://www.wildberries.ru/catalog/0/search.aspx?search="
const axios = require('axios')


app.use(express.json());

app.post('/api/parse', (req, res) => {
    let phrases = req.body.phrases,
        vendorCode = req.body.vendorCode,
        result = [];

    const phrasesList = phrases.split(/\n/);
    console.log('phrasesList :>> ', phrases);

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
        //Первые 10 страниц
        const paginationLinksNumbers = [1,2,3,4,5,6,7,8,9,10];
        let vendors = [];
        //Запрос всех
        for (const number of paginationLinksNumbers) {
            const searchUrl = url + encodeURI(phrase) + '&page=' + number;

            const data = await axios.get(searchUrl).then(response => {
                if (response.status === 200) {
                    const html = response.data;
                    const $ = cheerio.load(html);
                    $('.i-dtList').each(function (i, el) {
                        vendors.push($(this).attr('data-catalogercod1s'));
                    })
                }
            }, (error) => console.log(error));
        }
        //Проверка содержит ли массив артикулов нужный
        let hasInList = false;
        vendors.forEach((item, i) => {
            if(item == code) {
                hasInList = true;
                result.push({phrase: phrase, position: i + 1});
            } 
        })
        if(!hasInList) {
            result.push({phrase: phrase, position: '-'});
        }
        console.log('result:', result);
    }
})

app.use(express.static(path.resolve(__dirname, 'client')))

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'))
})

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`)
})