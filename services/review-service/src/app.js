const express = require('express')
const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
  res.send('Ride Service OK')
})

app.listen(4001, () => {
  console.log('Ride Service running on port 4001')
})
