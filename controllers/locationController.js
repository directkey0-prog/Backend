const nigerianLocations = require('../data/nigerianLocations');

const getStates = (req, res) => {
  res.json(Object.keys(nigerianLocations));
};

const getLGAs = (req, res) => {
  const { state } = req.params;
  const stateData = nigerianLocations[state];
  if (!stateData) return res.status(404).json({ error: 'State not found' });
  res.json(Object.keys(stateData));
};

const getAreas = (req, res) => {
  const { state, lga } = req.params;
  const stateData = nigerianLocations[state];
  if (!stateData) return res.status(404).json({ error: 'State not found' });
  const lgaData = stateData[lga];
  if (!lgaData) return res.status(404).json({ error: 'LGA not found' });
  res.json(lgaData);
};

module.exports = { getStates, getLGAs, getAreas };
