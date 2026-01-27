const app = require('./app');
const mongoose = require('mongoose');


mongoose.connect('mongodb://127.0.0.1:27017/user_service_db')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error(err));


app.listen(3002, () => {
    console.log('User Service running on port 3002');
});