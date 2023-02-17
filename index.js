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

app.listen(process.env.PUERTO);
