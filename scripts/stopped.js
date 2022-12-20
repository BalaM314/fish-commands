const config = require('config');

const ip = config.ip;

const addStopped = (id) => {
  const req = Http.post(`http://` + ip + `:5000/api/addStopped`, JSON.stringify({ id: id }))
    .header('Content-Type', 'application/json')
    .header('Accept', '*/*');
  req.timeout = 10000;

  try {
    req.submit((response, exception) => {
      Log.info(response.getResultAsString());
      if (exception || !response) {
        Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
      }
    });
  } catch (e) {
    Log.info('\n\nStopped API encountered an error while trying to add a stopped player.\n\n');
  }
};

const free = (id) => {
  const req = Http.post(`http://` + ip + `:5000/api/free`, JSON.stringify({ id: id }))
    .header('Content-Type', 'application/json')
    .header('Accept', '*/*');
  req.timeout = 10000;

  try {
    req.submit((response, exception) => {
      Log.info(response.getResultAsString());
      if (exception || !response) {
        Log.info('\n\nStopped API encountered an error while trying to free a stopped player.\n\n');
      }
    });
  } catch (e) {
    Log.info('\n\nStopped API encountered an error while trying to free a stopped player.\n\n');
  }
};

module.exports = {
  addStopped: addStopped,
  free: free,
};
