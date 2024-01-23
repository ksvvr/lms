'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      Course.belongsTo(models.User, {
        foreignKey: 'userId'
      })
      Course.hasMany(models.Chapter, {
        foreignKey: 'courseId'
      })
      Course.hasMany(models.Enrollment, {
        foreignKey: 'courseId'
      })
    }

    static addCourse ({ name, description, userId }) {
      return this.create({
        name,
        description,
        userId
      })
    }

    static getCourses (userId) {
      return this.findAll({
        where: {
          userId
        }
      })
    }

    static getAllCourses () {
      return this.findAll()
    }

    static getCourse (id) {
      return this.findAll({
        where: {
          id
        }
      })
    }

    static async remove (id, userId) {
      return this.destroy({
        where: {
          id,
          userId
        }
      })
    }
  }
  Course.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: 10
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: true,
        len: 10
      }
    },
    educatorId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Course'
  })
  return Course
}
