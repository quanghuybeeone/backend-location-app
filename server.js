const express = require('express');
const cors = require('cors');
const locationController = require('./controllers/locationController');
const sequelize = require('./db.js'); 
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

app.get('/ssesent',locationController.sendSSEEvent)
// Define the endpoints for location operations
app.get('/',(req, res) => {
    res.send('<h1>Api Location</h1>');
  });
app.get('/locations', locationController.getLocations);
app.get('/locations/:id', locationController.getLocationById);
app.post('/locations', locationController.createLocation);
app.put('/locations/:id', locationController.updateLocation);
app.delete('/locations/:id', locationController.deleteLocation);
app.post('/submit-location', locationController.submitLocation);
app.get('/sse', locationController.sendSSEEvent)

// Start the server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}/`);
  });
});
