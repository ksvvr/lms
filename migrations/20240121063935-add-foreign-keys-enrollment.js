'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.addConstraint('Enrollments', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_enrollment_userId',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE'
    })

    await queryInterface.addConstraint('Enrollments', {
      fields: ['courseId'],
      type: 'foreign key',
      name: 'fk_enrollment_courseId',
      references: {
        table: 'Courses',
        field: 'id'
      },
      onDelete: 'CASCADE'
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeConstraint('Enrollments', 'fk_enrollment_userId')
    await queryInterface.removeConstraint('Enrollments', 'fk_enrollment_courseId')
  }
}
