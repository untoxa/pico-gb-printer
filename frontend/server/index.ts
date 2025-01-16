import * as path from 'path';
import express from 'express';
import proxy from 'express-http-proxy';

const app = express()
const port = 3000

app.use(express.static(path.join(process.cwd(), 'dist')))

app.use('/', proxy('192.168.7.1'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

