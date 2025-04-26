const bcrypt = require('bcrypt');

async function hashAndLog(password) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`Hashed version of "${password}":\n${hash}`);
}

hashAndLog('bobobalde'); // or whatever the plaintext password is
