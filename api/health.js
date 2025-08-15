// api/health.js
module.exports = async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify({
        status: 'ok',
        ts: new Date().toISOString()
    }));
};