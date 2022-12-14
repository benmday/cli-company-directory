const inquirer = require("inquirer");
const table = require("console.table");
const mysql = require("mysql2");

const db = mysql.createConnection(
  {
    host: "localhost",
    user: "root",
    password: "password",
    database: "directory_db",
  },
  console.log(`Connected to the directory_db database.`)
);

function mainMenu() {
  inquirer
    .prompt({
      type: "list",
      name: "selection",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "Add Employee",
        "Update Employee Role",
        "View All Departments",
        "Add Department",
        "View All Roles",
        "Add Role",
        "Exit",
      ],
    })
    .then((answers) => {
      if (answers.selection === "View All Employees") {
        viewEmployees();
      }
      if (answers.selection === "Add Employee") {
        addEmployee();
      }
      if (answers.selection === "Update Employee Role") {
        updateEmployeeRole();
      }
      if (answers.selection === "View All Departments") {
        viewDepartments();
      }
      if (answers.selection === "Add Department") {
        addDepartment();
      }
      if (answers.selection === "View All Roles") {
        viewRoles();
      }
      if (answers.selection === "Add Role") {
        addRole();
      }
      if (answers.selection === "Exit") {
        console.log("Bye!");
        db.end();
      }
    });
}

//query functions
async function viewEmployees() {
  await db
    .promise()
    .query(
      `SELECT 
        e.id
      , e.first_name
      , e.last_name
      , r.name AS title
      , d.name AS department
      , r.salary
      , CASE
        WHEN e.manager_id IS NOT NULL THEN CONCAT(manager.first_name," ", manager.last_name)
        END AS manager 
      FROM employees AS e 
        LEFT JOIN roles AS r 
          ON e.role_id = r.id 
        LEFT JOIN departments AS d 
          ON r.department_id = d.id 
        LEFT JOIN employees AS manager 
          ON manager.id = e.manager_id
      ;`
    )
    .then(([rows, _fields]) => {
      console.table(rows);
    });

  mainMenu();
}

async function addEmployee() {
  await db
    .promise()
    .query(`SELECT * FROM roles;`)
    .then(([rows, _fields]) => {
      const roleNames = rows.map(({ id, name }) => ({
        name,
        value: id,
      }));

      inquirer
        .prompt([
          {
            name: "firstName",
            message: "Please enter employee's first name:",
          },
          {
            name: "lastName",
            message: "Please enter employee's last name:",
          },
          {
            type: "list",
            name: "employeeRole",
            message: "What is the employee's role?",
            choices: roleNames,
          },
        ])
        .then((answers) => {
          db.promise()
            .query(
              `INSERT INTO employees (first_name, last_name, role_id)
            VALUES (?, ?, ?);`,
              [answers.firstName, answers.lastName, answers.employeeRole]
            )
            .then(
              db
                .promise()
                .query(`SELECT first_name, last_name, id FROM employees;`)
                .then(([rows, _fields]) => {
                  const managerNames = rows.map(
                    ({ first_name, last_name, id }) => ({
                      name: first_name + " " + last_name,
                      value: id,
                    })
                  );
                  inquirer
                    .prompt({
                      type: "list",
                      name: "manager",
                      message: "Who is the employee's manager?",
                      choices: managerNames,
                    })
                    .then((choice) => {
                      db.promise()
                        .query(
                          `UPDATE employees
                      SET manager_id = ?
                      WHERE id = ?;`,
                          [choice.manager, rows.length]
                        )
                        .then(
                          console.log(
                            `New employee ${
                              answers.firstName + " " + answers.lastName
                            } added!`
                          ),
                          mainMenu()
                        );
                    });
                })
            );
        });
    });
}

function updateEmployeeRole() {
  db.promise()
    .query(`SELECT first_name, last_name, id FROM employees;`)
    .then(([rows, _fields]) => {
      const employeeNames = rows.map(({ first_name, last_name, id }) => ({
        name: first_name + " " + last_name,
        value: id,
      }));
      inquirer
        .prompt({
          type: "list",
          name: "employee",
          message: "Which employee would you like to update the role of?",
          choices: employeeNames,
        })
        .then((answer) => {
          db.promise()
            .query(`SELECT * FROM roles;`)
            .then(([rows, _fields]) => {
              const roleNames = rows.map(({ id, name }) => ({
                name,
                value: id,
              }));

              inquirer
                .prompt([
                  {
                    type: "list",
                    name: "employeeRole",
                    message:
                      "What would you like to update this employee's role to?",
                    choices: roleNames,
                  },
                ])
                .then((choice) => {
                  db.promise()
                    .query(
                      `UPDATE employees
                SET role_id = ?
                WHERE id = ?;`,
                      [choice.employeeRole, answer.employee]
                    )
                    .then(console.log("Role updated!"), mainMenu());
                });
            });
        });
    });
}

async function viewDepartments() {
  await db
    .promise()
    .query(`SELECT * FROM departments;`)
    .then(([rows, _fields]) => {
      console.table(rows);
    });

  mainMenu();
}

async function addDepartment() {
  await inquirer
    .prompt({
      name: "department",
      message: "What is the department name?",
    })
    .then((answers) => {
      db.promise()
        .query(`INSERT INTO departments (name) VALUES (?);`, answers.department)
        .then(
          console.log(answers.department + " department added!"),
          mainMenu()
        );
    });
}

async function viewRoles() {
  await db
    .promise()
    .query(
      `SELECT 
        r.name AS title
        , d.name AS department_name
        , r.salary 
      FROM roles AS r 
        LEFT JOIN departments AS d 
          ON r.department_id = d.id
      ;`
    )
    .then(([rows, _fields]) => {
      console.table(rows);
    });

  mainMenu();
}

function addRole() {
  db.promise()
    .query(`SELECT * FROM departments;`)
    .then(([rows, _fields]) => {
      const deptNames = rows.map(({ id, name }) => ({
        name,
        value: id,
      }));

      inquirer
        .prompt([
          {
            name: "name",
            message: "What is the name of the role?",
          },
          {
            name: "salary",
            message: "What is the salary of the role?",
          },
          {
            type: "list",
            name: "department_id",
            message: "Which department does this role fall under?",
            choices: deptNames,
          },
        ])
        .then((role) => {
          db.query(
            `INSERT INTO roles (name, salary, department_id) VALUES (?, ?, ?);`,
            [role.name, role.salary, role.department_id],
            (err, _results) => {
              if (err) {
                console.error(err);
              }
              if (!err) {
                console.log(`New role ${role.name} added!`);
                mainMenu();
              }
            }
          );
        });
    });
}

module.exports = { mainMenu };
