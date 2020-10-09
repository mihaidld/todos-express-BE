import DataTypes from 'sequelize'

export default (sequelize) => {
    const User = sequelize.define('users', {
        //users est le nom de la table
        id: {
            // colonne id
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            // colonne name
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
    })

    return User
}
