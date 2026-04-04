# Getting Started

This guide will help you get a local copy of the project up and running for development and testing purposes.

## Prerequisites

*   [Node.js](https://nodejs.org/)
*   [npm](https://www.npmjs.com/get-npm)
*   A running [MongoDB](https://www.mongodb.com/) instance.

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    ```
2.  Install NPM packages:
    ```bash
    npm install
    ```

## Running the Application

1.  **Start the backend server:**
    The backend is a Node.js server that connects to MongoDB. You will need to configure the connection string in `mongo.js`.
    ```bash
    node mongo.js
    ```
2.  **Start the frontend development server:**
    The frontend is an AngularJS application. The development server will run on `localhost:8000`.
    ```bash
    npm start
    ```
3.  **Update API URL for local development:**
    The frontend service in `js/services/MongoURLService.js` is hardcoded to point to a production URL. You will need to change it to point to your local backend server (e.g., `http://localhost:3000`).
