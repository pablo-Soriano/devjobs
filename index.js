const mongoose = require("mongoose");
require("./config/db");

const express = require("express");
const router = require("./routes");
const exphbs = require("express-handlebars");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const passport = require('./config/passport');
const createError =  require('http-errors');

const Handlebars = require('handlebars')
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access')

require("dotenv").config({ path: "variables.env" });

const app = express();

//habilitar body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//Validacion de campos con express-validator
app.use(expressValidator());

//Habilitar handlebars como view
app.engine(
  "handlebars",
  exphbs({
    handlebars: allowInsecurePrototypeAccess(Handlebars),
    defaultLayout: "layout",
    helpers: require("./helpers/handlebars"),
  })
);
app.set("view engine", "handlebars");

// static files
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());
app.use(
  session({
    secret: process.env.SECRETO,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.DATABASE }),
  })
);

// Inicializar passport
app.use(passport.initialize());
app.use(passport.session());

//Alertas y flash messages
app.use(flash());

//crear nuestro middleware
app.use((req, res, next) => {
  res.locals.mensajes = req.flash();
  next();
});

app.use("/", router());

// 404 pagina no existente
app.use((req, res, next) => {
  //instalamos el paquete http-errors para captura de estos errores
  next(createError(404, 'No encontrado'));
})

// Administracion de los errores
app.use((error, req, res) => {
  //al pasar los errores a las variables locals, se pasan automaticamente a la vista
    res.locals.mensaje = error.message;
    const status = error.status || 500;
    res.locals.status = status;
    res.status(status);
    res.render('error');
})
// configuracion para que heroku asigne el puerto
const host = '0.0.0.0';
const port = process.env.PORT;

app.listen(port, host, () => {
  console.log('El servidor esta funcionando');
})


// configuracion para servidor local
//app.listen(process.env.PUERTO);
