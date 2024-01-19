'use strict'
const {
  Model
} = require('sequelize')
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate (models) {
      // define association here
      Chapter.belongsTo(models.Course, {
        foreignKey: 'courseId'
      })
      Chapter.hasMany(models.Page, {
        foreignKey: 'chapterId'
      })
    }

    static addChapter ({ name, description, courseId }) {
      return this.create({
        name,
        description,
        courseId
      })
    }

    static getChapters (courseId) {
      return this.findAll({
        where: {
          courseId
        }
      })
    }
  }
  Chapter.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    courseId: DataTypes.INTEGER,
    order: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Chapter'
  })
  return Chapter
}
