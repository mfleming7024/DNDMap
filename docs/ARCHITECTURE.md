# Architecture

The D&D Map project is a single-page application (SPA) with a Node.js backend.

## Frontend

*   **Framework**: [AngularJS (v1.x)](https://angularjs.org/)
*   **Mapping Library**: [Leaflet.js](https://leafletjs.com/)
*   **Styling**: [Sass](https://sass-lang.com/)

The frontend is a single-page application that renders an interactive map. The main view is defined in `index.html` and the core logic is in `js/map/MapController.js`. The application communicates with the backend via a RESTful API, which is accessed through the `MongoURLService` in `js/services/MongoURLService.js`.

## Backend

*   **Framework**: [Node.js](https://nodejs.org/) with [Express](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/)

The backend server is a Node.js application that provides a RESTful API for the frontend. The server logic is located in `mongo.js`. It handles requests for map data, points of interest, and other resources, interacting with the MongoDB database to store and retrieve data.

## API

The API provides endpoints for fetching and manipulating map data. Key endpoints include:
*   `GET /getMaps`
*   `GET /getPoints/:mapName`
*   `POST /addPoint`
*   `DELETE /deletePoint`
*   `POST /askBard`

The frontend service `js/services/MongoURLService.js` contains the full list of API endpoints consumed by the client.
