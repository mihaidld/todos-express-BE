import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import Sequelize from 'sequelize'
const Op = Sequelize.Op

// import sequelize connector and User and Todo models instances
import { sequelize, User, Todo } from './models/db.js'

// Test if database connection is OK else exit
try {
    await sequelize.authenticate() // try to authentificate on the database
    console.log('Connection has been established successfully.')
    await User.sync({ alter: true }) // modify users table schema if something changed in model
    await Todo.sync({ alter: true }) // same for todos table
} catch (error) {
    console.error('Unable to connect to the database:', error)
    process.exit(1)
}

// Local network configuration
const IP = '172.18.246.84'
const PORT = 7777

const app = express()

/* middleware for checking if an api key is provided by the user in the
Authorization header*/
const getApiKey = (req, res, next) => {
    const key = req.headers.authorization
    if (!key) {
        res.status(403).json({
            code: 403,
            data: { valid: false, message: 'No api token' },
        })
    } else {
        next()
    }
}

/* middleware for checking if an api token is valid*/
const validateApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            attributes: ['id', 'name'],
            where: { api_key: key },
        })
        // check if empty results then not found
        if (user.length === 0) {
            res.status(403).json({
                code: 403,
                data: {
                    valid: false,
                    message: 'Invalid api token, please register',
                },
            })
        } else {
            console.log('USER:', user)
            next()
        }
    } catch (e) {
        res.status(500).json({
            code: 500,
            data: { valid: false, message: 'Internal server error' },
        })
    }
}

/*middleware getUserByApiKey to attach user information to req object */
const getUserByApiKey = async (req, res, next) => {
    const key = req.headers.authorization
    try {
        const user = await User.findAll({
            attributes: ['id', 'name', 'api_key'],
            where: {
                api_key: key,
            },
        })
        req.user = user
        next()
    } catch (e) {
        res.status(500).json({
            code: 500,
            data: { valid: false, message: 'Internal server error' },
        })
    }
}

//rajouter middleware CORS
/* app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'DELETE, POST, GET, OPTIONS')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    res.header('Access-Control-Allow-Headers', 'authorization')
    res.header('Access-Control-Allow-Headers', 'Authorization')
    next()
}) */

app.use(cors())
app.options('*', cors())

app.use(bodyParser.urlencoded({ extended: false })) // to support URL-encoded bodies
app.use(bodyParser.json()) // to support JSON-encoded bodies

/*
Endpoint for user registration. Inside API documentation we specify what type of
data we expect as input:
{
    "name": string
}
*/
app.post('/register', async (req, res) => {
    const name = req.body.name
    try {
        const user = await User.create({ name: name })
        res.json({ code: 200, data: { valid: true, user } })
    } catch (e) {
        console.log('Error', e)
        res.status(500).json({
            code: 500,
            data: { valid: false, message: 'Internal server error' },
        })
    }
})

app.use(getApiKey)
app.use(validateApiKey)
app.use(getUserByApiKey)

/*Expect from client {"task": string}*/
//Create a todo
app.post('/create', async (req, res) => {
    console.log(req.user)
    const idLoggedIn = req.user[0].dataValues.id
    const task = req.body.task
    try {
        const todo = await Todo.create({
            owner_id: idLoggedIn,
            task,
        })
        const todos = await Todo.findAll({
            where: { owner_id: idLoggedIn },
            order: [['updatedAt', 'DESC']],
        })
        res.json({ code: 200, valid: true, data: todos })
    } catch (e) {
        console.log('Error', e)
        res.status(500).json({
            code: 500,
            valid: false,
            data: 'Internal server error',
        })
    }
})

/*Expect from client /delete/:id*/
//Delete a todo
app.post('/delete/:id', async (req, res) => {
    const idTask = req.params.id
    const idLoggedIn = req.user[0].dataValues.id

    try {
        const todo = await Todo.findAll({
            attributes: ['id', 'task'],
            where: {
                [Op.and]: [{ owner_id: idLoggedIn }, { id: idTask }],
            },
        })
        // check if empty results then there is no task with this id for user
        if (todo.length === 0) {
            res.status(403).json({
                valid: true,
                code: 403,
                data: 'There is no task with this id for this user',
            })
        } else {
            await Todo.destroy({
                where: {
                    [Op.and]: [{ owner_id: idLoggedIn }, { id: idTask }],
                },
            })
            const todos = await Todo.findAll({
                where: { owner_id: idLoggedIn },
                order: [['updatedAt', 'DESC']],
            })
            res.json({ code: 200, valid: true, data: todos })
        }
    } catch (e) {
        res.status(500).json({
            code: 500,
            valid: false,
            data: 'Internal server error',
        })
    }
})

