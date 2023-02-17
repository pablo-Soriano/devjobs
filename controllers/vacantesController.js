const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");

exports.formularioNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    tagline: "Llena el formulario y publica tu vacante",
    cerrarSesion: true,
    nombre: req.user.nombre,
  });
};

//agrega las vacantes a la BD
exports.agregarVacante = async (req, res) => {
  const vacante = new Vacante(req.body);

  //usuario autor de la vacante, para agregar el Id del usuario en la vacante.
  vacante.autor =req.user._id

  // crear arreglo de habilidades(skills)
  vacante.skills = req.body.skills.split(",");

  //almacenarlo en la base de datos
  const nuevaVacante = await vacante.save();

  //redireccionar
  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

//muestra una vacante
exports.mostrarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url }).lean();

  // si no hay resultados, siguiten middleware
  if (!vacante) return next();

  //si hay resultados
  res.render("vacante", {
    vacante,
    nombrePagina: vacante.titulo,
    barra: true,
  });
};

//Editar vacante -Formulario
exports.formEditarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url }).lean();

  if (!vacante) return next();

  res.render("editar-vacante", {
    vacante,
    nombrePagina: `Editar - ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
  });
};

// Guardar los cambios en BD al editar
exports.editarVacante = async (req, res, next) => {
  const vacanteActualizada = req.body;

  //esto es para que los skills se envien como un arreglo
  vacanteActualizada.skills = req.body.skills.split(",");

  //el primer valor url: es para buscar el registro, despues de la coma, es con lo que se va a actualizar el registro encontrado, el tercer valor es de configuracion
  const vacante = await Vacante.findOneAndUpdate(
    { url: req.params.url },
    vacanteActualizada,
    {
      new: true, //para que nos retorne el nuevo valor, el actualizado
      runValidators: true, // para que tome todo lo que pusimos en el modelo
    }
  );

  res.redirect(`/vacantes/${vacante.url}`);
  //hola
};
