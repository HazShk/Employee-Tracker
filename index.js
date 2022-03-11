//dependencies
const mysql = require("mysql");
const util = require("util");
const inquirer = require("inquirer");

//Prepare database connection
const database = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "password",
  database: "employee_tracker",
});

//connect database
database.connect((error) => {
  if (error) console.log(error);
  else console.log("Database connected");
  init();
});

//promisify the query to use await
database.query = util.promisify(database.query);

//initial function for the app and it will be used recursievly in handlers function
const init = async () => {
  try {
    const answer = await inquirer.prompt({
      name: "action",
      type: "list",
      message: "What would you like to do?",
      choices: [
        "View Employees",
        "View Departments",
        "View Roles",
        "Add Employees",
        "Add Department",
        "Add Role",
        "Update Employee Role",
        "Exit",
      ],
    });

    //Check the input and do actions according the result
    switch (answer.action) {
      case "View Employees":
        viewEmployees();
        break;

      case "View Departments":
        viewDepartments();
        break;

      case "View Roles":
        viewRoles();
        break;

      case "Add Employees":
        addEmployee();
        break;
      case "Add Department":
        addDepartment();
        break;

      case "Add Role":
        addRole();
        break;

      case "Update Employee Role":
        updateEmployee();
        break;
      case "Exit":
        database.end();
        break;
    }
  } catch (error) {
    console.log(error);
    init();
  }
};

//Handler function for view all employees
const viewEmployees = async () => {
  try {
    let query = "SELECT * FROM employee";
    const result = await database.query(query);
    if (result) {
      const employees = [];
      result.forEach((employee) => employees.push(employee));
      console.table(employees);
      init();
    }
  } catch (err) {
    console.log(err);
    init();
  }
};

//Handler function for view all Departments
const viewDepartments = async () => {
  try {
    let query = "SELECT * FROM department";
    const result = await database.query(query);
    if (result) {
      const departments = [];
      result.forEach((department) => departments.push(department));
      console.table(departments);
      init();
    }
  } catch (err) {
    console.log(err);
    init();
  }
};

//Handler function to view all roles
const viewRoles = async () => {
  try {
    let query = "SELECT * FROM role";
    const result = await database.query(query);
    if (result) {
      const roles = [];
      result.forEach((role) => roles.push(role));
      console.table(roles);
      init();
    }
  } catch (err) {
    console.log(err);
    init();
  }
};

//Handler function to add an employee
const addEmployee = async () => {
  try {
    const roles = await database.query("SELECT * FROM role");

    const managers = await database.query("SELECT * FROM employee");

    let answer = await inquirer.prompt([
      {
        name: "firstName",
        type: "input",
        message: "What is the first name of the Employee?",
      },
      {
        name: "lastName",
        type: "input",
        message: "What is the last name of the Employee?",
      },
      {
        name: "employeeRoleId",
        type: "list",
        choices: roles.map((role) => {
          return {
            name: role.title,
            value: role.id,
          };
        }),
        message: "What is role of the employee?",
      },
      {
        name: "employeeManagerId",
        type: "list",
        choices: managers.map((manager) => {
          return {
            name: `${manager.first_name} ${manager.last_name}`,
            value: manager.id,
          };
        }),
        message: "Who is the Manager of this Employee?",
      },
    ]);

    await database.query("INSERT INTO employee SET ?", {
      first_name: answer.firstName,
      last_name: answer.lastName,
      role_id: answer.employeeRoleId,
      manager_id: answer.employeeManagerId,
    });

    console.log(
      `${answer.firstName} ${answer.lastName} added successfully as an employee.\n`
    );
    init();
  } catch (err) {
    console.log(err);
    init();
  }
};

//Handler function to add Department
const addDepartment = async () => {
  try {
    const answer = await inquirer.prompt([
      {
        name: "deptName",
        type: "input",
        message: "What is the name of department?",
      },
    ]);

    await database.query("INSERT INTO department SET ?", {
      department_name: answer.deptName,
    });

    console.log(`${answer.deptName} Department Added Successfully.\n`);
    init();
  } catch (err) {
    console.log(err);
    init();
  }
};

//Handler function to add role
const addRole = async () => {
  try {
    const departments = await database.query("SELECT * FROM department");

    const answer = await inquirer.prompt([
      {
        name: "title",
        type: "input",
        message: "What is the name of role?",
      },
      {
        name: "salary",
        type: "input",
        message: "What is the salary of this role?",
      },
      {
        name: "departmentId",
        type: "list",
        choices: departments.map((department) => {
          return {
            name: department.department_name,
            value: department.id,
          };
        }),
        message: "What will be the department of this role?",
      },
    ]);

    let selectedDepartment;

    departments.forEach((department) => {
      if (department.department_id === answer.choice) {
        selectedDepartment = department;
      }
    });

    await database.query("INSERT INTO role SET ?", {
      title: answer.title,
      salary: answer.salary,
      department_id: answer.departmentId,
    });

    console.log(`${answer.title} role added successfully.\n`);
    init();
  } catch (err) {
    console.log(err);
    init();
  }
};

//Handler function to update Employee
const updateEmployee = async () => {
  try {
    const employees = await database.query("SELECT * FROM employee");

    const selectEmployee = await inquirer.prompt([
      {
        name: "employee",
        type: "list",
        choices: employees.map((employeeName) => {
          return {
            name: `${employeeName.first_name} ${employeeName.last_name}`,
            value: employeeName.id,
          };
        }),
        message: "Choose an employee to update",
      },
    ]);

    let roles = await database.query("SELECT * FROM role");

    let selectRole = await inquirer.prompt([
      {
        name: "role",
        type: "list",
        choices: roles.map((role) => {
          return {
            name: role.title,
            value: role.id,
          };
        }),
        message: "Assign a new role to the employee",
      },
    ]);

    await database.query("UPDATE employee SET ? WHERE ?", [
      { role_id: selectRole.role },
      { id: selectEmployee.employee },
    ]);

    console.log(`Role updated successfully.\n`);
    init();
  } catch (err) {
    console.log(err);
    init();
  }
};
