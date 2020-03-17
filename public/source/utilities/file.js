/////////////////////////////
// Load up file from server.
//

// Define function to get file from server.
const file = async (filePath) => {

    // Default options are marked with *
    const response = await fetch(filePath, {

        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {

            'Content-Type': 'application/json'
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer' // no-referrer, *client
    });
    return await response.json(); // parses JSON response into native JavaScript objects
};

