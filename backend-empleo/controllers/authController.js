'user strict'

const validator = require('validator');
const Usuario = require('../model/usuario');

const generarJWT = require('../middlewares/generarJWT');

const {googleVerify} = require('../middlewares/googleVerify');

const controlador = {


    registrar: async (req, res) => {

        const params = req.body;

        try {

            var validacionNombre = !validator.isEmpty(params.nombre);
            var validacionApellido = !validator.isEmpty(params.apellido);
            var validacionEmail = !validator.isEmpty(params.email);
            var validacionPassoword = !validator.isEmpty(params.password);

        } catch (error) {

            return res.status(400).send({
                status: "error",
                msg: "Faltan datos por enviar"
            });
        }

        if (validacionNombre && validacionApellido && validacionEmail && validacionPassoword == true) {

            const emailExist = await Usuario.findOne({ email: params.email });

            if (emailExist) return res.status(400).send({ msg: "Este usuario ya existe" });

            await Usuario.create(params, (error, usuario) => {

                if (error || !usuario) {

                    return res.status(400).send({
                        status: "error",
                        msg: "Se ha producido un problema",
                        destalle: error
                    })
                }

                const token = generarJWT(usuario._id);

                return res.status(200).send({
                    status: "Bien",
                    token: token,
                    usuario
                })
            });


        } else {
            return res.status(404).send({
                msg: 'Los datos no son validos'
            });
        }

    },

    login: async (req, res) => {

        const params = req.body;

        try {
            var emailValidator = !validator.isEmpty(params.email);
            var passwordValidator = !validator.isEmpty(params.password);

        } catch (error) {

            return res.status(400).send({
                status: "error",
                msg: "Faltan datos por enviar"
            });
        }
        if (emailValidator && passwordValidator == true) {


            const usuario = await Usuario.findOne({ email: params.email });

            if (!usuario) return res.status(400).send({ status: "error", msg: "Este usuario no existe" });

            const validPass = await usuario.comparaPassword(params.password);

            if (!validPass) return res.status(400).send({ status: "error", msg: "Esta contrasena es incorrecta" });

            const token = generarJWT(usuario._id);

            res.header('auth-token', token).send(
                {
                    status: "OK",
                    token,
                    usuario
                }
            );
        }

    },

    renewnew: async (req , res)=>{

        const id = req.usuario.id;

        const token = generarJWT(id);

        return res.status(200).send({

            status: "OK",
            token
        })

    },

    googleSignIn: async(req, res)=>{

        const token = req.body.token;

        try {
            const { name, email, picture } = await googleVerify(token);

            const usuarios = await Usuario.findOne({ email });
            let usuario;

            if (!usuarios) {

                usuario = new User({

                    email: email,
                    password: "123",
                    google: true

                });
            } else {

                usuario = usuarios;
                usuario.google = true;
            }

            const newuser =  Usuario.create(usuario,async (err, user) => {

                if(err || !user){

                    return res.status(400).send({
                        status:'error',
                        msg: "se ha producido un error a guardar este usuario",
                        err
                    })
                }

                return await res.status(200).send({

                    status: "OK",
                    user,
                });

                
            });

        } catch (error) {

            return await res.status(200).send({

                status: "error",
                msg: "Token no es correcto",
                error
            });
        }
    }


}



module.exports = controlador;