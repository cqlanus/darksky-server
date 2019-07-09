const express = require("express")
const fetch = require("node-fetch")
const app = express()
const cors = require("cors")
const morgan = require("morgan")
const port = 5000

const DARK_SKY_KEY = "ef48a877c2d39af5dac158b383af6fa8"
const lat = "41.8781"
const lng = "-87.6298"
const position = `${lat},${lng}`
const basicUrl = `https://api.darksky.net/forecast/ef48a877c2d39af5dac158b383af6fa8/${position}?extend=hourly`

const request = async (url, params) => {
    const res = await fetch(url, params)
    return await res.json()
}

const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err)
    }
    res.status(500)
    res.render("error", { error: err })
}

var corsOptions = {
    origin: "http://localhost:3000",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions))
app.use(morgan("tiny"))

app.get("/forecast", (req, res, next) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credential": true,
    }
    const params = {
        mode: "cors",
        credentials: "omit",
        headers,
    }
    request(basicUrl, params)
        .then(data => {
            res.send(data)
        })
        .catch(next)
})

app.use(function(err, req, res, next) {
    console.error(err.stack)
    res.status(500).send("Something broke!")
})

app.listen(port, () => console.log(`App listening on port ${port}!`))
