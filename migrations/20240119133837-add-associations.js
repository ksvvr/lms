'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Courses', 'userId', {
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('Courses', {
      fields: ['userId'],
      type: 'foreign key',
      references: {
        table: 'Users',
        field: 'id'
      }
    })

    await queryInterface.addColumn('Chapters', 'courseId', {
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('Chapters', {
      fields: ['courseId'],
      type: 'foreign key',
      references: {
        table: 'Courses',
        field: 'id'
      }
    })

    await queryInterface.addColumn('Pages', 'chapterId', {
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('Pages', {
      fields: ['chapterId'],
      type: 'foreign key',
      references: {
        table: 'Chapters',
        field: 'id'
      }
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Courses', 'userId')
    await queryInterface.removeColumn('Chapters', 'courseId')
    await queryInterface.removeColumn('Pages', 'chapterId')
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
}
