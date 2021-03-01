var widgets = require('@jupyter-widgets/base');

let init_module = require("./init.js");
const viz_types = require("./viz_types.js");

let create_selector_from_array = function (ar, selected_item=undefined){
  let s = document.createElement('select');
  s.classList.add("ziviz_observe");
  ar.forEach(
    function(el){
      let o = document.createElement('option');
      o.setAttribute("value",el);
      o.innerHTML = el;
      if(el==selected_item){
        o.setAttribute("selected",true);
      }
      s.appendChild(o);
    }
  )
  return s
}

let update_header = function (el, model) {
  let axis_list = model.get("axis_options");
  let viz_type_el = el.querySelector("[data-ziviz_type='viz_type']");
  let cur_viz_type = viz_type_el.value;
  let available_options = viz_types[cur_viz_type];
  let avail_opts_keys = Array.from(viz_types[cur_viz_type].keys());
  let viz_params = new Map( model.get("viz_params")?.v?.map(i => [i.id, i.val]));

  // Remove those that are impossible
  el.querySelectorAll("div.ziviz_option_container").forEach( function(i) {
    let opt = i.querySelector("select").dataset.ziviz_type;
    if(!(avail_opts_keys.includes(opt))){
      i.remove();
    }
  });

  // Add those that become possible
  for(var k=0;k<avail_opts_keys.length;k++){
    let opt_name = avail_opts_keys[k];
    let opt_vals = available_options.get(opt_name) ;
    let prev_opt = (k==0? null : avail_opts_keys[k-1] );
    if (el.querySelectorAll("[data-ziviz_type='"+opt_name+"']").length==0 ){
      // Create element
      let option_container = document.createElement('div');
      option_container.classList.add("ziviz_option_container");
      option_container.appendChild(document.createTextNode(opt_name+":"));

      var arr= ( (opt_vals==="%axis_selector") ? axis_list : opt_vals )
      let col_selector = create_selector_from_array(arr, viz_params?.get(opt_name));
      col_selector.setAttribute("data-ziviz_type",opt_name);
      col_selector.addEventListener('change', function (){
        selection_changed_cb(el, model);
      });
      option_container.appendChild(col_selector);

      var prev_el = null;
      if (prev_opt != null){
        prev_el = el.querySelector("[data-ziviz_type='"+prev_opt+"']")
        if(prev_el===undefined){
          prev_el = null;
        } else {
          prev_el = prev_el.parentNode;
        }
      }
      prev_el == null ?  el.querySelector(".ziviz_options").prepend( option_container ) : prev_el.parentNode.insertBefore(option_container, prev_el.nextSibling);
    }
  }
}

let selection_changed_cb = function( el, model ) {
  let canv = el.querySelector("div.ziviz_canvas");
  canv.innerHTML="";
  update_header( el, model );
  let viz = {"v": Array.from( el.querySelectorAll(".ziviz_observe") , (i) => ({"id":i.dataset.ziviz_type, "val": i.value}) ) };
  model.set("viz_params",viz);
  model.save_changes();
}

let get_source_cb = function( el, model ) {
  let canv = el.querySelector("div.ziviz_canvas");
  canv.innerHTML=model.get("viz_code");
}

let get_header_html = function (el, model) {
  
  let viz_params = new Map( model.get("viz_params")?.v?.map(i => [i.id, i.val]));

  let header = document.createElement('div');
  header.classList.add("ziviz_header");

  let viz_type = create_selector_from_array(Object.keys(viz_types), viz_params?.get("viz_type") );
  viz_type.setAttribute("data-ziviz_type","viz_type");
  viz_type.classList.add("ziviz_viz_type");

  viz_type.addEventListener('change', function (){
    selection_changed_cb(el, model);
  });
  header.appendChild(viz_type);

  let b = document.createElement("button");
  b.innerHTML = "Source code";
  b.addEventListener('click', function (){
    get_source_cb(el, model);
  });
  header.appendChild(b);

  el.appendChild(header);

  let d1 = document.createElement('div');
  d1.classList.add("ziviz_options");
  el.appendChild(d1);

  update_header( el, model );
  
  let d2 = document.createElement('div');
  d2.classList.add("ziviz_canvas");
  el.appendChild(d2);

}

var ZivizModel = widgets.DOMWidgetModel.extend({
    defaults: Object.assign(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name : 'ZivizModel',
        _view_name : 'ZivizView',
        _model_module : 'ziviz',
        _view_module : 'ziviz',
        _model_module_version : '0.1.3',
        _view_module_version : '0.1.3'
    })
});


var ZivizView = widgets.DOMWidgetView.extend({

  render: function() { 
    // return if there is one registered callback
    
    if (this.model._events["change:viz"]){
      if (this.model._events["change:viz"].length>0){
      this.el.innerHTML="Only one view per widget is allowed.";
      return;
      }
    }


    init_module.inject_js(this.model);
    get_header_html(this.el, this.model);
    this.model.on('change:viz', this.viz_changed, this);

    if ( this.model.get("viz_params")?.v?.length > 0 ){
      let viz = Object.assign({},this.model.get("viz_params")) ;
      if (viz?.n){
        viz["n"]++;
      } 
      else {
        viz["n"]=1;
      }

      this.model.set("viz_params",viz);
      this.model.save_changes();
    }

    
  },

  viz_changed: function() {
    let s = this.model.get('viz');
    let canv = this.el.querySelector(".ziviz_canvas");
    canv.innerHTML=s;
    canv.querySelectorAll("script").forEach( function(i) {
      eval(i.textContent);
    })
  }
});

module.exports = {
    ZivizModel: ZivizModel,
    ZivizView: ZivizView
};
