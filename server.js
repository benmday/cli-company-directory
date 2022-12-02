const express = require("express");
const mysql = require("mysql2");
const inquirer = require("inquirer");

const app = express();

//middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const db = mysql.createConnection(
  {
    host: "localhost",
    user: "root",
    password: "password",
    database: "directory_db",
  },
  console.log(`Connected to the directory_db database.`)
);

db.query(`DELETE FROM departments where name = "IT"`, (err, result) =>
  err ? console.error(err) : console.log("Department added!")
);

db.query(`SELECT * FROM departments`, (err, result) =>
  err ? console.error(err) : console.table(result)
);
