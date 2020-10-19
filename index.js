const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const request = require('request')
const cheerio = require('cheerio')
const url = "https://www.wildberries.ru/catalog/0/search.aspx?search="


app.use(express.json());

app.post('/api/gethtml', (req, res) => {
    let phrase = req.body.phrase,
        vendorCode = req.body.vendorCode,
        result = [],
        vendors = [];
    
    const phrasesArray = phrase.split(/\n/);

        function requestData(arr) {
            if(arr.length) {
                let phrase = arr.shift();
                let searchUrl = encodeURI(url+phrase);
                request(searchUrl, function(error, response, html) {
                    if (!error && response.statusCode == 200) {
                        let $ = cheerio.load(html);
                        if (!vendors.length) {
                            $('.i-dtList').each(function(i, el) {
                                vendors.push($(this).attr('data-catalogercod1s'));
                            })
                        }
                        let hasInList = false;
                        vendors.forEach((item, i) => {
                            if(item == vendorCode) {
                                hasInList = true;
                                result.push({phrase: phrase, position: i + 1});
                            }
                        })
                        if(!hasInList) {
                            result.push({phrase: phrase, position: '-'});
                        }
                        requestData(phrasesArray);
                    }
                })
            } else {
                res.status(200).json(result);
            }
        }
        requestData(phrasesArray)
})

app.use(express.static(path.resolve(__dirname, 'client')))

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'index.html'))
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})