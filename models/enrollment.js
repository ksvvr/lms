'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      Enrollment.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      })
      Enrollment.belongsTo(models.Course, {
        foreignKey: 'courseId',
        onDelete: 'CASCADE'
      })
    }

    static newEnroll ({ userId, courseId }) {
      return this.create({
        userId,
        courseId
      })
    }

    static deEnroll ({ userId, courseId }) {
      return this.destroy({
        where: {
          userId,
          courseId
        }
      })
    }

    static getCourses (userId) {
      return this.findAll({
        where: {
          userId
        }
      })
    }
  }
  Enrollment.init({
    userId: DataTypes.INTEGER,
    courseId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Enrollment'
  })
  return Enrollment
}
