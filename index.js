const express = require('express');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const slugify = require('slugify');

const ms = Date.now();
const API_URI = 'https://www.haberturk.com/nobetci-eczaneler/{0}/{1}/?nc='+ms;
const API_CITY_URI = 'https://www.haberturk.com/nobetci-eczaneler/{0}/?nc='+ms;

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
        // return TownMatch !== null ? TownMatch[2] : Town.replace('()', '');
        return TownMatch !== null ? TownMatch[2] : 'Merkez';
    }else{
        return Town
    }
};

function FindDate(DateVal) {
    let Tarih, TarihDump;

    if (DateVal.includes('-')) {
        Tarih = DateVal.split(' - ')[1]
        TarihDump = Tarih.split(' ');
        Tarih = TarihDump[2] + '-' + TarihDump[1] + '-' + TarihDump[0]
    }

    function Aylar(Ay) {
        return Ay.replace('Ocak', '01').replace('Şubat', '02').replace('Mart', '03')
            .replace('Nisan', '04').replace('Mayıs', '05').replace('Haziran', '06')
            .replace('Temmuz', '07').replace('Ağustos', '08').replace('Eylül', '09')
            .replace('Ekim', '10').replace('Kasım', '11').replace('Aralık', '12')
    }

    if (DateVal.includes('-')) {
        return Aylar(Tarih)
    } else {
        return '2023-01-01'
    }
};

app.get('/get/:city', async (req, res) => {
    var city = req.params.city;

    var datas = [];
    await fetch( API_CITY_URI.replace('{0}', slugify(city)), { headers:{'Cache-Control': 'no-cache'} }, 3000)
        .then((response) => {
            if (response.status >= 400 && response.status < 600) {
              throw new Error("Bad response from server");
            }
            return response.text()
        }).then((body) => {
            const $ = cheerio.load(body);
            const Tarih = FindDate( $('title').text() );
            $('figure').each(function (i, elem) {
                datas[i] = {
                    date    : Tarih,
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
    await fetch( API_URI.replace('{0}', slugify(city)).replace('{1}', slugify(town)), { headers:{'Cache-Control': 'no-cache'} }, 3000)
        .then((response) => {
            if (response.status >= 400 && response.status < 600) {
              throw new Error("Bad response from server");
            }
            return response.text()
        }).then((body) => {
            const $ = cheerio.load(body);
            const Tarih = FindDate( $('title').text() );
            $('figure').each(function (i, elem) {
                datas[i] = {
                    date    : Tarih,
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
