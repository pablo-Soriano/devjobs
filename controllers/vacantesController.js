const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");

exports.formularioNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    tagline: "Llena el formulario y publica tu vacante",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen
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
  const vacante = await Vacante.findOne({ url: req.params.url }).lean().populate('autor');

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
    imagen: req.user.imagen
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
  
};

// Validar y sanitizar los campos de las nuevas vacantes

exports.validarVacante = (req, res, next) => {
  //sanitizar los campos

  req.sanitizeBody('titulo').escape();
  req.sanitizeBody('empresa').escape();
  req.sanitizeBody('ubicacion').escape();
  req.sanitizeBody('salario').escape();
  req.sanitizeBody('contrato').escape();
  req.sanitizeBody('skills').escape();

  // Validar
  req.checkBody('titulo', 'Agrega un Titulo a la Vacante').notEmpty();
  req.checkBody('empresa', 'Agrega una Empresa').notEmpty();
  req.checkBody('ubicacion', 'Agrega una Ubicación').notEmpty();
  req.checkBody('contrato', 'Seleeciona el Tipo de Contrato').notEmpty();
  req.checkBody('skills', 'Agrega al Menos una habilidad').notEmpty();

  const errores = req.validationErrors();

  if(errores) {
    //Recargar la vista con los errores
    req.flash('error', errores.map(error => error.msg));

    res.render('nueva-vacante', {
      nombrePagina: "Nueva Vacante",
      tagline: "Llena el formulario y publica tu vacante",
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash()
    })
    return;
  }

  next(); //siguiente Middleware

}


//Eliminar vacantes
exports.eliminarVacante = async (req, res) => {
  const {id} = req.params;

  const vacante = await Vacante.findById(id);
  
  if(verificarAutor(vacante, req.user)){
    // Todo bien, si es el usuario, eliminar
    vacante.remove();
    res.status(200).send('Vacante eliminada Correctamente!');

  } else {
    //no permitido
    res.status(403).send('Error');

  }
 
  
}

const verificarAutor = (vacante = {}, usuario = {}) => {
  if(!vacante.autor.equals(usuario._id)) {
    return false
  } 
  return true;
}