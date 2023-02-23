const mongoose = require("mongoose");
const multer = require("multer");
const Usuarios = mongoose.model("Usuarios");
const shortid = require('shortid');



exports.subirImagen = (req, res, next) => {
  upload(req, res, function(error) {
    if (error){
        if(error instanceof multer.MulterError) {
            if(error.code === 'LIMIT_FILE_SIZE') {
                req.flash('error', 'El archivo es muy grande: Máximo 100kb')
            } else {
                req.flash('error', error.message);
            }
        } else {
          req.flash('error',error.message);
        }
        res.redirect('/administracion');
        return;
    } else {
      return next();
    }
  });
  
}

// Opciones de Multer - para subir imagen, la ubicacion y nombre de archivo
const configuracionMulter = {
  limits: {fileSize: 100000 }, //tamaño viene en bytes
  storage: fileStorage = multer.diskStorage({
      destination: (req, file, cb) => { // le ponemos cb de callback, puede ser cualquier nombre. el cb recibe (error, file), pero como no tendremos error se envia como null
          cb(null, __dirname+'../../public/uploads/perfiles');
      },
      filename: (req, file, cb) =>{
        const extension = file.mimetype.split('/')[1];
        cb(null,`${shortid.generate()}.${extension}`);
      }
  }),
  fileFilter(req, file, cb) {
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
        // el callback se ejecuta como true o false: true cuando la imagen se acepta
        cb(null, true);
    } else {
      cb(new Error('Formato no Válido'), false);
    }
  }
  
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) => {
  res.render("crear-cuenta", {
    nombrePagina: "Crea tu cuenta en devJobs",
    tagline:
      "Comienza a publicar tus vacantes gratis, solo debes crear la cuenta",
  });
};

exports.validarRegistro = (req, res, next) => {
  //sanitizar el req.body  - evitar que ingresen datos tipo script: <script>alert("hola")</script> en un input, los convierte en caracteres que no sean peligrosos
  req.sanitizeBody("nombre").escape();
  req.sanitizeBody("email").escape();
  req.sanitizeBody("password").escape();
  req.sanitizeBody("confirmar").escape();

  // Validar
  req.checkBody("nombre", "El Nombre es obligatorio").notEmpty();
  req.checkBody("email", "El email debe ser válido").isEmail();
  req.checkBody("password", "El password no puede ir vacío").notEmpty();
  req.checkBody("confirmar", "Confirmar password no puede ir vacío").notEmpty();
  req
    .checkBody("confirmar", "El password es diferente!")
    .equals(req.body.password);

  const errores = req.validationErrors();

  if (errores) {
    //si hay errores, el map recorre los errores y los ingresa en flash errores, pero solo el campo msg.
    req.flash(
      "error",
      errores.map((error) => error.msg)
    );

    res.render("crear-cuenta", {
      nombrePagina: "Crea tu cuenta en devJobs",
      tagline:
        "Comienza a publicar tus vacantes gratis, solo debes crear la cuenta",
      mensajes: req.flash(),
    });
    return;
  }

  // Si toda la validacion es correcta.
  next();
};

exports.crearUsuario = async (req, res, next) => {
  //Crear el usuario
  const usuario = new Usuarios(req.body);

  try {
    await usuario.save();
    res.redirect("/iniciar-sesion");
  } catch (error) {
    req.flash("error", error);
    res.redirect("/crear-cuenta");
  }
};

//Formulario para iniciar sesion
exports.formIniciarSesion = (req, res) => {
  res.render('iniciar-sesion', {
      nombrePagina: 'Iniciar Sesion devJobs'
  })
}


// Form editar el perfil
exports.formEditarPerfil = (req, res) => {
  res.render('editar-perfil', {
    nombrePagina: 'Edita tu perfil en devJobs',
    usuario: req.user,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen
  })
}

// Guardar cambios al editar perfil
exports.editarPerfil = async (req, res) => {
  
  const usuario = await Usuarios.findById(req.user._id);

  usuario.nombre = req.body.nombre;
  usuario.email = req.body.email;

  //si el usuario ingresa un password, se cambiara en base
  if(req.body.password) {
    usuario.password = req.body.password;
  }

  if(req.file) {
    usuario.imagen = req.file.filename;
  }

   await usuario.save();

   req.flash('correcto', 'Cambios guardados correctamente!')

  //redireccionamos a la pagina administracion.
  res.redirect('/administracion');
  
}

// Sanitizar y validar formulario de editar Perfiles
exports.validarPerfil = (req, res, next) => {
  // sanitizar
  req.sanitizeBody('nombre').escape();
  req.sanitizeBody('email').escape();

  if(req.body.password) {
    req.sanitizeBody('password').escape();
  }
  //validar
  req.checkBody('nombre', 'El nombre no puede ir vacío').notEmpty();
  req.checkBody('email', 'El Correo no puede ir vacío').notEmpty();

  // arreglo de errores
  const errores = req. validationErrors();

  if(errores) {
    req.flash('error', errores.map(error => error.msg));
    
    res.render('editar-perfil', {
      nombrePagina: 'Edita tu perfil en devJobs',
      usuario: req.user,
      cerrarSesion: true,
      nombre: req.user.nombre,
      imagen: req.user.imagen,
      mensajes: req.flash()
    });
    return;
  }

  next(); // todo bien, siguiente middleware
}