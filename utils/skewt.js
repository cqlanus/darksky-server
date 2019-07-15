const fs = require('fs').promises
const fetch = require('node-fetch')
/* 
    https://rucsoundings.noaa.gov/get_soundings.cgi?data_source=Op40&latest=latest&start_year=2019&start_month_name=Jul&start_mday=15&start_hour=15&start_min=0&n_hrs=1.0&fcst_len=shortest&airport=ORD&text=Ascii%20text%20%28GSD%20format%29&hydrometeors=false&start=latest
*/


const request = async (url, params) => {
    const response = await fetch(url, params)
    return await response.text()
}

const REQUEST_PARAMS = {
    data_source: 'Op40',
    latest: 'latest',
    start_year: '2019',
    start_month_name: 'Jul',
    start_mday: '15',
    start_hour: '15',
    start_min: '0',
    n_hrs: '1.0',
    fcst_len: 'shortest',
    airport: 'ORD',
    text: 'Ascii%20text%20%28GSD%20format%29',
    hydrometeors: 'false',
    start: 'latest'
}

const getSoundingData = async (airport) => {
    const baseUrl = 'https://rucsoundings.noaa.gov/get_soundings.cgi'
    const queryParams = Object.entries(REQUEST_PARAMS).reduce((acc, entry, idx) => {
        const [ key, value ] = entry
        const dynamicValue = key === 'airport' ? airport : value
        const separator = idx === 0 ? '?' : '&'
        const queryParam = `${separator}${key}=${dynamicValue}`
        return `${acc}${queryParam}`
    }, '')
    const url = `${baseUrl}${queryParams}`

    const soundingText = await request(url)
    return soundingText
}

const SOUNDING_LINE_MAPPING = {
    DATE: 1,
    META: 2,
    STATION_ID: 3,
    SOUNDING_CHECKS: 4,
    STATION_EXTRA: 5,
    LEVELS: 6,
}

const LINE_MAPPING = {
    DATE: {
        hour: 1,
        day: 2,
        month: 3,
        year: 4,
    },
    META: {
        cape: 1,
        cin: 3,
        helic: 5,
        pw: 7
    },
    STATION_ID: {
        lineId: 0,
        wban: 1,
        wmo: 2,
        lat: 3,
        lon: 4,
        elev: 5
    },
    SOUNDING_CHECKS: {
        lineId: 0,
        hydro: 1,
        mxwd: 2,
        tropl: 3,
        lines: 4,
        tindex: 5,
        source: 6,
    },
    STATION_EXTRA: {
        lineId: 0,
        stationId: 1,
        sonde: 2,
        windSpeedUnits: 3,
    },
    LEVELS: {
        lineId: 0,
        pressure: 1,
        height: 2,
        temp: 3,
        dewPoint: 4,
        windDir: 5,
        windSpeed: 6
    }
}

const parseLine = line => line.replace(/\s+/g, ',').split(',').filter(Boolean)

const objectifyLineForKey = lineKey => line => {
    const mappingForKey = LINE_MAPPING[lineKey]
    return Object.entries(mappingForKey).reduce((acc, entry) => {
        const [ key, index ] = entry
        const lineValue = line[index]
        const value = lineKey === 'LEVELS' ? Number(lineValue) : lineValue
        acc[key] = value
        return acc
    }, {})
}

const processText = textArray => {
    return Object.entries(SOUNDING_LINE_MAPPING).reduce((acc, entry) => {
        const [ key, index ] = entry
        const objectifyLine = objectifyLineForKey(key)
        if (key !== "LEVELS") {
            const value = textArray[index]
            acc[key] = objectifyLine(value)
        } else {
            const value = textArray.slice(index)
            acc.LEVELS = value.map(objectifyLine)
        }
        return acc
    }, {})
}

const parseSoundingText = text => {
    return text
        .split('\n')
        .map(line => line.trim())
        .map(parseLine)
        .filter(arr => arr.length > 0)
}

const getSkewTData = async (airport = 'ORD') => {
    try {
        const soundingText = await getSoundingData(airport)
        const soundingArray = parseSoundingText(soundingText)
        const processedSounding = processText(soundingArray)
        return processedSounding    
    } catch (error) {
        console.log({error})
    }
    
}

module.exports = getSkewTData