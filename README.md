# Secure Web-Based Blog System

## Overview

This project is a secure web-based blog system developed as part of the CMP-6045B - Developing Secure Software module. It is designed to mitigate common web security vulnerabilities and provide a usable platform for creating and managing blog posts.

## Features

- **User Authentication:** Registration and login functionality.
- **Blog Management:** Ability to add, edit, and delete blog posts.
- **Search Functionality:** Search for posts within the blog.
- **Security Mitigations:**
  - Account Enumeration protection
  - Session Hijacking protection
  - SQL Injection protection
  - Cross-Site Scripting (XSS) protection
  - Cross-Site Request Forgery (CSRF) protection
- **Enhanced Security:**
  - Hashing and/or salting for password storage
  - Encryption
  - Additional authentication method (e.g., 2FA, graphical password)

## Technologies Used

- JavaScript
- Node.js
- PostgreSQL

## Setup

1.  **Prerequisites:**
    - Node.js and npm installed
    - PostgreSQL installed and running
2.  **Installation:**
    - Clone the repository.
    - Install dependencies: `npm install`
    - Set up the PostgreSQL database and update the connection details in the application configuration.
3.  **Running the Application:**
    - Start the server: `npm start`
    - Access the application in your web browser.

## Group Client Flyer

A client flyer detailing the key security features is included in the submission as a PDF document.

## Trello Board

The project's [Trello](https://trello.com/b/YG88tGfh/dss2024-25-002-ug08) board, used for task management and tracking, is available for review.

## Google reCAPTCHA

To access [Google reCAPTCHA admin console](https://www.google.com/recaptcha/admin/site/721152739).

<!-- ## Project Structure -->

<!-- * \`\`\`
    /
    ├── README.md
    ├── ... (other project files and directories)
    ├── client-flyer.pdf (Group Client Flyer)
    └── ...
    \`\`\` -->

<!-- ## How to Load and Run the Code

(Details on specific commands, database setup, environment variables, etc.) -->
