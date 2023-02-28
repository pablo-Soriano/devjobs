const passport = require("passport");
const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");
const Usuarios = mongoose.model("Usuarios");
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

//autenticar usuario
exports.autenticarUsuario = passport.authenticate("local", {
  successRedirect: "/administracion",
  failureRedirect: "/iniciar-sesion",
  failureFlash: true,
  badRequestMessage: "Ambos campos son obligatorios",
});

// Revisar si el usuario esta autenticado
exports.verificarUsuario = (req, res, next) => {
  // revisar el usuario
  if (req.isAuthenticated()) {
    return next(); // esta autenticado
  }

  // sino esta autenticado se redirecciona
  res.redirect("/iniciar-sesion");
};

//Mostrar panel de administracion

exports.mostrarPanel = async (req, res) => {
  //consultar el usuario autenticaedo
  const vacantes = await Vacante.find({ autor: req.user._id }).lean();

  res.render("administracion", {
    nombrePagina: "Panel de Administracion",
    tagline: "Crea y Administra tus vacantes desde aquí",
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    vacantes,
  });
};

//Cerrar sesion

exports.cerrarSesion = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("correcto", "Cerraste Sesión Correctamente!");
    return res.redirect("/iniciar-sesion");
  });
};


// Formulario para Reestablecer password
exports.formReestablecerPassword = (req, res) => {
  res.render('reestablecer-password', {
    nombrePagina: 'Reestablece tu Password',
    tagline: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email'
  });
}

// Genera el token en la tabla del usuario
exports.enviarToken = async(req, res) => {
    const usuario = await Usuarios.findOne({ email: req.body.email});

    if(!usuario) {
      req.flash('error', 'No existe esa cuenta');
      return res.redirect('/iniciar-sesion');
    }

    // El usuario existe, generamos token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    // Guardar el usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token} `;

    
    // Enviar notificacion por email
    await enviarEmail.enviar({
      usuario,
      subject: 'Password Reset',
      resetUrl,
      archivo: 'reset'
    });
    


    //Todo correcto
    req.flash('correcto', 'Revisa tu email para las indicaciones');
    res.redirect('/iniciar-sesion');

}

//valida si el token es valido y el usuario existe muestra la vista
exports.reestablecerPassword = async (req, res) => {
  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now() //valida la fecha de expiracion del token.
    }
  });

  if(!usuario) {
    req.flash('error', 'El Token ya no es valido, intenta de nuevo');
    return res.redirect('/reestablecer-password');
  }

  // Todo bien, Mostrar el formulario
  res.render('nuevo-password', {
      nombrePagina: 'Nuevo Password'
  })
}


// Almacena el nuevo password en BD
exports.guardarPassword = async (req, res) => {

  const usuario = await Usuarios.findOne({
    token: req.params.token,
    expira: {
      $gt: Date.now() //valida la fecha de expiracion del token.
    }
  });

  // no existe el usuario o el token es inválido.
  if(!usuario) {
    req.flash('error', 'El Token ya no es valido, intenta de nuevo');
    return res.redirect('/reestablecer-password');
  }

  // Asignar nuevo password, limpiar valores previos.
  usuario.password = req.body.password;
  usuario.token = undefined;
  usuario.expira = undefined;

  //Guardar en BD
  await usuario.save();

  //redirigir
  req.flash('correcto', 'Password Modificado Correctamente');
  res.redirect('/iniciar-sesion');

}