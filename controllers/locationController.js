const Location = require('../models/Location');
const { Op } = require('sequelize');

let clients = [];
let lastChangeTimestamp = null;
let lastLocations = null;

// GET /locations
exports.getLocations = async (req, res) => {
    try {
        const locations = await Location.findAll({
            order: [['id', 'ASC']]
        });
        // Update lastLocations with the current locations
        lastLocations = locations;
        res.json(locations);
        
    } catch (err) {
        console.error('Error retrieving locations', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// GET /locations/:id
exports.getLocationById = async (req, res) => {
    const { id } = req.params;

    try {
        const location = await Location.findByPk(id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        res.json(location);
    } catch (err) {
        console.error('Error retrieving location', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// SSE route
exports.sendSSEEvent = (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    res.flushHeaders();

    // Create a new SSE connection
    const client = res;

    // Add the SSE connection to the clients array
    clients.push(client);

    // Handle SSE connection close event
    client.on('close', () => {
        // Remove the SSE connection from the clients array
        const index = clients.indexOf(client);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    });

    // Send initial SSE event with the current locations
    sendSSEEvent(client, []);

    // Check for changes every second
    setInterval(() => {
        checkForChanges(client);
    }, 10000);
};

const sendSSEEvent = (client, data) => {
    const formattedData = JSON.stringify(data);

    client.write(`data: ${formattedData}\n\n`);
};

const checkForChanges = async (client) => {
    try {
        const locations = await Location.findAll({
            order: [['id', 'ASC']]
        });

        const currentChangeTimestamp = new Date().getTime();

        if (lastChangeTimestamp === null || lastChangeTimestamp < currentChangeTimestamp) {
            lastChangeTimestamp = currentChangeTimestamp;

            // Compare lastLocations and newLocations
            const hasChanged = JSON.stringify(lastLocations) !== JSON.stringify(locations);
            if (hasChanged) {
                sendSSEEvent(client, { hasChanged });
            }
            
        }
    } catch (err) {
        console.error('Error checking for changes', err);
    }
};

// POST /locations
exports.createLocation = async (req, res) => {
    const { latitude, longitude, name, types, address, status } = req.body;
    try {
        const newLocation = await Location.create({ latitude, longitude, name, types, address, status });
        
        // Send SSE event to notify clients about the change
        setTimeout(() => {
            checkForChanges(res);
        }, 1000);

        return res.status(201).json(newLocation);
    } catch (err) {
        console.error('Error creating location', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// PUT /locations/:id
exports.updateLocation = async (req, res) => {
    const { id } = req.params;
    const { latitude, longitude, name, status, types } = req.body;

    try {
        const location = await Location.findByPk(id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        if (latitude) {
            location.latitude = latitude;
        }
        if (longitude) {
            location.longitude = longitude;
        }
        if (name) {
            location.name = name;
        }
        if (status) {
            location.status = status;
        }
        if (types) {
            location.types = types;
        }
        await location.save();

        // Send SSE event to notify clients about the change
        setTimeout(() => {
            checkForChanges(res);
        }, 1000);

        return res.json(location);
    } catch (err) {
        console.error('Error updating location', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// DELETE /locations/:id
exports.deleteLocation = async (req, res) => {
    const { id } = req.params;

    try {
        const location = await Location.findByPk(id);
        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }
        await location.destroy();

        // Send SSE event to notify clients about the change
        sendSSEEvent({ id });

        res.sendStatus(204);
    } catch (err) {
        console.error('Error deleting location', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.submitLocation = async (req, res) => {
    const { latitude, longitude } = req.body;

    // Set the radius to 20km (in meters)
    const radius = 20000;

    try {
        const locations = await Location.findAll({
            where: {
                latitude: {
                    [Op.between]: [
                        latitude - (radius / 111000), // Approx. latitude degrees per meter
                        latitude + (radius / 111000),
                    ],
                },
                longitude: {
                    [Op.between]: [
                        longitude - (radius / (111000 * Math.cos(latitude * Math.PI / 180))), // Approx. longitude degrees per meter
                        longitude + (radius / (111000 * Math.cos(latitude * Math.PI / 180))),
                    ],
                },
                status: 'approved',
            },
        });
        // Format the response data
        const formattedLocations = locations.map((location) => ({
            id: location.id,
            lat: location.latitude,
            lng: location.longitude,
            name: location.name,
            types: location.types,
            address: location.address,
        }));
        res.json(formattedLocations);
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

