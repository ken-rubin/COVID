const axios = require("axios");

const theURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv";

// Expose class whose instances expose up-to-date, parsed COVID-19 data via load.
module.exports = class COVID19 {

    // Return COVID-19 data.
    async load() {

        try {

            const result = await COVID19.get();

            ////////////////////////////////
            // Load up data into structure.

            // Breakup by crlf.
            const lines = result.data.split("\n");

            // The data attributes.  This will get a new value each day.
            let attributes = null;

            // Definte the public, exposed data.
            const stats = [];

            let first = true;
            lines.forEach((line) => {

                if (first) {

                    first = false;

                    attributes = line.split(",");
                    attributes.shift();
                    attributes.shift();
                    attributes.shift();
                    attributes.shift();
                } else {

                    const bits = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                    const region = bits.shift();
                    let regionless = true;
                    if (region) {

                        regionless = false;
                    }
                    const country = bits.shift();
                    const lat = parseFloat(bits.shift());
                    const long = parseFloat(bits.shift());

                    // Allocate or get country.
                    let data = stats.find((item) => {

                        return item.country === country;
                    });
                    if (!data) {

                        data = {

                            country,
                            Lat: lat,
                            Long: long,
                            dates: {}
                        };
                        stats.push(data);
                    }

                    if (regionless) {

                        data.Lat = lat;
                        data.Long = long;
                    }

                    // 1/22/20, 1/23/20, 1/24/20, ..., today.

                    let i = 0;
                    let lastValue = 0;
                    const dates = data.dates;
                    attributes.forEach((attribute) => {

                        let bit = bits[i++];

                        let thisValue = parseInt(bit);
                        if (!lastValue) {

                            lastValue = thisValue;
                        }
                        if (thisValue < lastValue || isNaN(thisValue)) {

                            thisValue = lastValue;
                        }

                        let thisDate = new Date(attribute);
                        if (!dates[thisDate]) {

                            dates[thisDate] = thisValue;
                        } else {

                            dates[thisDate] = dates[thisDate] + 
                                thisValue;
                        }

                        lastValue = thisValue;
                    });
                }
            });

            return stats;
        } catch (x) {

            console.error(x.message);
        }
    }

    // Helper method returns promise to get data from axios for COVID-19 data.
    static get() {

        return new Promise((resolve, reject) => {

            try {

                axios.get(theURL).
                    then((response) => {
                    
                        // handle success
                        resolve(response);
                    }).
                    catch((error) => {
                        
                        // handle error
                        reject(error);
                    });
            } catch (x) {

                reject(x);
            }
        });
    };
};