/*Expect from client /done/:id*/
//Change status of a todo to done
app.post('/done/:id', async (req, res) => {
    const idTask = req.params.id
    const idLoggedIn = req.user[0].dataValues.id

    try {
        const todo = await Todo.findAll({
            attributes: ['id', 'task'],
            where: {
                [Op.and]: [{ owner_id: idLoggedIn }, { id: idTask }],
            },
        })
        // check if empty results then there is no task with this id for user
        if (todo.length === 0) {
            res.status(403).json({
                valid: true,
                code: 403,
                data: 'There is no task with this id for this user',
            })
        } else {
            await Todo.update(
                { done: true },
                {
                    where: {
                        [Op.and]: [{ owner_id: idLoggedIn }, { id: idTask }],
                    },
                }
            )
            const todos = await Todo.findAll({
                where: { owner_id: idLoggedIn },
                order: [['updatedAt', 'DESC']],
            })
            res.json({ code: 200, valid: true, data: todos })
        }
    } catch (e) {
        res.status(500).json({
            valid: false,
            code: 500,
            data: 'Internal server error',
        })
    }
})

/*Expect from client /undone/:id*/
//Change status of a todo to undone
app.post('/undone/:id', async (req, res) => {
    const idTask = req.params.id
    const idLoggedIn = req.user[0].dataValues.id

    try {
        const todo = await Todo.findAll({
            attributes: ['id', 'task'],
            where: {
                [Op.and]: [{ owner_id: idLoggedIn }, { id: idTask }],
            },
        })
        // check if empty results then there is no task with this id for user
        if (todo.length === 0) {
            res.status(403).json({
                valid: true,
                code: 403,
                data: 'There is no task with this id for this user',
            })
        } else {
            await Todo.update(
                { done: false },
                {
                    where: {
                        [Op.and]: [{ owner_id: idLoggedIn }, { id: idTask }],
                    },
                }
            )
            const todos = await Todo.findAll({
                where: { owner_id: idLoggedIn },
                order: [['updatedAt', 'DESC']],
            })
            res.json({ code: 200, valid: true, data: todos })
        }
    } catch (e) {
        res.status(500).json({
            valid: false,
            code: 500,
            data: 'Internal server error',
        })
    }
})

/* Expect from client /list/:all to show all todos, /list/:undone to show all undone todos, /list/:done to show all todos done */
// GET todos by filter
app.get('/list/:filter', async (req, res) => {
    const filter = req.params.filter
    const idLoggedIn = req.user[0].dataValues.id
    try {
        let todos = []
        switch (filter) {
            case 'undone':
                todos = await Todo.findAll({
                    where: {
                        [Op.and]: [{ owner_id: idLoggedIn }, { done: false }],
                    },
                    order: [['updatedAt', 'DESC']],
                })
                break
            case 'done':
                todos = await Todo.findAll({
                    where: {
                        [Op.and]: [{ owner_id: idLoggedIn }, { done: true }],
                    },
                    order: [['updatedAt', 'DESC']],
                })
                break
            default:
                todos = await Todo.findAll({
                    where: { owner_id: idLoggedIn },
                    order: [['updatedAt', 'DESC']],
                })
        }
        // check if empty results then not found
        if (todos.length === 0) {
            res.status(404).json({
                valid: true,
                code: 404,
                data: `No todos for filter ${filter} `,
            })
        } else {
            res.json({
                valid: true,
                code: 200,
                data: todos,
            })
        }
    } catch (e) {
        res.status(500).json({
            valid: false,
            code: 500,
            data: 'Internal server error',
        })
    }
})

// Start express server
app.listen(PORT, IP, () => {
    console.log(`listening on ${IP}:${PORT}`)
})
