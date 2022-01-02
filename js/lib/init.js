let already_run = false;

function final_inject(model){
  if (!already_run){
    new Function (model.get('plotly_js'))();
    already_run = true;
  } 
}

function inject_js(model){
  if (already_run){
    return
  }

  model.on('change:plotly_js', final_inject, model);
  let v = "";
  if ( typeof global.require == "undefined" ){
    v = typeof global.Plotly == "undefined" ? "lab_inc" : "lab_not_inc" 
  } else {
    v = "nb";
  }
  model.set("plotly_js_req", v);
}

module.exports =  { 
  inject_js: inject_js
};
