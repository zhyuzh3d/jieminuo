/*file添加时间戳重定向*/
var http = require('http');
var server = http.createServer(function (request, response) {
    var reurl = 'http://files.jieminuoketang.com' + request.url;
    if (reurl.indexOf('?') != -1) {
        reurl += '&_=' + String(Math.random()).substr(2);
    } else {
        reurl += '?_=' + String(Math.random()).substr(2);
    }
    response.writeHead(302, {
        'Location': reurl
    });
    response.end();
});
server.listen(8001);
console.log("Redirect file server is running at 8001.");
