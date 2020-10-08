import express from 'express'
import bodyParser from 'body-parser'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

// import sequelize connector and User and Message models instances
import { sequelize, User, Message } from './models/db.js'
// Test if database connection is OK else exit
try {
    await sequelize.authenticate() // try to authentificate on the database
    console.log('Connection has been established successfully.')

    //ModelName.sync()
    /*ModelName.sync({ alter: true }) checks what is the current state of the
    table in the database (which columns it has, what are their data types,
    etc), and then performs the necessary changes in the table to make it match
    the model.sync(options) is destructive, so not recommended for production
    sequelize.sync() to automatically synchronize all models.
    await sequelize.sync({ alter: true }); */
    await User.sync({ alter: true }) // modify users table schema if something changed in model
    await Message.sync({ alter: true }) // same for messages table
} catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
}

// Local network configuration
const IP = '172.18.244.162'
const PORT = 7777

const app = express()

/* A middleware for checking if an api key is provided by the user in the
Authorization header. If no key provided in headers we set the HTTP status for
the response code 403 Forbidden access and send response object in JSON format */
const getApiKey = (req, res, next) => {
    const key = req.headers.authorization
    if (!key) {
        res.status(403).json({ code: 403, data: 'No api token' })
    } else {
        next()
    }
}

/* A middleware for checking if an api token is valid and is still active.
if Ok the user performing the request is attached to the req object. */

/*Dans le middleware validateApiKey nous vérifions si l'api key de l'utilisateur
existe, mais nous ne vérifions pas si le champ active est à true dans la table
users. Récrivez ce middleware afin que l'on vérifie si l'api key existe (c'est
déjà le cas), mais aussi que le champ active est bien égal à true. Si un
utilisateur a été blacklisté, il ne faut surtout pas qu'il puisse accéder à
notre api. */

const validateApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        //user is an array with all Objects results (normally 1 element since key is UUID)
        const user = await User.findAll({
            attributes: ['id', 'username', 'email'],
            where: {
                [Op.and]: [{ api_key: key }, { active: true }],
            },
            /* where: {
                api_key: key,
                active: true,
            }, */
        })
        // check if empty results then not found
        if (user.length === 0) {
            res.status(403).json({
                code: 403,
                data: 'Invalid api token or not active',
            })
        } else {
            console.log('USER:', user)
            //we add property of req.user with the value of user an array of 1 object
            // req.user = user
            next()
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
}

/*Créer un middleware getUserByApiKey, qui interviendra après validateApiKey qui
attachera à objet req d'express l'objet user. Cet objet user contiendra les
informations du modèle User: id, username, email, api_key. C'est un middleware
très pratique, ainsi nous pourrons avoir accès aux informations de l'utilisateur
qui effectue la requête depuis req.user */

const getUserByApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            attributes: ['id', 'username', 'email', 'api_key'],
            where: {
                api_key: key,
            },
        })
        req.user = user
        next()
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
}

app.use(bodyParser.urlencoded({ extended: false })) // to support URL-encoded bodies
app.use(bodyParser.json()) // to support JSON-encoded bodies

