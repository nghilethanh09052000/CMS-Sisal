var fs = require('fs');
var moment = require('moment')
var version = ''

console.log("Incrementing build number...");

fs.readFile('version', function (err, content) {
    if (err) throw err;
    version = content.toString('utf8').split('\n')[0]
});

fs.readFile('src/metadata.json', function (err, content) {
    if (err) throw err;
    var metadata = JSON.parse(content);

    metadata['release-number'] = version;
    metadata['release-date'] = moment().format('YYYY-MMM-DD HH:mm:ss');

    var metadataContent = JSON.stringify(metadata, null, 4)

    fs.writeFile('src/metadata.json', metadataContent, function (err) {
        if (err) throw err;
        console.log("Current build : " + metadataContent);
    })
});