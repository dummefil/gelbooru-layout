const http = require('http')
const {readFileSync} = require('fs')

const port = 6868

http.createServer((req, res) => {
    if (req.url.startsWith('/script.js')) {
        const content = readFileSync('./script.js', 'utf-8')
        res.writeHead(200, {
            'Content-Type': 'text/javascript; charset=utf-8'
        })
        res.end(content)
    } else {
        res.writeHead(404, {
            'Content-Type': 'text/plain; charset=utf-8'
        })
        res.end('error access')
    }
}).listen(port, () => {
    console.info(`Server running on ${port}`)
})
