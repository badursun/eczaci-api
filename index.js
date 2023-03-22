const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const slugify = require('slugify');

const API_URI = 'https://www.haberturk.com/nobetci-eczaneler/{0}/{1}';
const API_CITY_URI = 'https://www.haberturk.com/nobetci-eczaneler/{0}';

const app = express();

function FindPharmacyName(data) {
    let Pharmacy = data.find('div[class=title] h3 a span').text();
    if (Pharmacy.includes('(') != 0) {
        let PharmacyNameMatch = Pharmacy.match(/(.*) \(([^)]+)\)/);
        return PharmacyNameMatch !== null ? PharmacyNameMatch[1] : Pharmacy.replace('()', '');
    }else{
        return Pharmacy
    }
};

function FindTown(data){
    let Town = data.find('div[class=title] h3 a span').text();
    if (Town.includes('(') != 0) {
        let TownMatch = Town.match(/(.*) \(([^)]+)\)/);
        return TownMatch !== null ? TownMatch[2] : Town.replace('()', '');
    }else{
        return 'Merkez'
    }
}

app.get('/get/:city', async (req, res) => {
    var city = req.params.city;

    var datas = [];
    await fetch( API_CITY_URI.replace('{0}', slugify(city)), {}, 3000)
        .then((response) => {
            if (response.status >= 400 && response.status < 600) {
              throw new Error("Bad response from server");
            }
            return response.text()
        }).then((body) => {
            const $ = cheerio.load(body);

            $('figure').each(function (i, elem) {
                datas[i] = {
                    city    : city.charAt(0).toUpperCase() + city.slice(1),
                    town    : FindTown( $(this) ),
                    name    : FindPharmacyName( $(this) ),
                    address : $(this).find('figcaption p').first().text().split('Adres: ')[1],
                    phone   : $(this).find('figcaption p').last().text().split('Telefon: ')[1],
                }
            })
        }).catch((error) => {
          console.log(error)
        });
    res.send(datas)
})

app.get('/get/:city/:town', async (req, res) => {
    var city = req.params.city;
    var town = req.params.town;

    var datas = [];
    await fetch( API_URI.replace('{0}', slugify(city)).replace('{1}', slugify(town)), {}, 3000)
        .then((response) => {
            if (response.status >= 400 && response.status < 600) {
              throw new Error("Bad response from server");
            }
            return response.text()
        }).then((body) => {
            const $ = cheerio.load(body);
            $('figure').each(function (i, elem) {
                datas[i] = {
                    city    : city.charAt(0).toUpperCase() + city.slice(1),
                    town    : FindTown( $(this) ),
                    name    : FindPharmacyName( $(this) ),
                    address : $(this).find('figcaption p').first().text().split('Adres: ')[1],
                    phone   : $(this).find('figcaption p').last().text().split('Telefon: ')[1],
                };
            })
        })
    res.send(datas)
})

app.get('/', (req, res) => {
  res.send('Hello from other side.')
})


// error handler middleware
app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
        error: {
            status: error.status || 500,
            message: error.message || 'Internal Server Error',
        },
    });
});

const port = process.env.PORT || 4000;

app.listen(port, () => {
    console.log('sunucu ayakta efenim')
})
