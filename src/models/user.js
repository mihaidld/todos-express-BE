import DataTypes from 'sequelize'
//déclare une fonction qu'on exporte par default retournant un modèle User
//(d'habitude nom modele au singulier)
export default (sequelize) => {
    /* parameters of sequelize.define() which defines the model:the name of the
    table in the database (usually plural) and model attributes = which columns
    it has (and their data types). If there is no defaultValue the default value
    of a column is NULL */
    const User = sequelize.define('users', {
        //users est le nom de la table
        id: {
            // colonne id
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        username: {
            // colonne username
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: false,
        },
        email: {
            // colonne email
            type: DataTypes.STRING(30),
            unique: true,
            allowNull: false,
        },
        api_key: {
            // colonne api_key
            type: DataTypes.UUID,
            unique: true,
            defaultValue: DataTypes.UUIDV1,
        },
        active: {
            // est ce que la l'api_key est toujours valide
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    })

    return User
}
