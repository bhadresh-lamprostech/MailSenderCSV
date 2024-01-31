const fs = require("fs");
const csv = require("csv-parser");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Read the CSV file
const users = [];

fs.createReadStream("./userdata.csv")
  .pipe(csv())
  .on("data", (row) => {
    users.push(row);
  })
  .on("end", () => {
    console.log("CSV file successfully read.");
    // Send emails in batches
    sendEmailsInBatches(users);
  });

// Function to send emails in batches
function sendEmailsInBatches(users) {
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    sendEmails(batch);
  }
}

// Function to send emails
function sendEmails(users) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Set to true if using a secure connection (TLS/SSL)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  transporter.on("error", (error) => {
    console.error(`Transporter error: ${error.message}`);
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error(`Verification error: ${error.message}`);
    } else {
      console.log("SMTP server connection verified.");
      // Continue with sending emails
      users.forEach((user) => {
        const mailOptions = {
          from: process.env.SMTP_USER,
          to: user.user_email,
          subject: "Screening Test Login Credentials - Lampros Tech Labs",
          text: `Dear Candidate,

Here are your login credentials for taking the Screening Test.
User email: ${user.user_email}
Password: ${user.user_password}
Screening Test Link: https://screeningv1.lampros.tech/

All the best for the test.

Best regards,
Team HR
Lampros Tech Labs Pvt Ltd`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(
              `Error sending email to ${user.user_email}: ${error.message}`
            );
          } else {
            console.log(`Email sent to ${user.user_email}: ${info.response}`);
          }
        });
      });
    }
  });
}
