/*yarn add sequelize pg pg-hstore
to manually install the driver for my database of choice Postgres */
import Sequelize from 'sequelize'

/*To connect to the database, you must create a Sequelize instance by passing
the connection parameters separately to the Sequelize constructor. Sequelize
refers to the library itself (Class) while sequelize refers to an instance of Sequelize, an Object
which represents a connection to one database
parameters: 'database', 'username', 'password', Object for configuration*/
const sequelize = new Sequelize('db_api1', 'db_user', 'strongpassword123', {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
    define: {
        //prevent sequelize from pluralizing table names: table name becomes plural of model name
        freezeTableName: true,
        // prevent sequelize from adding timestamps createdAt and updatedAt columns in tables
        //timestamps: false,
    },
    /*By default, Sequelize will log to console every SQL query it performs. logging:false disables logging */
    //logging: false,
})

//.authenticate() function to test if the connection is OK:
try {
    await sequelize.authenticate()
    console.log('Connection has been established successfully.')
} catch (error) {
    console.error('Unable to connect to the database:', error)
}
