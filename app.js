const express = require('express');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressLayouts);
app.set('layout', 'layout'); // refers to views/layout.ejs

// Routes
app.use('/', require('./routes/tasks'));
app.use('/templates', require('./routes/templates'));
app.use('/schedules', require('./routes/schedules'));
app.use('/customers', require('./routes/customers'));
app.use('/assignments', require('./routes/assignments'));

app.listen(3000, () => {
    console.log('http://localhost:3000');
});