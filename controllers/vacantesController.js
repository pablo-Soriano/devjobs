const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const multer = require("multer");
const shortid = require("shortid");

exports.formularioNuevaVacante = (req, res) => {
  res.render("nueva-vacante", {
    nombrePagina: "Nueva Vacante",
    tagline: "Llena el formulario y publica tu vacante",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
  });
};

//agrega las vacantes a la BD
exports.agregarVacante = async (req, res) => {
  const vacante = new Vacante(req.body);

  //usuario autor de la vacante, para agregar el Id del usuario en la vacante.
  vacante.autor = req.user._id;

  // crear arreglo de habilidades(skills)
  vacante.skills = req.body.skills.split(",");

  //almacenarlo en la base de datos
  const nuevaVacante = await vacante.save();

  //redireccionar
  res.redirect(`/vacantes/${nuevaVacante.url}`);
};

//muestra una vacante
exports.mostrarVacante = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url })
    .lean()
    .populate("autor");

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
    imagen: req.user.imagen,
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

  req.sanitizeBody("titulo").escape();
  req.sanitizeBody("empresa").escape();
  req.sanitizeBody("ubicacion").escape();
  req.sanitizeBody("salario").escape();
  req.sanitizeBody("contrato").escape();
  req.sanitizeBody("skills").escape();

  // Validar
  req.checkBody("titulo", "Agrega un Titulo a la Vacante").notEmpty();
  req.checkBody("empresa", "Agrega una Empresa").notEmpty();
  req.checkBody("ubicacion", "Agrega una Ubicación").notEmpty();
  req.checkBody("contrato", "Seleeciona el Tipo de Contrato").notEmpty();
  req.checkBody("skills", "Agrega al Menos una habilidad").notEmpty();

  const errores = req.validationErrors();

  if (errores) {
    //Recargar la vista con los errores
    req.flash(
      "error",
      errores.map((error) => error.msg)
    );

    res.render("nueva-vacante", {
      nombrePagina: "Nueva Vacante",
      tagline: "Llena el formulario y publica tu vacante",
      cerrarSesion: true,
      nombre: req.user.nombre,
      mensajes: req.flash(),
    });
    return;
  }

  next(); //siguiente Middleware
};

//Eliminar vacantes
exports.eliminarVacante = async (req, res) => {
  const { id } = req.params;

  const vacante = await Vacante.findById(id);

  if (verificarAutor(vacante, req.user)) {
    // Todo bien, si es el usuario, eliminar
    vacante.remove();
    res.status(200).send("Vacante eliminada Correctamente!");
  } else {
    //no permitido
    res.status(403).send("Error");
  }
};

const verificarAutor = (vacante = {}, usuario = {}) => {
  if (!vacante.autor.equals(usuario._id)) {
    return false;
  }
  return true;
};

// Subir archivos PDF CV
exports.subirCV = (req, res, next) => {
  upload(req, res, function (error) {
    if (error) {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          req.flash("error", "El archivo es muy grande: Máximo 150kb");
        } else {
          req.flash("error", error.message);
        }
      } else {
        req.flash("error", error.message);
      }
      res.redirect("back"); //regresa a la pagina donde se origino el error
      return;
    } else {
      return next();
    }
  });
};

// Opciones de Multer - para subir imagen, la ubicacion y nombre de archivo
const configuracionMulter = {
  limits: { fileSize: 150000 }, //tamaño viene en bytes
  storage: (fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      // le ponemos cb de callback, puede ser cualquier nombre. el cb recibe (error, file), pero como no tendremos error se envia como null
      cb(null, __dirname + "../../public/uploads/cv");
    },
    filename: (req, file, cb) => {
      const extension = file.mimetype.split("/")[1];
      cb(null, `${shortid.generate()}.${extension}`);
    },
  })),
  fileFilter(req, file, cb) {
    if (file.mimetype === "application/pdf") {
      // el callback se ejecuta como true o false: true cuando la imagen se acepta
      cb(null, true);
    } else {
      cb(new Error("Formato no Válido"), false);
    }
  },
};

const upload = multer(configuracionMulter).single("cv"); //en nombre que va dentro del single('cv')  es el que colocamos en name en el input tipo file, del formulario de vacante.handlebars

// almacenar los candidatos en la bd.
exports.contactar = async (req, res, next) => {
  const vacante = await Vacante.findOne({ url: req.params.url });

  // si no exite la vacante
  if (!vacante) return next();

  // todo bien, construir el nuevo objeto
  const nuevoCandidato = {
    nombre: req.body.nombre, //como viene de formulario se toma el req.body y luego va el name del input.
    email: req.body.email,
    cv: req.file.filename,
  };

  //almacenar la vacante
  vacante.candidatos.push(nuevoCandidato);
  await vacante.save();

  // Mensaje flash y redireccion
  req.flash("correcto", "Se envió tu CV correctamente");
  res.redirect("/");
};

exports.mostrarCandidatos = async (req, res, next) => {
  const vacante = await Vacante.findById(req.params.id);

  if (vacante.autor != req.user._id.toString()) {
    return next();
  }

  if (!vacante) return next();

  res.render("candidatos", {
    nombrePagina: `Candidatos Vacante ${vacante.titulo}`,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos,
  });
};


// Buscador de vacantes
exports.buscarVacantes = async (req, res) => {
  const vacantes = await Vacante.find({
      $text: {
        $search: req.body.q   //q es el name del input en el layout de la vista
      }
  }).lean();

// Mostrar las vacantes
res.render('home', {
  nombrePagina: `Resultados para la busqueda: ${req.body.q}`,
  barra: true,
  vacantes
})

}