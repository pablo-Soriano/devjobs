const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const slug = require("slug");
const shorid = require("shortid");

const VacantesSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: "El nombre de la vacante es obligatorio",
    trim: true, //corta espacios en blanco
  },
  empresa: {
    type: String,
    trim: true,
  },
  ubicacion: {
    type: String,
    trim: true,
    required: "La ubicacion es obligatoria",
  },
  salario: {
    type: String,
    default: 0,
  },
  contrato: {
    type: String,
  },
  descripcion: {
    type: String,
    trim: true,
  },
  url: {
    type: String,
    lowercase: true,
  },
  skills: [String], //con corchetes se define como arreglos de string.
  candidatos: [
    {
      nombre: String,
      email: String,
      cv: String,
    }],
    autor:  {
      type: mongoose.Schema.ObjectId,
      ref: 'Usuarios',
      required: 'El autor es obligatorio'
    }
});

//funcion antes de guardar...
VacantesSchema.pre('save', function(next) {
    //crear la url
    const url = slug(this.titulo);
    //esta linea concatena la url con un id unico, generado por shortid, por ejemplo: titulo = React Developer, la url con id seria: react-developer-12981982, por si se repite el titulo.
    this.url = `${url}-${shorid.generate()}`

    next();
})

// Crear un indice
VacantesSchema.index({ titulo: 'text' });

module.exports = mongoose.model('Vacante', VacantesSchema);
