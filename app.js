const express = require('express');
const sequelize = require('sequelize');
const bodyParser = require('body-parser');
const pollRoutes = require('./routes/pollRoutes');
const requestLogger = require('./middlewares/requestLogger');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
app.use(bodyParser.json());
app.use(requestLogger);

app.use('/api',pollRoutes);

app.use(errorHandler)


const port = process.env.PORT || 3000
app.listen(port,()=>{
    console.log(`server is running on port : ${port}`);
})