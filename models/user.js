'use strict'
const bcrypt = require('bcrypt')
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      User.hasMany(models.Course, {
        foreignKey: 'userId'
      })
      // define association here
    }

    async comparePassword (password) {
      return bcrypt.compare(password, this.password)
    }
  }
  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true
        }
      },
      lastName: DataTypes.STRING,
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notNull: true,
          notEmpty: true
        }
      },
      isEducator: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: true,
          notEmpty: true
        }
      }
    },
    {
      sequelize,
      modelName: 'User'
    }
  )
  return User
}
