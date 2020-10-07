import Sequelize from 'sequelize'
import message from './message.js'
import user from './user.js'

//exporte un connecteur sequelize et les modèles User et Message
export const sequelize = new Sequelize(
    'db_api1',
    'db_user',
    'strongpassword123',
    {
        host: 'localhost',
        port: 5432,
        dialect: 'postgres',
        define: {
            //prevent sequelize from pluralizing table names
            freezeTableName: true,
            // prevent sequelize from adding timestamps column in tables
            //timestamps: false,
        },
        //logging: false,
    }
)
//on appelle les fonctions retournant les modeles et exporte les modeles
export const User = user(sequelize)
export const Message = message(sequelize)
