'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Completion extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      Completion.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      })
      Completion.belongsTo(models.Page, {
        foreignKey: 'pageId',
        onDelete: 'CASCADE'
      })
    }
  }
  Completion.init({
    userId: DataTypes.INTEGER,
    pageId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Completion'
  })
  return Completion
}
