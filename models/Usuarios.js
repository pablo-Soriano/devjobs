const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const bcrypt = require("bcrypt");

const usuariosSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true, //unique no es un validador en moongose, por eso no le ponemos un mensaje
    lowercase: true,
    trim: true, //para los espacios en blanco
  },
  nombre: {
    type: String,
    require: true, //require si es validador por lo tanto le podemos poner un mensaje asi: require: 'Agrega tu nombre' pero en este caso lo haremos de otra forma
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
  token: String,
  expira: Date,
});

// Metodo para hashear los passwords
usuariosSchema.pre("save", async function (next) {
  //si el password ya esta hasheado, no haremos nada, validamos el password
  if (!this.isModified("password")) {
    return next(); //deten la ejecucion
  }

  // si no esta hasheado
  const hash = await bcrypt.hash(this.password, 12);
  this.password = hash;
  next();
});

//Envia alerta y valida si el correo ya existe, validacion de mongodb con la propiedad unique en el email.
usuariosSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoServerError" && error.code === 11000) {
    next("Ese correo ya esta registrado");
  } else {
    next(error);
  }
});

// Autenticar usuarios - compara el password
usuariosSchema.methods = {
  compararPassword: function(password) {
    return bcrypt.compareSync(password, this.password); //this.password es el password hasheado en la BD
  }
}

module.exports = mongoose.model("Usuarios", usuariosSchema);
