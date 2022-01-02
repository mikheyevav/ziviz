var viz_types = require("./viz_types.json");

commons = viz_types["_common_options"];
delete viz_types["_common_options"];

let v = Object.keys(viz_types);

v.forEach( (i) => {
  candidate = new Map(Object.entries(viz_types[i]));
  if (candidate.has("_common_options")) {
    candidate.get("_common_options").forEach( (j) => {candidate.set(j, commons[j])} );
  }
  candidate.delete("_common_options");
  viz_types[i] = candidate;
} )

module.exports = viz_types
