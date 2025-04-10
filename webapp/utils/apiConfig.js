const apiKey = 'my-secret-key';

function getApiConfig(contentType = 'application/json') {
    return {
        headers: {
            'Content-Type': contentType,
            'x-api-key': apiKey
        }
    };

}


module.exports = getApiConfig;
