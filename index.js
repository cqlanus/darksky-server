const express = require("express")
const fetch = require("node-fetch")
const app = express()
const cors = require("cors")
const morgan = require("morgan")
const https = require('https')
const fs = require('fs')
const querystring = require('querystring')
const port = process.env.PORT || 5000

const getSkewTData = require('./utils/skewt')

const DARK_SKY_KEY = process.env.DARK_SKY_KEY
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN
const lat = "41.8781"
const lng = "-87.6298"
const position = `${lat},${lng}`
const url = (pos = position) => `https://api.darksky.net/forecast/ef48a877c2d39af5dac158b383af6fa8/${pos}?extend=hourly`

const request = async (url, params) => {
    const res = await fetch(url, params)
    return await res.json()
}

const isDev = () => process.env.NODE_ENV === "dev"

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render("error", { error: err })
}

var corsOptions = {
    origin: isDev() ? "https://localhost:3000" : "https://master.d2374hhhwbye5z.amplifyapp.com/"
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(morgan("tiny"))

app.get("/forecast", (req, res, next) => {
    const headers = {
        "Access-Control-Allow-Origin": "https://localhost:5000/",
        "Access-Control-Allow-Credential": true,
    }
    const params = {
        mode: "cors",
        credentials: "omit",
        headers,
    }
    const { latitude, longitude } = req.query
    const pos = latitude && longitude ? `${latitude},${longitude}` : position
    const dynamicUrl = url(pos)
    console.log({dynamicUrl})
    request(dynamicUrl, params)
        .then(data => {
            res.send(data)
        })
        .catch(next)
})

app.get("/geocode", (req, res, next) => {
    const baseUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places/"
    const { search } = req.query
    const encodedSearch = encodeURIComponent(search)

    const url = `${baseUrl}${encodedSearch}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
    request(url)
        .then(data => {
            res.send(data)
        })
        .catch(next)
})

app.get('/reversegeocode', (req, res, next) => {
    const baseUrl = "https://api.mapbox.com/geocoding/v5/mapbox.places/"
    const { latitude, longitude } = req.query
    const queryParam = `${longitude},${latitude}`

    const url = `${baseUrl}${queryParam}.json?access_token=${MAPBOX_ACCESS_TOKEN}`
    request(url)
        .then(data => {
            res.send(data)
        })
        .catch(next)
})

app.get('/skewt', (req, res, next) => {
    const { airport } = req.query
    getSkewTData(airport)
        .then(data => {
            res.send(data)
        })
        .catch(next)
})

app.use(function(err, req, res, next) {
    console.error(err.stack)
    res.status(500).send("Something broke!")
})

// const server = https.createServer({
//     key: fs.readFileSync('./server.key'),
//     cert: fs.readFileSync('./server.cert')
// }, app)

app.listen(port, () => console.log(`App listening on port ${port}! ENV: ${process.env.NODE_ENV}`))
