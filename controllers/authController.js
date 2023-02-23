const passport = require("passport");
const mongoose = require("mongoose");
const Vacante = mongoose.model("Vacante");

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
