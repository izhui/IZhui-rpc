var crypto = require("crypto");
var algorithm = 'aes-128-ecb';
var clearEncoding = 'utf8';
var cipherEncoding = 'base64';
var iv = "";
var decrypt,encrypt;
module.exports.encrypt = encrypt = function( str, key ){
    var cipher = crypto.createCipheriv( algorithm, key , iv );
    var cipherChunks = [];
    cipherChunks.push(cipher.update(str,clearEncoding,cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    return cipherChunks.join('');
}

module.exports.decrypt = decrypt = function( str, key ){
    var decipher = crypto.createDecipheriv( algorithm, key , iv );
    var result = decipher.update( str, cipherEncoding, clearEncoding ) + decipher.final( clearEncoding ); 
    return result;
}

module.exports.randomKey = function(){
    return crypto.createHash('md5').update('c@vaCn.c0m'+Date.now(),'utf8').digest('hex').substr(8,16);
}

// var key = crypto.createHash("md5").update('c@va.c0m','utf8').digest('hex').substr(8,16);
// var obj = {'name':'cavacn','hello':'hello'};

// var encryptStr = encrypt(JSON.stringify(obj),key);
// console.log(encryptStr,key);

// var decryptStr = decrypt(encryptStr,key);
// console.log(decryptStr,key);