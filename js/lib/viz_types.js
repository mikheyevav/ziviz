var viz_types = require("./viz_types.json");

let v = Object.keys(viz_types);
v.forEach( (i) => {
  viz_types[i] = new Map(Object.entries(viz_types[i]));
} )

module.exports = viz_types
