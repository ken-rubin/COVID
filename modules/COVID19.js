const axios = require("axios");

const theURL = "https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_19-covid-Confirmed.csv";

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
                } else {

                    const data = {};
                    const bits = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

                    // Province/State,Country/Region,Lat,Long,1/22/20,1/23/20,1/24/20,1/25/20,1/26/20,1/27/20,1/28/20,1/29/20,1/30/20,1/31/20,2/1/20,2/2/20,2/3/20,2/4/20,2/5/20,2/6/20,2/7/20,2/8/20,2/9/20,2/10/20,2/11/20,2/12/20,2/13/20,2/14/20,2/15/20,2/16/20,2/17/20,2/18/20,2/19/20,2/20/20,2/21/20,2/22/20,2/23/20,2/24/20,2/25/20,2/26/20,2/27/20,2/28/20,2/29/20,3/1/20,3/2/20,3/3/20,3/4/20,3/5/20,3/6/20,3/7/20,3/8/20,3/9/20,3/10/20,3/11/20,3/12/20,3/13/20,3/14/20

                    let i = 0;
                    let lastValue = 0;
                    attributes.forEach((attribute) => {

                        let bit = bits[i++];

                        if (attribute === "Province/State") {

                            data[attribute] = bit;
                        } else if (attribute === "Country/Region") {

                            data[attribute] = bit;
                        } else if (attribute === "Lat") {

                            data[attribute] = parseFloat(bit);
                            if (isNaN(data[attribute])) {

                                data[attribute] = 0;
                            }
                        } else if (attribute === "Long") {

                            data[attribute] = parseFloat(bit);
                            if (isNaN(data[attribute])) {

                                data[attribute] = 0;
                            }
                        } else /* date... */ {

                            if (!data["dates"]) {

                                data["dates"] = {};
                            }
                            let thisValue = parseInt(bit);
                            if (!lastValue) {

                                lastValue = thisValue;
                            }
                            if (thisValue < lastValue) {

                                thisValue = lastValue;
                            }
                            lastValue = thisValue;
                            data["dates"][new Date(attribute)] = parseInt(bit);
                        }
                    });

                    stats.push(data);
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
