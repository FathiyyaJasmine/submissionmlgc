require('dotenv').config();
const tf = require('@tensorflow/tfjs-node');
const Hapi = require('@hapi/hapi');
const { Firestore } = require('@google-cloud/firestore');
const { ClientIssue, InputIssue } = require('./error');
const predictClassification = require('./predict');
const crypto = require('crypto');

async function loadModel() {
    try {
        console.log('Loading model from:', process.env.MODEL_URL);
        const model = await tf.loadGraphModel(process.env.MODEL_URL);
        console.log('Model loaded successfully!');
        return model;
    } catch (error) {
        console.error('Error loading TensorFlow model:', error);
        throw new Error('Model loading failed');
    }
}

async function storeData(id, data) {
    const db = new Firestore();
    const predictCollection = db.collection('predictions');
    try {
        await predictCollection.doc(id).set(data);
    } catch (error) {
        console.error('Error storing data in Firestore:', error);
        throw new Error('Data storage failed');
    }
}

async function postPredictHandler(request, h) {
    const { image } = request.payload;
    const { model } = request.server.app;

    console.log('Received payload size:', image.length);

    if (image.length > 1000000) {
        return h.response({
            status: 'fail',
            message: 'Payload content length exceeds maximum allowed: 1000000',
        }).code(413); 
    }

    try {
        const { label, suggestion } = await predictClassification(model, image);
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const data = { id, result: label, suggestion, createdAt };
        await storeData(id, data);

        return h.response({
            status: 'success',
            message: 'Model is predicted successfully',
            data,
        }).code(201); 
    } catch (error) {
        console.error('Prediction error:', error);
        return h.response({
            status: 'fail',
            message: 'Terjadi kesalahan dalam melakukan prediksi',
        }).code(400); 
    }
}

async function getHistoriesHandler(request, h) {
    const db = new Firestore();
    const predictCollection = db.collection('predictions');
    try {
        const snapshot = await predictCollection.get();
        const histories = [];
        
        snapshot.forEach((doc) => {
            histories.push({
                id: doc.id,
                history: doc.data(),
            });
        });

        return h.response({
            status: 'success',
            data: histories,
        }).code(200); // OK
    } catch (error) {
        console.error('Error fetching histories:', error);
        return h.response({
            status: 'fail',
            message: 'Unable to fetch prediction histories',
        }).code(500); 
    }
}

(async () => {
    const server = Hapi.server({
        port: 8080,
        host: '0.0.0.0',
        routes: {
            cors: { origin: ['*'] },
        },
    });

    try {
        const model = await loadModel();
        server.app.model = model;

        server.route([
            {
                path: '/predict',
                method: 'POST',
                handler: postPredictHandler,
                options: {
                    payload: {
                        allow: 'multipart/form-data',
                        multipart: true,
                        maxBytes: 1000000,
                        parse: true,
                    },
                },
            },
            {
                path: '/predict/histories',
                method: 'GET',
                handler: getHistoriesHandler,
            },
        ]);

        server.ext('onPreResponse', (request, h) => {
            const response = request.response;

            if (response instanceof ClientIssue) {
                return h.response({
                    status: 'fail',
                    message: response.message,
                }).code(response.statusCode);
            }

            if (response.isBoom) {
                console.error('Server error:', response.message);
                return h.response({
                    status: 'fail',
                    message: response.message,
                }).code(response.output.statusCode);
            }

            return h.continue;
        });

        await server.start();
        console.log(`Server started at: ${server.info.uri}`);
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
})();