/*
Endpoint for user registration. Inside API documentation we specify what type of
data we expect as input:
{
    "username": string,
    "email": string
}
*/
app.post('/register', async (req, res) => {
    //check username n'est pas null, pareil pour email
    const username = req.body.username
    const email = req.body.email
    try {
        //on the new row on column username we add value of username variable
        //(req.body.username) and send response with object user created with all attributes
        const user = await User.create({ username: username, email: email })
        res.json({ code: 200, data: user })
    } catch (e) {
        console.log('Error', e)
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

app.use(getApiKey)
app.use(validateApiKey)
app.use(getUserByApiKey)

// GET user by id
app.get('/id/:id', async (req, res) => {
    const id = req.params.id
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { id: id },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET user by username
app.get('/username/:username', async (req, res) => {
    const username = req.params.username
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { username: username },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET user by email
app.get('/email/:email', async (req, res) => {
    const email = req.params.email
    try {
        const user = await User.findAll({
            attributes: ['username', 'email'],
            where: { email: email },
        })
        if (user.length === 0) {
            res.status(404).json({ code: 404, data: 'user not found' })
        } else {
            res.json({ code: 200, data: user })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// GET all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['username', 'email'],
        })
        if (users.length === 0) {
            res.status(404).json({ code: 404, data: 'users not found' })
        } else {
            res.json({ code: 200, data: users })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

/*Créer une route /blacklist qui invalidera un utilisateur en mettant le champ
active de la table users à false pour un id passé en paramètre. Seul le user
avec l'id 1 pourra appeler cette fonction Mettez en place ce système de contrôle
afin que d'autres utilisateurs ne puisse pas appeler cette fonction. Le user
avec l'id 1 est considéré comme l'administrateur de l'application */

app.get('/blacklist/id/:id', async (req, res) => {
    console.log(req.user)
    const idAdmin = 1
    const idBlacklisted = req.params.id
    const idLoggedIn = req.user[0].dataValues.id
    //on empeche que l'admin se blackliste
    if (idLoggedIn == idAdmin && idBlacklisted != idAdmin) {
        try {
            await User.update(
                { active: false },
                {
                    where: {
                        id: idBlacklisted,
                    },
                }
            )
            res.json({
                code: 200,
                data: `id ${idBlacklisted} has been blacklisted`,
            })
        } catch (e) {
            res.status(500).json({ code: 500, data: 'Internal server error' })
        }
    } else {
        res.status(403).json({ code: 403, data: 'Not allowed' })
    }
})

/*Créer une route /whitelist qui revalidera un utilisateur en mettant le champ
active de la table users à true pour un id passé en paramètre. Seul le user avec
l'id 1 pourra appeler cette fonction Mettez en place ce système de contrôle afin
que d'autres utilisateurs ne puisse pas appeler cette fonction. Le user avec
l'id 1 est considéré comme l'administrateur de l'application. */

app.get('/whitelist/id/:id', async (req, res) => {
    const idAdmin = 1
    const idWhitelisted = req.params.id
    const idLoggedIn = req.user[0].dataValues.id
    if (idLoggedIn == idAdmin) {
        try {
            await User.update(
                { active: true },
                {
                    where: {
                        id: idWhitelisted,
                    },
                }
            )
            res.json({
                code: 200,
                data: `id ${idWhitelisted} is valid`,
            })
        } catch (e) {
            res.status(500).json({ code: 500, data: 'Internal server error' })
        }
    } else {
        res.status(403).json({ code: 403, data: 'Not allowed' })
    }
})

/*Ajouter une route /send qui permettra d'envoyer un message depuis
l'utilisateur appelant la fonction, vers un autre utilisateur. Cette route sera
accessible avec une méthode POST pour des utilisateurs avec une api key valide.
Le JSON que nous récupérerons sera au format:
{
  "dst": 2, "content": "Hello, how are you ?"
}
Si nous effectuons une requête POST vers /send avec le JSON précédent, nous
enverrons le message Hello, how are you ? à l'utilisateur d'id 2. Envoyer un
message veut dire l'enregistrer dans la table messages. L'id du sender peut être
récupéré grâce à l'objet req.user créé dans l'exercice précédent. */
app.post('/send', async (req, res) => {
    const idReceiver = req.body.dst
    const idSender = req.user[0].dataValues.id
    const content = req.body.content
    try {
        //on the new row on column username we add value of username variable
        //(req.body.username) and send response with object user created with all attributes
        const message = await Message.create({
            src: idSender,
            dst: idReceiver,
            content,
        })
        res.json({ code: 200, data: message })
    } catch (e) {
        console.log('Error', e)
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

/*Ajouter une route /read qui permettra à l'utilisateur qui effectue la requête
de lire tous ses messages, du plus récent au plus ancien. Les messages retournés
seront aussi bien ceux envoyés que ceux reçus. */

app.get('/read', async (req, res) => {
    const idLoggedIn = req.user[0].dataValues.id
    try {
        const messages = await Message.findAll({
            where: {
                [Op.or]: [{ src: idLoggedIn }, { dst: idLoggedIn }],
            },
            order: [['id', 'DESC']],
        })
        // check if empty results then not found
        if (messages.length === 0) {
            res.status(404).json({
                code: 404,
                data: 'No messages sent or received',
            })
        } else {
            res.json({
                code: 200,
                data: messages,
            })
        }
    } catch (e) {
        res.status(500).json({ code: 500, data: 'Internal server error' })
    }
})

// Start express server
app.listen(PORT, IP, () => {
    console.log(`listening on ${IP}:${PORT}`)
})
